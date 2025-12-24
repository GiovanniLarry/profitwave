import { NextApiRequest, NextApiResponse } from 'next'
import { MongoClient, Db } from 'mongodb'
import { getAuth } from 'firebase/auth'
import { initializeApp } from 'firebase/app'

// Initialize Firebase
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
}

let app
try {
  app = initializeApp(firebaseConfig)
} catch (error) {
  console.log('Firebase app already initialized')
}

// MongoDB connection setup
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
  if (req.method !== 'DELETE') {
    res.setHeader('Allow', ['DELETE'])
    return res.status(405).end(`Method ${req.method} Not Allowed`)
  }

  // Only allow in development or with confirmation
  const isDevelopment = process.env.NODE_ENV === 'development'
  const confirmationKey = req.headers['x-confirmation-key'] as string
  
  if (!isDevelopment && confirmationKey !== 'DELETE_USER_CONFIRMED') {
    return res.status(403).json({ 
      error: 'This operation is only allowed in development mode or with proper confirmation' 
    })
  }

  try {
    const { email, firebaseUid } = req.body

    // Validate input - need either email or firebaseUid
    if (!email && !firebaseUid) {
      return res.status(400).json({ error: 'Email or Firebase UID is required' })
    }

    console.log('Starting MongoDB-driven user deletion...')

    if (!isMongoDBConfigured) {
      return res.status(400).json({ 
        error: 'MongoDB is not properly configured' 
      })
    }

    const users = await getUsersCollection()
    
    // Step 1: Find user in MongoDB
    const user = await users.findOne(
      email ? { email: email.toLowerCase() } : { firebaseUid: firebaseUid }
    )

    if (!user) {
      return res.status(404).json({ error: 'User not found in database' })
    }

    console.log(`Found user in MongoDB: ${user.email}`)

    // Step 2: Delete from MongoDB first
    const mongoDeleteResult = await users.deleteOne({ _id: user._id })
    console.log(`Deleted user from MongoDB: ${mongoDeleteResult.deletedCount} documents`)

    // Step 3: Attempt to delete from Firebase (note: this requires Admin SDK)
    let firebaseDeleted = false
    let firebaseError = null

    try {
      // Note: Client-side Firebase Auth SDK cannot delete users
      // This would require Firebase Admin SDK setup
      console.log('Firebase user deletion requires Admin SDK - skipping for now')
      firebaseError = 'Firebase Admin SDK not configured for user deletion'
    } catch (error: any) {
      firebaseError = error.message
      console.error('Firebase deletion error:', error)
    }

    res.status(200).json({
      message: 'User deletion completed',
      user: {
        email: user.email,
        firebaseUid: user.firebaseUid
      },
      mongodb: {
        deleted: mongoDeleteResult.deletedCount > 0,
        deletedCount: mongoDeleteResult.deletedCount
      },
      firebase: {
        deleted: firebaseDeleted,
        error: firebaseError,
        note: 'Firebase deletion requires Admin SDK setup'
      },
      source: 'MongoDB-driven deletion cascade'
    })

  } catch (error: any) {
    console.error('User deletion error:', error)
    res.status(500).json({ 
      error: 'Failed to delete user',
      details: error.message 
    })
  }
}
