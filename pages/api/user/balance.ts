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

    // Check for real-time balance updates first
    let realtimeBalance = null
    if (typeof global !== 'undefined' && global.balanceUpdates) {
      const balanceUpdate = global.balanceUpdates.get(uid)
      if (balanceUpdate && Date.now() - balanceUpdate.timestamp.getTime() < 30000) { // 30 seconds
        realtimeBalance = balanceUpdate.newBalance
        console.log('Found real-time balance update:', realtimeBalance)
      }
    }

    if (isMongoDBConfigured) {
      try {
        const users = await getUsersCollection()
        
        // Find user by Firebase UID
        const user = await users.findOne({ firebaseUid: uid })
        
        if (user) {
          const balance = realtimeBalance !== null ? realtimeBalance : (user.balance || 0)
          console.log('User found in MongoDB with balance:', balance)
          
          // If we have a real-time update, update the database
          if (realtimeBalance !== null && realtimeBalance !== user.balance) {
            await users.updateOne(
              { firebaseUid: uid },
              { $set: { balance: realtimeBalance, updatedAt: new Date() } }
            )
            console.log('Updated database with real-time balance:', realtimeBalance)
          }
          
          return res.status(200).json({ 
            balance: balance,
            email: user.email,
            fullName: user.fullName,
            success: true,
            realtimeUpdate: realtimeBalance !== null
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
      // Fallback to in-memory storage if MongoDB not configured
      if (typeof global !== 'undefined' && global.inMemoryUsers) {
        const user = Array.from(global.inMemoryUsers.values()).find((u: any) => u.firebaseUid === uid) as any
        if (user) {
          const balance = realtimeBalance !== null ? realtimeBalance : (user.balance || 0)
          return res.status(200).json({ 
            balance: balance,
            email: user.email,
            fullName: user.fullName,
            success: true,
            realtimeUpdate: realtimeBalance !== null,
            source: 'memory'
          })
        }
      }
      return res.status(404).json({ error: 'User not found' })
    }
  } catch (error) {
    console.error('Balance endpoint error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
