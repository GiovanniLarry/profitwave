// Firebase initialization
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
}

// Initialize Firebase Admin SDK
let admin
try {
  admin = require('firebase-admin')
  if (!admin.apps.length) {
    // Try to initialize with service account key if it exists
    try {
      const serviceAccount = require('../../../service-account-key.json')
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      })
      console.log('Firebase Admin SDK initialized with service account')
    } catch (serviceAccountError) {
      console.log('Service account key not found, Firebase Admin SDK not available')
      // Continue without Firebase Admin
      admin = null
    }
  }
} catch (error) {
  console.log('Firebase Admin SDK not available, using fallback')
  admin = null
}

// MongoDB connection
const uri = process.env.MONGODB_URI

// Use the same global in-memory storage as the other APIs
const inMemoryUsers = (typeof global !== 'undefined' && global.inMemoryUsers) ? global.inMemoryUsers : new Map()
if (typeof global !== 'undefined') {
  global.inMemoryUsers = inMemoryUsers
}

async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Get token from Authorization header
    const token = req.headers.authorization?.split('Bearer ')[1]
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' })
    }

    let decodedToken
    try {
      // Decode Firebase token to get user UID
      if (admin) {
        console.log('Using Firebase Admin to verify token')
        decodedToken = await admin.auth().verifyIdToken(token)
      } else {
        console.log('Using fallback token verification')
        // Fallback: decode token without verification (not secure for production)
        const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString())
        decodedToken = { uid: payload.user_id || payload.sub, email: payload.email }
      }
    } catch (tokenError) {
      console.error('Token verification failed:', tokenError)
      return res.status(401).json({ error: 'Invalid token' })
    }

    console.log('Fetching profile for Firebase UID:', decodedToken.uid)
    console.log('MongoDB URI configured:', !!process.env.MONGODB_URI)
    console.log('MongoDB URI contains placeholder:', process.env.MONGODB_URI?.includes('username:password'))

    // Try to fetch from MongoDB first
    const isMongoDBConfigured = process.env.MONGODB_URI && !process.env.MONGODB_URI.includes('username:password')
    
    console.log('MongoDB configured:', isMongoDBConfigured)
    console.log('MongoDB URI:', process.env.MONGODB_URI ? 'SET' : 'NOT SET')
    
    if (isMongoDBConfigured) {
      console.log('Attempting to connect to MongoDB...')
      try {
        const { MongoClient } = require('mongodb')
        const client = new MongoClient(uri, {
          serverSelectionTimeoutMS: 5000, // 5 second timeout
          connectTimeoutMS: 5000,
        })
        await client.connect()
        console.log('Connected to MongoDB successfully')
        const database = client.db('profitwave')
        const users = database.collection('users')
        
        // Find user by Firebase UID
        console.log('Searching for user with Firebase UID:', decodedToken.uid)
        const user = await users.findOne({ firebaseUid: decodedToken.uid })
        console.log('Found user in MongoDB:', user ? 'YES' : 'NO')
        
        if (user) {
          console.log('User found in MongoDB:', user.email)
          console.log('User balance in MongoDB:', user.balance)
          console.log('Full user object:', JSON.stringify(user, null, 2))
          
          const profileData = {
            name: user.fullName,
            email: user.email,
            age: user.age,
            gender: user.gender,
            nationality: user.nationality,
            balance: user.balance || 0,
            totalInvested: user.totalInvested || 0,
            monthlyReturns: user.monthlyReturns || 0,
            activeProjects: user.activeProjects || 0,
            successRate: user.successRate || 0,
            createdAt: user.createdAt?.toISOString() || new Date().toISOString(),
            transactions: user.transactions || []
          }
          
          console.log('Returning profile data with balance:', profileData.balance)
          console.log('Full profile data being returned:', JSON.stringify(profileData, null, 2))
          await client.close()
          return res.status(200).json(profileData)
        } else {
          console.log('User not found in MongoDB with UID:', decodedToken.uid)
        }
        
        await client.close()
      } catch (mongoError) {
        console.error('MongoDB error:', mongoError)
        console.log('Falling back to in-memory storage due to MongoDB error')
      }
    } else {
      console.log('MongoDB not properly configured - using in-memory storage')
    }

    // Fallback: Check in-memory storage
    if (inMemoryUsers.has(decodedToken.uid)) {
      const user = inMemoryUsers.get(decodedToken.uid)
      console.log('Found user in memory:', user)
      
      // Return actual user data from memory
      return res.status(200).json({
        name: user.fullName,
        email: user.email,
        age: user.age,
        gender: user.gender,
        nationality: user.nationality,
        balance: user.balance || 0,
        totalInvested: user.totalInvested || 0,
        monthlyReturns: user.monthlyReturns || 0,
        activeProjects: user.activeProjects || 0,
        successRate: user.successRate || 0,
        createdAt: user.createdAt?.toISOString() || new Date().toISOString(),
        transactions: user.transactions || []
      })
    }

    // Final fallback: Return user data from token
    console.log('Using token fallback for user:', decodedToken)
    const fallbackUserData = {
      name: decodedToken.email?.split('@')[0] || 'User',
      email: decodedToken.email || 'user@example.com',
      age: 25,
      gender: 'male',
      nationality: 'Cameroon',
      balance: 0,
      createdAt: new Date().toISOString(),
      transactions: []
    }

    return res.status(200).json(fallbackUserData)
  } catch (error) {
    console.error('Error fetching user profile:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

module.exports = handler
