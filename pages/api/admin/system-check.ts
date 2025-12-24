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
    console.log('Checking complete system state...')
    
    // Check MongoDB
    const users = await getUsersCollection()
    const mongoUsers = await users.find({}).toArray()
    const mongoCount = await users.countDocuments()
    
    // Check Firebase configuration
    const firebaseConfig = {
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY
    }
    
    res.status(200).json({
      message: 'System state check complete',
      mongodb: {
        configured: isMongoDBConfigured,
        uri: uri.replace(/\/\/.*@/, '//***:***@'),
        database: 'profitwave',
        collection: 'users',
        userCount: mongoCount,
        users: mongoUsers.map(user => ({
          email: user.email,
          firebaseUid: user.firebaseUid,
          fullName: user.fullName,
          profileCompleted: user.profileCompleted,
          createdAt: user.createdAt
        }))
      },
      firebase: {
        configured: !!firebaseConfig.projectId,
        projectId: firebaseConfig.projectId,
        authDomain: firebaseConfig.authDomain,
        hasApiKey: !!firebaseConfig.apiKey
      },
      recommendations: {
        mongodbClear: mongoCount > 0 ? 'MongoDB has users - clear if needed' : 'MongoDB is empty',
        firebaseClear: 'Clear Firebase users manually in Firebase Console to resolve "email already registered" errors',
        nextSteps: [
          '1. Go to Firebase Console: https://console.firebase.google.com',
          '2. Select project: profitwave-7fea2',
          '3. Go to Authentication > Users',
          '4. Delete all users manually',
          '5. Test signup flow again'
        ]
      }
    })

  } catch (error: any) {
    console.error('System state check failed:', error)
    res.status(500).json({ 
      error: 'System state check failed',
      details: error.message
    })
  }
}
