import { NextApiRequest, NextApiResponse } from 'next'

// MongoDB connection
const uri = process.env.MONGODB_URI

// Check if MongoDB URI is configured and not using placeholder
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
    console.log('Testing MongoDB connection...')
    
    if (!isMongoDBConfigured) {
      return res.status(500).json({ 
        error: 'MongoDB not configured',
        uri: process.env.MONGODB_URI ? 'SET' : 'NOT SET',
        containsPlaceholder: process.env.MONGODB_URI?.includes('username:password') || false
      })
    }

    // Test MongoDB connection
    const { MongoClient } = require('mongodb')
    const client = new MongoClient(uri!)
    
    try {
      await client.connect()
      console.log('MongoDB connection successful')
      
      const db = client.db('profitwave')
      const users = db.collection('users')
      
      // Count all users
      const userCount = await users.countDocuments()
      console.log('Total users in MongoDB:', userCount)
      
      // Get all users with their balances
      const allUsers = await users.find({}).project({
        firebaseUid: 1,
        email: 1,
        fullName: 1,
        balance: 1
      }).toArray()
      
      console.log('Users with balances:', allUsers.map(u => ({
        uid: u.firebaseUid,
        email: u.email,
        name: u.fullName,
        balance: u.balance
      })))
      
      await client.close()
      
      return res.status(200).json({
        success: true,
        message: 'MongoDB connection successful',
        userCount,
        users: allUsers.map(u => ({
          uid: u.firebaseUid,
          email: u.email,
          name: u.fullName,
          balance: u.balance || 0
        }))
      })
      
    } catch (mongoError) {
      console.error('MongoDB connection error:', mongoError)
      await client.close()
      return res.status(500).json({ 
        error: 'MongoDB connection failed',
        details: mongoError.message
      })
    }
    
  } catch (error) {
    console.error('Test endpoint error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
