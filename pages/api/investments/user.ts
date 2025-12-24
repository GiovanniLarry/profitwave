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
const inMemoryInvestments = (typeof global !== 'undefined' && global.inMemoryInvestments) ? global.inMemoryInvestments : new Map()
if (typeof global !== 'undefined') {
  global.inMemoryInvestments = inMemoryInvestments
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

  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET'])
    return res.status(405).end(`Method ${req.method} Not Allowed`)
  }

  try {
    console.log('Fetching investments for user:', userId)

    // Get user investments
    let investments = []
    if (isMongoDBConfigured) {
      try {
        const investmentCollection = await getInvestmentsCollection()
        investments = await investmentCollection.find({ userId: userId }).sort({ createdAt: -1 }).toArray()
      } catch (mongoError) {
        console.error('MongoDB error fetching investments:', mongoError)
        // Fallback to in-memory
        investments = Array.from(inMemoryInvestments.values()).filter((inv: any) => inv.userId === userId)
      }
    } else {
      investments = Array.from(inMemoryInvestments.values()).filter((inv: any) => inv.userId === userId)
    }

    // Calculate investment statistics
    const totalInvested = investments.reduce((sum: number, inv: any) => sum + inv.amount, 0)
    const totalReturns = investments.reduce((sum: number, inv: any) => sum + inv.returnAmount, 0)
    const activeProjects = investments.filter((inv: any) => inv.status === 'active').length
    
    // Calculate monthly returns (full expected returns for 30 days from all active investments)
    const monthlyReturns = investments.reduce((sum: number, inv: any) => {
      if (inv.status === 'active') {
        const daysInMonth = 30
        const dailyReturn = inv.dailyReturn || 0
        const expectedMonthlyReturn = daysInMonth * dailyReturn
        return sum + expectedMonthlyReturn
      }
      return sum
    }, 0)

    // Calculate daily returns (current daily earnings from all active investments)
    const dailyReturns = investments.reduce((sum: number, inv: any) => {
      if (inv.status === 'active') {
        return sum + (inv.dailyReturn || 0)
      }
      return sum
    }, 0)

    // Format investments for response
    const formattedInvestments = investments.map((investment: any) => {
      const daysPassed = Math.floor((new Date().getTime() - new Date(investment.startDate).getTime()) / (1000 * 60 * 60 * 24))
      const totalDays = investment.period || 28
      const progress = Math.min((daysPassed / totalDays) * 100, 100)
      
      // Calculate current returns based on days passed
      const currentReturns = Math.min(daysPassed, totalDays) * (investment.dailyReturn || 0)
      
      return {
        id: investment._id?.toString() || investment.id,
        planId: investment.planId,
        planName: investment.planName,
        amount: investment.amount,
        returnAmount: investment.returnAmount,
        period: investment.period,
        dailyReturn: investment.dailyReturn,
        status: investment.status,
        startDate: investment.startDate,
        endDate: investment.endDate,
        currentReturn: currentReturns,
        progress: progress,
        daysPassed: daysPassed,
        totalDays: totalDays,
        createdAt: investment.createdAt
      }
    })

    res.status(200).json({
      investments: formattedInvestments,
      statistics: {
        totalInvested: totalInvested,
        totalReturns: totalReturns,
        monthlyReturns: monthlyReturns,
        dailyReturns: dailyReturns,
        activeProjects: activeProjects,
        totalInvestments: investments.length
      }
    })

  } catch (error) {
    console.error('Error fetching investments:', error)
    res.status(500).json({ error: 'Internal server error', details: error.message })
  }
}
