import { NextApiRequest, NextApiResponse } from 'next'
import { MongoClient, Db } from 'mongodb'

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
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET'])
    return res.status(405).end(`Method ${req.method} Not Allowed`)
  }

  try {
    console.log('Testing MongoDB connection...')
    console.log('MongoDB URI:', uri)
    console.log('Is MongoDB configured:', isMongoDBConfigured)
    
    if (!isMongoDBConfigured) {
      return res.status(400).json({ 
        error: 'MongoDB is not properly configured',
        uri: uri,
        configured: isMongoDBConfigured
      })
    }

    // Test database connection
    const db = await getDatabase()
    console.log('Connected to database:', db.databaseName)
    
    // Test collection access
    const users = await getUsersCollection()
    console.log('Accessed users collection')
    
    // Get all documents
    const allUsers = await users.find({}).toArray()
    console.log('Found users:', allUsers.length)
    
    // Get collection count instead of stats (which may not be available in all MongoDB versions)
    const userCount = await users.countDocuments()
    console.log('User count:', userCount)
    
    // List all databases
    const admin = db.client.db().admin()
    const databases = await admin.listDatabases()
    console.log('Available databases:', databases.databases.map(db => db.name))
    
    res.status(200).json({
      message: 'MongoDB connection test successful',
      database: db.databaseName,
      collection: 'users',
      userCount: userCount,
      users: allUsers.map(user => ({
        email: user.email,
        firebaseUid: user.firebaseUid,
        fullName: user.fullName,
        profileCompleted: user.profileCompleted,
        createdAt: user.createdAt
      })),
      availableDatabases: databases.databases.map(db => db.name),
      mongoURI: uri.replace(/\/\/.*@/, '//***:***@'), // Hide credentials
      isConfigured: isMongoDBConfigured
    })

  } catch (error: any) {
    console.error('MongoDB connection test failed:', error)
    res.status(500).json({ 
      error: 'MongoDB connection test failed',
      details: error.message,
      stack: error.stack
    })
  }
}
