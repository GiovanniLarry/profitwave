import { NextApiRequest, NextApiResponse } from 'next'

// MongoDB connection - use same method as admin deposits
const uri = process.env.MONGODB_URI
const isMongoDBConfigured = process.env.MONGODB_URI && !process.env.MONGODB_URI.includes('username:password')

async function getDatabase() {
  if (!isMongoDBConfigured) {
    throw new Error('MongoDB is not configured')
  }
  const { MongoClient } = require('mongodb')
  const client = new MongoClient(uri!)
  await client.connect()
  return client.db('profitwave')
}

async function getUsersCollection() {
  const db = await getDatabase()
  return db.collection('users')
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Get token from Authorization header
    const token = req.headers.authorization?.split('Bearer ')[1]
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' })
    }

    // Get UID from query parameter or decode from token
    let uid = req.query.uid as string
    
    if (!uid) {
      // Decode Firebase token to get user UID
      try {
        const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString())
        uid = payload.user_id || payload.sub || payload.uid
      } catch (tokenError) {
        console.error('Token verification failed:', tokenError)
        return res.status(401).json({ error: 'Invalid token' })
      }
    }

    console.log('Balance fetch for Firebase UID:', uid)

    if (isMongoDBConfigured) {
      try {
        const users = await getUsersCollection()
        
        // Find user by Firebase UID
        const user = await users.findOne({ firebaseUid: uid })
        
        if (user) {
          console.log('User found in MongoDB with balance:', user.balance)
          return res.status(200).json({ 
            balance: user.balance || 0,
            email: user.email,
            fullName: user.fullName,
            success: true
          })
        } else {
          console.log('User not found in MongoDB with UID:', uid)
          return res.status(404).json({ error: 'User not found' })
        }
      } catch (mongoError) {
        console.error('MongoDB error:', mongoError)
        return res.status(500).json({ error: 'MongoDB error' })
      }
    } else {
      return res.status(500).json({ error: 'MongoDB not configured' })
    }
  } catch (error) {
    console.error('Balance endpoint error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
