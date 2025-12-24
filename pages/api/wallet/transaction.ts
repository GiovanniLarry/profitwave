import { NextApiRequest, NextApiResponse } from 'next'
import { MongoClient, Db } from 'mongodb'

if (!process.env.MONGODB_URI) {
  throw new Error('Invalid/Missing environment variable: "MONGODB_URI"')
}

const uri = process.env.MONGODB_URI
const options = {}

let client: MongoClient
let clientPromise: Promise<MongoClient>

declare global {
  var _mongoClientPromise: Promise<MongoClient>
}

if (process.env.NODE_ENV === 'development') {
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, options)
    global._mongoClientPromise = client.connect()
  }
  clientPromise = global._mongoClientPromise
} else {
  client = new MongoClient(uri, options)
  clientPromise = client.connect()
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const { type, amount, method } = req.body

    if (!type || !amount || !method) {
      return res.status(400).json({ message: 'Missing required fields' })
    }

    if (!['deposit', 'withdrawal'].includes(type)) {
      return res.status(400).json({ message: 'Invalid transaction type' })
    }

    if (amount <= 0) {
      return res.status(400).json({ message: 'Amount must be positive' })
    }

    // Get the user from the Authorization header
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Unauthorized' })
    }

    const token = authHeader.substring(7)
    
    // Decode Firebase token to get user UID
    let firebaseUid: string
    
    try {
      // For now, we'll use a simple approach - in production, you'd verify the Firebase token
      // Decode the JWT token payload to get the user ID
      const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString())
      firebaseUid = payload.user_id || payload.sub || payload.uid
      
      if (!firebaseUid) {
        return res.status(401).json({ message: 'Invalid token - no user ID found' })
      }
    } catch (tokenError) {
      console.error('Token decoding error:', tokenError)
      return res.status(401).json({ message: 'Invalid token format' })
    }
    
    const client = await clientPromise
    const db = client.db('profitwave')
    const usersCollection = db.collection('users')
    
    const user = await usersCollection.findOne({ firebaseUid })
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    // Create transaction record
    const transaction = {
      id: new Date().getTime().toString(),
      type,
      amount,
      method,
      status: 'completed',
      timestamp: new Date(),
      description: `${type.charAt(0).toUpperCase() + type.slice(1)} via ${method.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}`
    }

    // Update user balance
    const newBalance = type === 'deposit' 
      ? user.balance + amount 
      : user.balance - amount

    if (newBalance < 0) {
      return res.status(400).json({ message: 'Insufficient balance' })
    }

    // Update user document
    const updateResult = await usersCollection.updateOne(
      { firebaseUid },
      {
        $set: {
          balance: newBalance,
          updatedAt: new Date()
        },
        $push: {
          transactions: {
            $each: [transaction],
            $position: 0,
            $slice: 50 // Keep only last 50 transactions
          } as any
        } as any
      }
    )

    if (updateResult.matchedCount === 0) {
      return res.status(404).json({ message: 'User not found' })
    }

    // Return updated user data
    const updatedUser = await usersCollection.findOne({ firebaseUid })

    res.status(200).json({
      message: 'Transaction successful',
      balance: updatedUser?.balance || 0,
      transaction
    })

  } catch (error) {
    console.error('Transaction error:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
}
