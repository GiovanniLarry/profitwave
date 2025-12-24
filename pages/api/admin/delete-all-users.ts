import { NextApiRequest, NextApiResponse } from 'next'
import { MongoClient, Db } from 'mongodb'

// Global in-memory storage for development when MongoDB isn't available
const inMemoryUsers = (typeof global !== 'undefined' && global.inMemoryUsers) ? global.inMemoryUsers : new Map()
if (typeof global !== 'undefined') {
  global.inMemoryUsers = inMemoryUsers
}

// Check if MongoDB URI is configured
const isMongoDBConfigured = process.env.MONGODB_URI && !process.env.MONGODB_URI.includes('username:password')

if (!process.env.MONGODB_URI) {
  throw new Error('Please add your MongoDB URI to .env.local')
}

const uri = process.env.MONGODB_URI
const options = {}

let client: MongoClient
let clientPromise: Promise<MongoClient>

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

async function getDatabase(): Promise<Db> {
  const client = await clientPromise
  return client.db('profitwave')
}

async function getUsersCollection() {
  const db = await getDatabase()
  return db.collection('users')
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow DELETE method
  if (req.method !== 'DELETE') {
    res.setHeader('Allow', ['DELETE'])
    return res.status(405).end(`Method ${req.method} Not Allowed`)
  }

  // Only allow in development or with a special confirmation key
  const isDevelopment = process.env.NODE_ENV === 'development'
  const confirmationKey = req.headers['x-confirmation-key'] as string
  
  if (!isDevelopment && confirmationKey !== 'DELETE_ALL_USERS_CONFIRMED') {
    return res.status(403).json({ 
      error: 'This operation is only allowed in development mode or with proper confirmation' 
    })
  }

  try {
    if (!isMongoDBConfigured) {
      return res.status(400).json({ 
        error: 'MongoDB is not properly configured. Using in-memory storage which cannot be cleared via this endpoint.' 
      })
    }

    console.log('Starting deletion of all users from MongoDB...')
    
    const users = await getUsersCollection()
    
    // Get count before deletion
    const countBefore = await users.countDocuments()
    console.log(`Found ${countBefore} users to delete`)
    
    // Delete all documents in the collection
    const result = await users.deleteMany({})
    
    // Also clear in-memory storage
    const memoryCountBefore = inMemoryUsers.size
    inMemoryUsers.clear()
    
    console.log(`Successfully deleted ${result.deletedCount} users from MongoDB`)
    console.log(`Cleared ${memoryCountBefore} users from in-memory storage`)
    
    // Verify deletion
    const countAfter = await users.countDocuments()
    console.log(`Users remaining after deletion: ${countAfter}`)
    
    res.status(200).json({ 
      message: 'All users deleted successfully',
      deletedCount: result.deletedCount,
      memoryCleared: memoryCountBefore,
      countBefore: countBefore,
      countAfter: countAfter,
      memoryCountAfter: inMemoryUsers.size
    })

  } catch (error: any) {
    console.error('Error deleting all users:', error)
    res.status(500).json({ 
      error: 'Failed to delete users from MongoDB',
      details: error.message 
    })
  }
}
