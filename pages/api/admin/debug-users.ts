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
    console.log('Debugging MongoDB users...')
    
    if (!isMongoDBConfigured) {
      return res.status(400).json({ 
        error: 'MongoDB is not properly configured',
        configured: isMongoDBConfigured
      })
    }

    const users = await getUsersCollection()
    const allUsers = await users.find({}).toArray()
    
    console.log(`Found ${allUsers.length} users in MongoDB`)
    
    // Log detailed user info for debugging
    allUsers.forEach((user, index) => {
      console.log(`User ${index + 1}:`, {
        email: user.email,
        hasPassword: !!user.password,
        passwordLength: user.password ? user.password.length : 0,
        firebaseUid: user.firebaseUid,
        authProvider: user.authProvider,
        emailVerified: user.emailVerified,
        profileCompleted: user.profileCompleted
      })
    })
    
    res.status(200).json({
      message: 'MongoDB user debug info',
      userCount: allUsers.length,
      users: allUsers.map(user => ({
        email: user.email,
        hasPassword: !!user.password,
        passwordLength: user.password ? user.password.length : 0,
        firebaseUid: user.firebaseUid,
        fullName: user.fullName,
        authProvider: user.authProvider,
        emailVerified: user.emailVerified,
        profileCompleted: user.profileCompleted,
        createdAt: user.createdAt
      }))
    })

  } catch (error: any) {
    console.error('MongoDB debug failed:', error)
    res.status(500).json({ 
      error: 'MongoDB debug failed',
      details: error.message
    })
  }
}
