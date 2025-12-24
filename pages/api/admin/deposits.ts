import { NextApiRequest, NextApiResponse } from 'next'
import { MongoClient, Db, ObjectId } from 'mongodb'

// Check if MongoDB URI is configured and not using placeholder
const isMongoDBConfigured = process.env.MONGODB_URI && !process.env.MONGODB_URI.includes('username:password')

// Only throw error if we're in production and don't have MongoDB
if (process.env.NODE_ENV === 'production' && !isMongoDBConfigured) {
  throw new Error('MongoDB URI is required in production')
}

const uri = process.env.MONGODB_URI
const options = {}

let client: MongoClient
let clientPromise: Promise<MongoClient>

// Only initialize MongoDB if it's configured
if (isMongoDBConfigured) {
  if (process.env.NODE_ENV === 'development') {
    let globalWithMongo = global as typeof global & {
      _mongoClientPromise?: Promise<MongoClient>
    }

    if (!globalWithMongo._mongoClientPromise) {
      client = new MongoClient(uri!, options)
      globalWithMongo._mongoClientPromise = client.connect()
    }
    clientPromise = globalWithMongo._mongoClientPromise
  } else {
    client = new MongoClient(uri!, options)
    clientPromise = client.connect()
  }
}

// Global in-memory storage for development when MongoDB isn't available
const inMemoryUsers = (typeof global !== 'undefined' && global.inMemoryUsers) ? global.inMemoryUsers : new Map()
const inMemoryDeposits = (typeof global !== 'undefined' && global.inMemoryDeposits) ? global.inMemoryDeposits : new Map()
if (typeof global !== 'undefined') {
  global.inMemoryUsers = inMemoryUsers
  global.inMemoryDeposits = inMemoryDeposits
}

// Define user interface for in-memory storage
interface User {
  firebaseUid: string
  balance: number
  updatedAt: Date
}

async function getDatabase(): Promise<Db> {
  if (!clientPromise) {
    throw new Error('MongoDB is not configured')
  }
  const client = await clientPromise
  return client.db('profitwave')
}

async function getUsersCollection() {
  const db = await getDatabase()
  return db.collection('users')
}

async function getDepositsCollection() {
  const db = await getDatabase()
  return db.collection('deposits')
}

