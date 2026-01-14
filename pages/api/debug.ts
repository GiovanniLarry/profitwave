import { NextApiRequest, NextApiResponse } from 'next'
import { MongoClient } from 'mongodb'

// MongoDB connection
const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/profitwave'
const client = new MongoClient(uri)

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('=== DEBUG API CALLED ===')
  console.log('Method:', req.method)
  console.log('Timestamp:', new Date().toISOString())
  console.log('Environment variables check:')
  console.log('- MONGODB_URI:', process.env.MONGODB_URI ? 'SET' : 'NOT SET')
  console.log('- NEXT_PUBLIC_FIREBASE_API_KEY:', process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? 'SET' : 'NOT SET')
  console.log('- NODE_ENV:', process.env.NODE_ENV || 'NOT SET')

  let dbConnection = null

  try {
    console.log('Testing MongoDB connection...')
    await client.connect()
    dbConnection = client.db()
    console.log('MongoDB connected successfully')
    console.log('Database name:', dbConnection.databaseName)

    // Test collections
    const collections = await dbConnection.listCollections().toArray()
    console.log('Available collections:', collections.map(c => c.name))

    // Test deposits collection
    const depositsCollection = dbConnection.collection('deposits')
    const depositCount = await depositsCollection.countDocuments()
    console.log('Total deposits in database:', depositCount)

    const pendingDeposits = await depositsCollection.countDocuments({ status: 'pending' })
    console.log('Pending deposits:', pendingDeposits)

    // Test users collection
    const usersCollection = dbConnection.collection('users')
    const userCount = await usersCollection.countDocuments()
    console.log('Total users in database:', userCount)

    // Test notifications collection
    const notificationsCollection = dbConnection.collection('notifications')
    const notificationCount = await notificationsCollection.countDocuments()
    console.log('Total notifications in database:', notificationCount)

    // Get recent deposits for testing
    const recentDeposits = await depositsCollection
      .find({})
      .sort({ createdAt: -1 })
      .limit(5)
      .toArray()
    
    console.log('Recent deposits:', recentDeposits.map(d => ({
      id: d._id.toString(),
      amount: d.amount,
      status: d.status,
      createdAt: d.createdAt
    })))

    const debugInfo = {
      success: true,
      timestamp: new Date().toISOString(),
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        mongodbUriSet: !!process.env.MONGODB_URI,
        firebaseApiKeySet: !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY
      },
      database: {
        connected: true,
        databaseName: dbConnection.databaseName,
        collections: collections.map(c => c.name),
        stats: {
          totalDeposits: depositCount,
          pendingDeposits: pendingDeposits,
          totalUsers: userCount,
          totalNotifications: notificationCount
        },
        recentDeposits: recentDeposits.map(d => ({
          id: d._id.toString(),
          amount: d.amount,
          status: d.status,
          method: d.method,
          createdAt: d.createdAt,
          userId: d.userId
        }))
      }
    }

    console.log('=== DEBUG API SUCCESS ===')
    res.status(200).json(debugInfo)

  } catch (error) {
    console.error('=== DEBUG API ERROR ===')
    console.error('Full error:', error)
    console.error('Error message:', error.message)
    console.error('Error stack:', error.stack)
    
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        mongodbUriSet: !!process.env.MONGODB_URI,
        firebaseApiKeySet: !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY
      }
    })
  } finally {
    if (dbConnection) {
      await client.close()
      console.log('MongoDB connection closed')
    }
  }
}
