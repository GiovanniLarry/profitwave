import { NextApiRequest, NextApiResponse } from 'next'
import { MongoClient, Db } from 'mongodb'
import { getAuth } from 'firebase/auth'
import { auth } from '../../../lib/firebase'

// Firebase configuration is handled in lib/firebase.ts

// MongoDB connection
const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/profitwave'
const options = {}

let client: MongoClient
let clientPromise: Promise<MongoClient>

declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined
}

if (process.env.NODE_ENV === 'development') {
  let globalWithMongo = global as typeof global & {
    _mongoClientPromise: Promise<MongoClient> | undefined
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
    // First check Firebase authentication
    const auth = getAuth()
    const firebaseUser = auth.currentUser
    
    if (firebaseUser) {
      return res.status(200).json({
        authenticated: true,
        user: {
          email: firebaseUser.email,
          firebaseUid: firebaseUser.uid,
          authProvider: 'firebase'
        }
      })
    }

    // Fallback: Check if user has a valid session via other means
    // For now, we'll check if there's a user in MongoDB with recent activity
    // In a real app, you'd use proper session management (JWT, cookies, etc.)
    
    // This is a simplified check - in production you'd want proper session tokens
    const authHeader = req.headers.authorization
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7)
      // Here you'd validate the token and find the user
      // For now, we'll return false as we don't have proper session management
    }

    return res.status(200).json({
      authenticated: false,
      message: 'No active session found'
    })

  } catch (error: any) {
    console.error('Session check error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}