// Check admin authentication
function checkAuth(req: NextApiRequest) {
  const authHeader = req.headers.authorization
  if (authHeader === 'Bearer admin-token') {
    return true
  }
  
  // Check session cookie
  const sessionCookie = req.cookies.adminSession
  if (sessionCookie === 'admin-logged-in') {
    return true
  }
  
  return false
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Check admin authentication
  if (!checkAuth(req)) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  if (req.method === 'POST') {
    try {
      const { userId, amount, description, method = 'admin' } = req.body
      
      // Validate input
      if (!userId || !amount || !description) {
        return res.status(400).json({ 
          error: 'Missing required fields',
          details: 'userId, amount, and description are required'
        })
      }
      
      if (isNaN(amount) || parseFloat(amount) <= 0) {
        return res.status(400).json({ 
          error: 'Invalid amount',
          details: 'Amount must be a positive number in XAF'
        })
      }

      console.log('Processing deposit:', { userId, amount, description, method })

      // Find the user
      let user = null
      if (isMongoDBConfigured) {
        try {
          const users = await getUsersCollection()
          user = await users.findOne({ firebaseUid: userId })
        } catch (mongoError) {
          console.error('MongoDB error finding user:', mongoError)
          // Fallback to in-memory
          user = Array.from(inMemoryUsers.values()).find((u: any) => u.firebaseUid === userId)
        }
      } else {
        user = Array.from(inMemoryUsers.values()).find((u: any) => u.firebaseUid === userId)
      }

      if (!user) {
        return res.status(404).json({ error: 'User not found' })
      }

      // Create deposit record
      const deposit = {
        userId: userId,
        amount: parseFloat(amount),
        description: description || `Admin deposit of ${amount} XAF`,
        method: method,
        status: 'completed',
        createdAt: new Date(),
        processedBy: 'admin'
      }

      // Update user balance - add to current balance
      const currentBalance = user.balance || 0
      const newBalance = currentBalance + parseFloat(amount)

      // Save deposit record
      let savedDeposit = null
      if (isMongoDBConfigured) {
        try {
          const deposits = await getDepositsCollection()
          const result = await deposits.insertOne(deposit)
          savedDeposit = { ...deposit, _id: result.insertedId }
          console.log('Deposit saved to MongoDB:', savedDeposit)
        } catch (mongoError) {
          console.error('MongoDB error saving deposit:', mongoError)
          // Fallback to in-memory
          const depositId = Date.now().toString()
          savedDeposit = { ...deposit, _id: depositId }
          inMemoryDeposits.set(depositId, savedDeposit)
          console.log('Deposit saved to in-memory storage:', savedDeposit)
        }
      } else {
        const depositId = Date.now().toString()
        savedDeposit = { ...deposit, _id: depositId }
        inMemoryDeposits.set(depositId, savedDeposit)
        console.log('Deposit saved to in-memory storage:', savedDeposit)
      }

      // Update user balance
      if (isMongoDBConfigured) {
        try {
          const users = await getUsersCollection()
          console.log('Updating balance in MongoDB for user:', userId)
          console.log('Current balance:', currentBalance)
          console.log('Deposit amount:', parseFloat(amount))
          console.log('New balance:', newBalance)
          
          const result = await users.updateOne(
            { firebaseUid: userId },
            { $set: { balance: newBalance, updatedAt: new Date() } }
          )
          
          console.log('MongoDB update result:', result)
          console.log('Balance updated in MongoDB successfully')
        } catch (mongoError) {
          console.error('MongoDB error updating balance:', mongoError)
          // Fallback to in-memory
          const existingUser = Array.from(inMemoryUsers.values()).find((u: any) => u.firebaseUid === userId) as User
          if (existingUser) {
            existingUser.balance = newBalance
            existingUser.updatedAt = new Date()
            inMemoryUsers.set(userId, existingUser)
            console.log('User balance updated in in-memory storage:', { userId, newBalance })
          }
        }
      } else {
        const existingUser = Array.from(inMemoryUsers.values()).find((u: any) => u.firebaseUid === userId) as User
        if (existingUser) {
          existingUser.balance = newBalance
          existingUser.updatedAt = new Date()
          inMemoryUsers.set(userId, existingUser)
          console.log('User balance updated in in-memory storage:', { userId, newBalance })
        }
      }

      // Store balance update notification for real-time updates
      if (typeof global !== 'undefined') {
        const balanceUpdates = global.balanceUpdates || new Map()
        balanceUpdates.set(userId, {
          newBalance,
          timestamp: new Date(),
          type: 'admin_deposit',
          amount: parseFloat(amount)
        })
        global.balanceUpdates = balanceUpdates
        console.log('Balance update notification stored for user:', userId)
      }

      res.status(200).json({
        message: 'Deposit processed successfully',
        deposit: savedDeposit,
        newBalance: newBalance,
        user: {
          fullName: user.fullName,
          email: user.email
        }
      })

    } catch (error) {
      console.error('Error processing deposit:', error)
      res.status(500).json({ error: 'Internal server error', details: error.message })
    }
  } else if (req.method === 'GET') {
    try {
      const { userId } = req.query
      
      if (!userId) {
        return res.status(400).json({ error: 'User ID is required' })
      }

      // Get deposit history for user
      let deposits = []
      if (isMongoDBConfigured) {
        try {
          const depositCollection = await getDepositsCollection()
          deposits = await depositCollection.find({ userId: userId }).sort({ createdAt: -1 }).toArray()
        } catch (mongoError) {
          console.error('MongoDB error fetching deposits:', mongoError)
          // Fallback to in-memory
          deposits = Array.from(inMemoryDeposits.values()).filter((d: any) => d.userId === userId)
        }
      } else {
        deposits = Array.from(inMemoryDeposits.values()).filter((d: any) => d.userId === userId)
      }

      res.status(200).json({ deposits })
    } catch (error) {
      console.error('Error fetching deposits:', error)
      res.status(500).json({ error: 'Internal server error', details: error.message })
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST'])
    res.status(405).end(`Method ${req.method} Not Allowed`)
  }
}
