import { NextApiRequest, NextApiResponse } from 'next'
import { MongoClient, Db, ObjectId } from 'mongodb'
import { getAuth } from 'firebase/auth'
import { auth } from '../../../lib/firebase'
import admin from 'firebase-admin'

// Firebase configuration is handled in lib/firebase.ts

// Check if MongoDB URI is configured and not using placeholder
const isMongoDBConfigured = process.env.MONGODB_URI && !process.env.MONGODB_URI.includes('username:password')

if (!process.env.MONGODB_URI) {
  throw new Error('Please add your MongoDB URI to .env.local')
}

const mongoUri = process.env.MONGODB_URI
const mongoOptions = {}

let client: MongoClient
let clientPromise: Promise<MongoClient>

if (process.env.NODE_ENV === 'development') {
  let globalWithMongo = global as typeof global & {
    _mongoClientPromise?: Promise<MongoClient>
  }

  if (!globalWithMongo._mongoClientPromise) {
    client = new MongoClient(mongoUri, mongoOptions)
    globalWithMongo._mongoClientPromise = client.connect()
  }
  clientPromise = globalWithMongo._mongoClientPromise
} else {
  client = new MongoClient(mongoUri, mongoOptions)
  clientPromise = client.connect()
}

async function getDatabase(): Promise<Db> {
  const client = await clientPromise
  return client.db('profitwave')
}

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  try {
    const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
    if (serviceAccountKey) {
      const serviceAccount = JSON.parse(serviceAccountKey)
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
      })
    } else {
      // Fallback for development - use environment variables
      admin.initializeApp({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
      })
    }
  } catch (error) {
    console.error('Firebase Admin SDK initialization error:', error)
  }
}

// Global in-memory storage for development when MongoDB isn't available
const inMemoryUsers = (typeof global !== 'undefined' && global.inMemoryUsers) ? global.inMemoryUsers : new Map()
const inMemoryInvestments = (typeof global !== 'undefined' && global.inMemoryInvestments) ? global.inMemoryInvestments : new Map()
if (typeof global !== 'undefined') {
  global.inMemoryUsers = inMemoryUsers
  global.inMemoryInvestments = inMemoryInvestments
}

// Define user interface for in-memory storage
interface User {
  firebaseUid: string
  balance: number
  updatedAt: Date
}

// Define investment interface
interface Investment {
  userId: string
  planId: string
  planName: string
  amount: number
  returnAmount: number
  period: number
  dailyReturn: number
  status: 'active' | 'completed' | 'cancelled'
  startDate: Date
  endDate: Date
  currentReturn: number
  createdAt: Date
}

async function getUsersCollection() {
  const db = await getDatabase()
  return db.collection('users')
}

async function getInvestmentsCollection() {
  const db = await getDatabase()
  return db.collection('investments')
}

// Check user authentication and verify Firebase token
async function checkAuth(req: NextApiRequest): Promise<string | null> {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }

  try {
    const token = authHeader.substring(7)
    const decodedToken = await admin.auth().verifyIdToken(token)
    return decodedToken.uid
  } catch (error) {
    console.error('Token verification failed:', error)
    return null
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Check authentication and get user ID
  const userId = await checkAuth(req)
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    return res.status(405).end(`Method ${req.method} Not Allowed`)
  }

  try {
    const { planId, amount, planName, returnAmount, period, dailyReturn } = req.body
    
    // Validate input
    if (!planId || !amount || !planName || !returnAmount || !period || !dailyReturn) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        details: 'planId, amount, planName, returnAmount, period, and dailyReturn are required'
      })
    }

    if (isNaN(amount) || parseFloat(amount) <= 0) {
      return res.status(400).json({ 
        error: 'Invalid amount',
        details: 'Amount must be a positive number'
      })
    }

    console.log('Processing investment:', { userId, planId, amount, planName })

    // Find the user and check balance
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

    // Check if user has sufficient balance
    const currentBalance = user.balance || 0
    const investmentAmount = parseFloat(amount)
    
    if (currentBalance < investmentAmount) {
      return res.status(400).json({ 
        error: 'Insufficient balance',
        details: `You need ${investmentAmount.toLocaleString()} XAF but only have ${currentBalance.toLocaleString()} XAF available`
      })
    }

    // Calculate end date
    const startDate = new Date()
    const endDate = new Date(startDate)
    endDate.setDate(startDate.getDate() + period)

    // Create investment record
    const investment: Investment = {
      userId: userId,
      planId: planId,
      planName: planName,
      amount: investmentAmount,
      returnAmount: parseFloat(returnAmount),
      period: period,
      dailyReturn: parseFloat(dailyReturn),
      status: 'active',
      startDate: startDate,
      endDate: endDate,
      currentReturn: 0,
      createdAt: new Date()
    }

    // Save investment record
    let savedInvestment = null
    if (isMongoDBConfigured) {
      try {
        const investments = await getInvestmentsCollection()
        const result = await investments.insertOne(investment)
        savedInvestment = { ...investment, _id: result.insertedId }
        console.log('Investment saved to MongoDB:', savedInvestment)
      } catch (mongoError) {
        console.error('MongoDB error saving investment:', mongoError)
        // Fallback to in-memory
        const investmentId = new ObjectId().toString()
        savedInvestment = { ...investment, _id: investmentId }
        inMemoryInvestments.set(investmentId, savedInvestment)
        console.log('Investment saved to in-memory storage:', savedInvestment)
      }
    } else {
      const investmentId = new ObjectId().toString()
      savedInvestment = { ...investment, _id: investmentId }
      inMemoryInvestments.set(investmentId, savedInvestment)
      console.log('Investment saved to in-memory storage:', savedInvestment)
    }

    // Update user balance (deduct investment amount)
    const newBalance = currentBalance - investmentAmount

    if (isMongoDBConfigured) {
      try {
        const users = await getUsersCollection()
        await users.updateOne(
          { firebaseUid: userId },
          { $set: { balance: newBalance, updatedAt: new Date() } }
        )
        console.log('User balance updated in MongoDB:', { userId, newBalance })
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

    res.status(200).json({
      message: 'Investment created successfully',
      investment: savedInvestment,
      newBalance: newBalance,
      user: {
        fullName: user.fullName,
        email: user.email
      }
    })

  } catch (error) {
    console.error('Error creating investment:', error)
    res.status(500).json({ error: 'Internal server error', details: error.message })
  }
}
