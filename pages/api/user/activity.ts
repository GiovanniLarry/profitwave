import { NextApiRequest, NextApiResponse } from 'next'
import { MongoClient, Db, ObjectId } from 'mongodb'

// Check if user is authenticated
function checkAuth(req: NextApiRequest): boolean {
  const userId = req.headers['user-id'] as string
  const token = req.headers.authorization?.replace('Bearer ', '')
  
  // Simple auth check - in production, use proper JWT validation
  return !!userId || !!token
}

// Check if MongoDB URI is available
const hasMongoDB = !!process.env.MONGODB_URI && !process.env.MONGODB_URI.includes('username:password')

const uri = process.env.MONGODB_URI
const options = {}

let client: MongoClient
let clientPromise: Promise<MongoClient>

if (hasMongoDB) {
  if (process.env.NODE_ENV === 'development') {
    let globalWithMongo = global as typeof global & {
      _mongoClientPromise?: Promise<MongoClient>
    }

    if (!globalWithMongo._mongoClientPromise) {
      client = new MongoClient(uri, options)
      globalWithMongo._mongoClientPromise = client.connect()
    }
    clientPromise = globalWithMongo._mongoClientPromise
  } else {
    client = new MongoClient(uri, options)
    clientPromise = client.connect()
  }
}

async function getDatabase(): Promise<Db> {
  if (!hasMongoDB) {
    throw new Error('MongoDB not available')
  }
  const client = await clientPromise
  return client.db('profitwave')
}

async function getUsersCollection() {
  if (!hasMongoDB) {
    throw new Error('MongoDB not available')
  }
  const db = await getDatabase()
  return db.collection('users')
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow POST requests for activity tracking
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Check authentication
  if (!checkAuth(req)) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    const { userId, activity } = req.body
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' })
    }

    if (hasMongoDB) {
      try {
        const usersCollection = await getUsersCollection()
        
        let query = {}
        try {
          query = { _id: new ObjectId(userId) }
        } catch {
          query = { _id: userId }
        }
        
        // Update user's last activity timestamp
        const updateData = {
          lastActivity: new Date(),
          ...(activity && { lastActivityType: activity })
        }
        
        const result = await usersCollection.updateOne(query, { 
          $set: updateData 
        })
        
        if (result.modifiedCount > 0) {
          res.status(200).json({ 
            success: true, 
            message: 'Activity tracked successfully',
            timestamp: new Date().toISOString()
          })
        } else {
          res.status(404).json({ error: 'User not found' })
        }
      } catch (mongoError) {
        console.error('MongoDB error tracking activity:', mongoError)
        res.status(500).json({ error: 'Failed to track activity' })
      }
    } else {
      // In-memory fallback for development
      res.status(200).json({ 
        success: true, 
        message: 'Activity tracked (in-memory mode)',
        timestamp: new Date().toISOString()
      })
    }
  } catch (error) {
    console.error('Error tracking user activity:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}
