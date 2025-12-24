import { NextApiRequest, NextApiResponse } from 'next'

// MongoDB connection
const uri = process.env.MONGODB_URI
const isMongoDBConfigured = process.env.MONGODB_URI && !process.env.MONGODB_URI.includes('username:password')

async function getDatabase() {
  const { MongoClient } = require('mongodb')
  const client = new MongoClient(uri!)
  await client.connect()
  return client.db('profitwave')
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

    // Decode Firebase token to get user UID
    let decodedToken
    try {
      const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString())
      decodedToken = { uid: payload.user_id || payload.sub, email: payload.email }
    } catch (tokenError) {
      console.error('Token verification failed:', tokenError)
      return res.status(401).json({ error: 'Invalid token' })
    }

    console.log('Direct balance fetch for Firebase UID:', decodedToken.uid)

    if (isMongoDBConfigured) {
      try {
        const db = await getDatabase()
        const users = db.collection('users')
        
        // Find user by Firebase UID
        const user = await users.findOne({ firebaseUid: decodedToken.uid })
        
        if (user) {
          console.log('User found in MongoDB with balance:', user.balance)
          return res.status(200).json({ 
            success: true,
            balance: user.balance || 0,
            email: user.email,
            fullName: user.fullName
          })
        } else {
          console.log('User not found in MongoDB')
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
    console.error('Direct balance endpoint error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
