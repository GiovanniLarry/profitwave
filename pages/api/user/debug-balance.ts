import { NextApiRequest, NextApiResponse } from 'next'

// MongoDB connection
const uri = process.env.MONGODB_URI

// Use the same global in-memory storage as the other APIs
const inMemoryUsers = (typeof global !== 'undefined' && global.inMemoryUsers) ? global.inMemoryUsers : new Map()
if (typeof global !== 'undefined') {
  global.inMemoryUsers = inMemoryUsers
}

// Check if MongoDB URI is configured and not using placeholder
const isMongoDBConfigured = process.env.MONGODB_URI && !process.env.MONGODB_URI.includes('username:password')

async function getDatabase() {
  if (!isMongoDBConfigured) {
    throw new Error('MongoDB is not configured')
  }
  const { MongoClient } = require('mongodb')
  const client = new MongoClient(uri!)
  await client.connect()
  return client.db('profitwave')
}

async function getUsersCollection() {
  const db = await getDatabase()
  return db.collection('users')
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Get token from Authorization header
    const token = req.headers.authorization?.split('Bearer ')[1]
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' })
    }

    let decodedToken
    try {
      // Decode Firebase token to get user UID
      const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString())
      decodedToken = { uid: payload.user_id || payload.sub, email: payload.email }
    } catch (tokenError) {
      console.error('Token verification failed:', tokenError)
      return res.status(401).json({ error: 'Invalid token' })
    }

    console.log('Debug: Fetching user data for Firebase UID:', decodedToken.uid)

    // Check MongoDB first
    let mongoUser = null
    if (isMongoDBConfigured) {
      try {
        const users = await getUsersCollection()
        mongoUser = await users.findOne({ firebaseUid: decodedToken.uid })
        console.log('Debug: MongoDB user found:', mongoUser ? 'YES' : 'NO')
        if (mongoUser) {
          console.log('Debug: MongoDB user balance:', mongoUser.balance)
        }
      } catch (mongoError) {
        console.error('Debug: MongoDB error:', mongoError)
      }
    }

    // Check in-memory storage
    let memoryUser = null
    memoryUser = Array.from(inMemoryUsers.values()).find((u: any) => u.firebaseUid === decodedToken.uid)
    console.log('Debug: Memory user found:', memoryUser ? 'YES' : 'NO')
    if (memoryUser) {
      console.log('Debug: Memory user balance:', memoryUser.balance)
    }

    return res.status(200).json({
      firebaseUid: decodedToken.uid,
      email: decodedToken.email,
      mongoUser: mongoUser ? {
        balance: mongoUser.balance,
        email: mongoUser.email,
        fullName: mongoUser.fullName
      } : null,
      memoryUser: memoryUser ? {
        balance: memoryUser.balance,
        email: memoryUser.email,
        fullName: memoryUser.fullName
      } : null,
      isMongoDBConfigured
    })

  } catch (error) {
    console.error('Debug endpoint error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
