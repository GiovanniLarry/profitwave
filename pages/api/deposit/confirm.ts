import { NextApiRequest, NextApiResponse } from 'next'
import { MongoClient, ObjectId } from 'mongodb'
import multer from 'multer'
import { getAuth } from 'firebase/auth'
import { auth } from '../../../lib/firebase'

// Firebase configuration is handled in lib/firebase.ts

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

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Support specific image formats
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/bmp', 'image/webp']
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error(`Unsupported file type. Allowed formats: JPG, PNG, GIF, BMP, WEBP`))
    }
  }
})

export const config = {
  api: {
    bodyParser: false
  }
}

// Simple token verification using mock validation for now
const verifyToken = async (token: string): Promise<string | null> => {
  try {
    // For development, extract user ID from Firebase token
    // Firebase tokens contain the user ID in the 'sub' claim
    if (token && token.length > 10) {
      // Parse the JWT token to get the user ID (this is a simplified approach)
      // In production, use Firebase Admin SDK for proper verification
      const parts = token.split('.')
      if (parts.length === 3) {
        try {
          const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString())
          return payload.sub || payload.user_id || payload.uid || 'development-user-id'
        } catch (e) {
          console.log('Failed to parse JWT token, trying fallback format')
        }
      }
      
      // Fallback: try to parse as base64 encoded JSON (for session-based tokens)
      try {
        const payload = JSON.parse(Buffer.from(token, 'base64').toString())
        if (payload.uid) {
          return payload.uid
        }
      } catch (e) {
        console.log('Failed to parse fallback token format')
      }
      
      return 'development-user-id'
    }
    return null
  } catch (error) {
    console.error('Token verification error:', error)
    return null
  }
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  let dbConnection = null
  
  try {
    console.log('Starting deposit confirmation process...')
    
    // Verify user authentication (simplified)
    const token = req.headers.authorization?.replace('Bearer ', '')
    
    if (!token) {
      console.error('No token provided')
      return res.status(401).json({ error: 'No token provided' })
    }

    console.log('Verifying token...')
    const userId = await verifyToken(token)
    if (!userId) {
      console.error('Invalid token')
      return res.status(401).json({ error: 'Invalid token' })
    }
    console.log('User authenticated:', userId)

    // Handle file upload
    console.log('Processing file upload...')
    await new Promise((resolve, reject) => {
      upload.single('screenshot')(req as any, res as any, (err: any) => {
        if (err) {
          console.error('File upload error:', err)
          reject(err)
        } else {
          resolve(undefined)
        }
      })
    })

    const file = (req as any).file
    const { paymentId, amount, method } = req.body

    console.log('Received data:', { paymentId, amount, method, hasFile: !!file })

    if (!file || !paymentId || !amount || !method) {
      console.error('Missing required fields:', { hasFile: !!file, hasPaymentId: !!paymentId, hasAmount: !!amount, hasMethod: !!method })
      return res.status(400).json({ error: 'Missing required fields' })
    }

    // Connect to MongoDB using standardized connection
    console.log('Connecting to MongoDB...')
    dbConnection = await getDatabase()
    const depositsCollection = dbConnection.collection('deposits')
    const usersCollection = dbConnection.collection('users')

    console.log('Connected to MongoDB successfully')

    // Create deposit record
    const deposit = {
      userId,
      amount: parseFloat(amount),
      method,
      paymentId,
      status: 'pending',
      screenshot: {
        filename: file.originalname,
        contentType: file.mimetype,
        size: file.size,
        data: file.buffer.toString('base64')
      },
      createdAt: new Date(),
      updatedAt: new Date()
    }

    console.log('Creating deposit record:', { userId, amount, method, paymentId })

    // Save deposit to database
    const result = await depositsCollection.insertOne(deposit)
    console.log('Deposit saved with ID:', result.insertedId)

    // Check if user exists first
    const user = await usersCollection.findOne({ firebaseUid: userId })
    if (!user) {
      console.log('User not found, creating user record...')
      // Create user record if it doesn't exist
      await usersCollection.insertOne({
        firebaseUid: userId,
        deposits: [{
          _id: result.insertedId,
          amount: parseFloat(amount),
          method,
          paymentId,
          status: 'pending',
          date: new Date(),
          description: `Deposit via ${method} - ${paymentId}`
        }],
        createdAt: new Date(),
        updatedAt: new Date()
      })
    } else {
      console.log('User found, updating deposit history...')
      // Update existing user's deposit history
      await usersCollection.updateOne(
        { firebaseUid: userId },
        {
          $push: {
            deposits: {
              $each: [{
                _id: result.insertedId,
                amount: parseFloat(amount),
                method,
                paymentId,
                status: 'pending',
                date: new Date(),
                description: `Deposit via ${method} - ${paymentId}`
              }]
            }
          },
          $set: { updatedAt: new Date() }
        }
      )
    }

    console.log('User deposit history updated')

    // Create notification for admin
    const notificationsCollection = dbConnection.collection('notifications')
    await notificationsCollection.insertOne({
      type: 'deposit_pending',
      userId,
      depositId: result.insertedId,
      userInfo: {
        fullName: 'User',
        email: 'user@example.com',
        userId: userId
      },
      amount: parseFloat(amount),
      method,
      paymentId,
      status: 'pending',
      priority: 'high',
      read: false,
      createdAt: new Date(),
      message: `New deposit pending: XAF ${parseFloat(amount).toLocaleString()} via ${method}`,
      actionUrl: `/system/portal-2024/dashboard?tab=deposit-verification&depositId=${result.insertedId}`
    })

    console.log('Admin notification created')

    res.status(200).json({
      success: true,
      message: 'Deposit confirmation submitted successfully',
      depositId: result.insertedId
    })

    console.log('Deposit confirmation completed successfully')

  } catch (error) {
    console.error('Deposit confirmation error:', error)
    console.error('Error stack:', error.stack)
    
    // More detailed error response
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    const errorDetails = {
      error: 'Failed to process deposit confirmation',
      details: errorMessage,
      timestamp: new Date().toISOString()
    }
    
    res.status(500).json(errorDetails)
  } finally {
    // Connection pooling handled by the standardized connection pattern
  }
}

export default handler
