import { NextApiRequest, NextApiResponse } from 'next'
import { MongoClient, Db } from 'mongodb'

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
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    return res.status(405).end(`Method ${req.method} Not Allowed`)
  }

  try {
    const { username, email, firebaseUid } = req.body

    // Validate input
    if (!username && !email && !firebaseUid) {
      return res.status(400).json({ error: 'Username, email, or firebaseUid is required' })
    }

    console.log('Fetching profile by session data:', { username, email, firebaseUid })

    // Connect to MongoDB
    const users = await getUsersCollection()
    let user = null

    // Try to find user by different identifiers
    if (username) {
      user = await users.findOne({ username: username })
    } else if (email) {
      user = await users.findOne({ email: email.toLowerCase() })
    } else if (firebaseUid) {
      user = await users.findOne({ firebaseUid: firebaseUid })
    }

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    console.log('Found user:', user)

    // Return user profile data
    const profileData = {
      name: user.fullName,
      email: user.email,
      username: user.username,
      age: user.age,
      gender: user.gender,
      nationality: user.nationality,
      balance: 0,
      createdAt: user.createdAt?.toISOString() || new Date().toISOString(),
      profileCompleted: user.profileCompleted,
      authProvider: user.authProvider
    }

    return res.status(200).json(profileData)

  } catch (error: any) {
    console.error('Error fetching user profile by session:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}
