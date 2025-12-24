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
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    return res.status(405).end(`Method ${req.method} Not Allowed`)
  }

  try {
    console.log('Testing MongoDB CRUD operations...')
    
    if (!isMongoDBConfigured) {
      return res.status(400).json({ 
        error: 'MongoDB is not properly configured',
        configured: isMongoDBConfigured
      })
    }

    const users = await getUsersCollection()
    
    // Test CREATE operation
    const testUser = {
      email: 'test@example.com',
      firebaseUid: 'test-uid-12345',
      fullName: 'Test User',
      dateOfBirth: new Date('1990-01-01'),
      age: 33,
      gender: 'other',
      nationality: 'Test Country',
      authProvider: 'email',
      emailVerified: true,
      profileCompleted: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    console.log('Creating test user...')
    const insertResult = await users.insertOne(testUser)
    console.log('Inserted user with ID:', insertResult.insertedId)
    
    // Test READ operation
    console.log('Reading test user...')
    const foundUser = await users.findOne({ email: 'test@example.com' })
    console.log('Found user:', foundUser ? 'YES' : 'NO')
    
    // Test UPDATE operation
    console.log('Updating test user...')
    const updateResult = await users.updateOne(
      { email: 'test@example.com' },
      { $set: { fullName: 'Updated Test User', updatedAt: new Date() } }
    )
    console.log('Updated user count:', updateResult.modifiedCount)
    
    // Test DELETE operation
    console.log('Deleting test user...')
    const deleteResult = await users.deleteOne({ email: 'test@example.com' })
    console.log('Deleted user count:', deleteResult.deletedCount)
    
    // Verify deletion
    const finalCount = await users.countDocuments()
    console.log('Final user count:', finalCount)
    
    res.status(200).json({
      message: 'MongoDB CRUD operations test successful',
      operations: {
        create: { success: true, insertedId: insertResult.insertedId },
        read: { success: !!foundUser, userFound: !!foundUser },
        update: { success: updateResult.modifiedCount > 0, modifiedCount: updateResult.modifiedCount },
        delete: { success: deleteResult.deletedCount > 0, deletedCount: deleteResult.deletedCount }
      },
      finalUserCount: finalCount,
      database: 'profitwave',
      collection: 'users',
      mongoURI: uri.replace(/\/\/.*@/, '//***:***@')
    })

  } catch (error: any) {
    console.error('MongoDB CRUD test failed:', error)
    res.status(500).json({ 
      error: 'MongoDB CRUD test failed',
      details: error.message,
      stack: error.stack
    })
  }
}
