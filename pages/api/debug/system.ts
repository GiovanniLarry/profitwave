import { NextApiRequest, NextApiResponse } from 'next'
import { MongoClient } from 'mongodb'

// Check if MongoDB URI is configured and not using placeholder
const isMongoDBConfigured = process.env.MONGODB_URI && !process.env.MONGODB_URI.includes('username:password')

// Only throw error if we're in production and don't have MongoDB
if (process.env.NODE_ENV === 'production' && !isMongoDBConfigured) {
  throw new Error('MongoDB URI is required in production')
}

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/profitwave'
const options = {}

let client: MongoClient
let clientPromise: Promise<MongoClient>

// Only initialize MongoDB if it's configured
if (isMongoDBConfigured) {
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
}

async function getDatabase() {
  if (!clientPromise) {
    throw new Error('MongoDB is not configured')
  }
  const client = await clientPromise
  return client.db('profitwave')
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  let db = null

  try {
    console.log('🔍 Starting comprehensive system debug...')
    
    // Connect to MongoDB
    db = await getDatabase()
    console.log('✅ MongoDB connected successfully')
    
    // Get all collections
    const collections = await db.listCollections().toArray()
    console.log('📋 Available collections:', collections.map(c => c.name))
    
    const debugInfo = {
      timestamp: new Date().toISOString(),
      mongodb: {
        uri: uri.replace(/\/\/.*@/, '//***:***@'), // Hide credentials
        connected: true,
        database: db.databaseName,
        collections: collections.map(c => c.name)
      },
      deposits: {
        total: 0,
        pending: 0,
        approved: 0,
        rejected: 0,
        recent: []
      },
      users: {
        total: 0,
        withBalance: 0,
        recent: []
      },
      investments: {
        total: 0,
        active: 0,
        recent: []
      },
      notifications: {
        total: 0,
        unread: 0,
        recent: []
      },
      apiTests: {}
    }

    // Debug Deposits Collection
    if (collections.some(c => c.name === 'deposits')) {
      const depositsCollection = db.collection('deposits')
      
      debugInfo.deposits.total = await depositsCollection.countDocuments()
      debugInfo.deposits.pending = await depositsCollection.countDocuments({ status: 'pending' })
      debugInfo.deposits.approved = await depositsCollection.countDocuments({ status: 'approved' })
      debugInfo.deposits.rejected = await depositsCollection.countDocuments({ status: 'rejected' })
      
      const recentDeposits = await depositsCollection
        .find({})
        .sort({ createdAt: -1 })
        .limit(5)
        .toArray()
      
      debugInfo.deposits.recent = recentDeposits.map(d => ({
        id: d._id,
        userId: d.userId,
        amount: d.amount,
        status: d.status,
        method: d.method,
        paymentId: d.paymentId,
        createdAt: d.createdAt,
        hasScreenshot: !!d.screenshot
      }))
      
      console.log(`💰 Deposits: ${debugInfo.deposits.total} total, ${debugInfo.deposits.pending} pending`)
    }

    // Debug Users Collection
    if (collections.some(c => c.name === 'users')) {
      const usersCollection = db.collection('users')
      
      debugInfo.users.total = await usersCollection.countDocuments()
      debugInfo.users.withBalance = await usersCollection.countDocuments({ 
        balance: { $exists: true, $gt: 0 } 
      })
      
      const recentUsers = await usersCollection
        .find({})
        .sort({ createdAt: -1 })
        .limit(3)
        .toArray()
      
      debugInfo.users.recent = recentUsers.map(u => ({
        id: u._id,
        firebaseUid: u.firebaseUid,
        email: u.email,
        fullName: u.fullName,
        balance: u.balance || 0,
        hasDeposits: !!(u.deposits && u.deposits.length > 0),
        createdAt: u.createdAt
      }))
      
      console.log(`👥 Users: ${debugInfo.users.total} total, ${debugInfo.users.withBalance} with balance`)
    }

    // Debug Investments Collection (if exists)
    if (collections.some(c => c.name === 'investments')) {
      const investmentsCollection = db.collection('investments')
      
      debugInfo.investments.total = await investmentsCollection.countDocuments()
      debugInfo.investments.active = await investmentsCollection.countDocuments({ 
        status: 'active' 
      })
      
      const recentInvestments = await investmentsCollection
        .find({})
        .sort({ createdAt: -1 })
        .limit(3)
        .toArray()
      
      debugInfo.investments.recent = recentInvestments.map(i => ({
        id: i._id,
        userId: i.userId,
        planId: i.planId,
        amount: i.amount,
        status: i.status,
        createdAt: i.createdAt
      }))
      
      console.log(`📈 Investments: ${debugInfo.investments.total} total, ${debugInfo.investments.active} active`)
    }

    // Debug Notifications Collection (if exists)
    if (collections.some(c => c.name === 'notifications')) {
      const notificationsCollection = db.collection('notifications')
      
      debugInfo.notifications.total = await notificationsCollection.countDocuments()
      debugInfo.notifications.unread = await notificationsCollection.countDocuments({ 
        read: false 
      })
      
      const recentNotifications = await notificationsCollection
        .find({})
        .sort({ createdAt: -1 })
        .limit(3)
        .toArray()
      
      debugInfo.notifications.recent = recentNotifications.map(n => ({
        id: n._id,
        type: n.type,
        message: n.message,
        read: n.read,
        priority: n.priority,
        createdAt: n.createdAt
      }))
      
      console.log(`🔔 Notifications: ${debugInfo.notifications.total} total, ${debugInfo.notifications.unread} unread`)
    }

    // Test API Endpoints
    const apiTests = {
      pendingDeposits: 'pending',
      userProfile: 'pending',
      createInvestment: 'pending'
    }

    try {
      // Test pending deposits endpoint
      const pendingResponse = await fetch(`${req.headers.origin || 'http://localhost:3000'}/api/admin/pending-deposits`, {
        headers: {
          'Authorization': 'Bearer admin-token'
        }
      })
      apiTests.pendingDeposits = pendingResponse.ok ? 'success' : `failed (${pendingResponse.status})`
    } catch (error) {
      apiTests.pendingDeposits = `error: ${error.message}`
    }

    debugInfo.apiTests = apiTests

    console.log('🎯 Debug completed successfully')
    
    res.status(200).json({
      success: true,
      message: 'System debug completed',
      debug: debugInfo
    })

  } catch (error) {
    console.error('❌ Debug API error:', error)
    res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    })
  }
}
