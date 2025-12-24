import { NextApiRequest, NextApiResponse } from 'next'
import { MongoClient, Db } from 'mongodb'

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
const inMemoryDeposits = (typeof global !== 'undefined' && global.inMemoryDeposits) ? global.inMemoryDeposits : new Map()
if (typeof global !== 'undefined') {
  global.inMemoryDeposits = inMemoryDeposits
}

async function getDatabase(): Promise<Db> {
  if (!clientPromise) {
    throw new Error('MongoDB is not configured')
  }
  const client = await clientPromise
  return client.db('profitwave')
}

async function getDepositsCollection() {
  const db = await getDatabase()
  return db.collection('deposits')
}

// Check if user is authenticated (simplified for now)
function checkUserAuth(req: NextApiRequest) {
  // For now, we'll just check if there's a userId parameter
  // In a real app, you'd verify the Firebase token or session
  return req.query.userId || req.headers['x-user-id']
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Get user ID from query or header
  const userId = req.query.userId as string || req.headers['x-user-id'] as string
  
  if (!userId) {
    return res.status(400).json({ error: 'User ID is required' })
  }

  if (req.method === 'GET') {
    try {
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

      // Format deposits for response
      const formattedDeposits = deposits.map((deposit: any) => ({
        id: deposit._id.toString(),
        amount: deposit.amount,
        description: deposit.description,
        method: deposit.method,
        status: deposit.status,
        date: deposit.createdAt,
        processedBy: deposit.processedBy
      }))

      res.status(200).json({ 
        deposits: formattedDeposits,
        totalDeposits: formattedDeposits.length
      })

    } catch (error) {
      console.error('Error fetching deposit history:', error)
      res.status(500).json({ error: 'Internal server error', details: error.message })
    }
  } else {
    res.setHeader('Allow', ['GET'])
    res.status(405).end(`Method ${req.method} Not Allowed`)
  }
}
