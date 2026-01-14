import { NextApiRequest, NextApiResponse } from 'next'
import { MongoClient, Db } from 'mongodb'
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth'
import { initializeApp } from 'firebase/app'

// Initialize Firebase
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
}

let app
try {
  app = initializeApp(firebaseConfig)
} catch (error) {
  console.log('Firebase app already initialized')
}

// MongoDB connection setup
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
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    return res.status(405).end(`Method ${req.method} Not Allowed`)
  }

  try {
    const { username, password } = req.body

    // Validate input
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' })
    }

    console.log('MongoDB-driven login attempt for username:', username)

    // Step 1: Check if user exists in MongoDB
    let user = null

    if (isMongoDBConfigured) {
      try {
        const users = await getUsersCollection()
        user = await users.findOne({ username: username })
        console.log('MongoDB user lookup result:', !!user)
      } catch (mongoError) {
        console.error('MongoDB error during login:', mongoError)
        return res.status(500).json({ error: 'Database error during login' })
      }
    }

    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password' })
    }

    // Step 2: Allow username/password login for users who have completed profile
    // This enables users who signed up with Google/Facebook to also use username/password
    if (user.profileCompleted && user.username && user.password) {
      console.log('User has completed profile, allowing username/password login')
      
      // Verify password
      if (user.password !== password) {
        return res.status(401).json({ error: 'Invalid username or password' })
      }
      
      console.log('Password verification successful')
      
      // Check email verification status (if email exists)
      if (user.email && !user.emailVerified) {
        return res.status(403).json({
          error: 'Please verify your email before signing in. Check your inbox for the verification link.',
          needsEmailVerification: true,
          email: user.email
        })
      }
      
      // Step 3: Sign in with Firebase to get session (if email exists)
      try {
        if (user.email) {
          const auth = getAuth()
          const firebaseUser = await signInWithEmailAndPassword(auth, user.email, password)
          console.log('Firebase authentication successful')
        }

        // Update last login in MongoDB
        if (isMongoDBConfigured) {
          const usersCollection = await getUsersCollection()
          await usersCollection.updateOne(
            { _id: user._id },
            { $set: { lastLoginAt: new Date(), updatedAt: new Date() } }
          )
        }

        return res.status(200).json({
          message: 'Login successful',
          user: {
            email: user.email,
            firebaseUid: user.firebaseUid,
            username: user.username,
            fullName: user.fullName,
            profileCompleted: user.profileCompleted,
            authProvider: user.authProvider
          }
        })

      } catch (firebaseError: any) {
        console.error('Firebase authentication error:', firebaseError)
        // Allow login even if Firebase auth fails (for users who might not have Firebase account)
        return res.status(200).json({
          message: 'Login successful',
          user: {
            email: user.email,
            firebaseUid: user.firebaseUid,
            username: user.username,
            fullName: user.fullName,
            profileCompleted: user.profileCompleted,
            authProvider: user.authProvider
          }
        })
      }
    }
    
    // For users without completed profile, use original auth method
    if (user.authProvider === 'email') {
      if (!user.password) {
        return res.status(401).json({ error: 'Invalid username or password' })
      }

      // Simple password comparison (in production, use bcrypt)
      if (user.password !== password) {
        return res.status(401).json({ error: 'Invalid username or password' })
      }

      console.log('MongoDB password verification successful')
      
      // Step 3: Check email verification status
      if (!user.emailVerified) {
        return res.status(403).json({
          error: 'Please verify your email before signing in. Check your inbox for the verification link.',
          needsEmailVerification: true,
          email: user.email
        })
      }
      
      // Step 4: Sign in with Firebase to get session
      try {
        const auth = getAuth()
        const firebaseUser = await signInWithEmailAndPassword(auth, user.email, password)
        console.log('Firebase authentication successful')

        // Update last login in MongoDB
        if (isMongoDBConfigured) {
          const usersCollection = await getUsersCollection()
          await usersCollection.updateOne(
            { _id: user._id },
            { $set: { lastLoginAt: new Date(), updatedAt: new Date() } }
          )
        }

        return res.status(200).json({
          message: 'Login successful',
          user: {
            email: user.email,
            firebaseUid: user.firebaseUid,
            fullName: user.fullName,
            profileCompleted: user.profileCompleted,
            authProvider: user.authProvider
          },
          firebaseUser: {
            uid: firebaseUser.user.uid,
            email: firebaseUser.user.email,
            emailVerified: firebaseUser.user.emailVerified
          }
        })

      } catch (firebaseError: any) {
        console.error('Firebase authentication error:', firebaseError)
        
        // If Firebase user doesn't exist but MongoDB user does, create Firebase user
        if (firebaseError.code === 'auth/user-not-found') {
          try {
            // This would require Firebase Admin SDK to create user
            // For now, return an error indicating manual setup needed
            return res.status(401).json({ 
              error: 'Account exists in database but not in Firebase. Please contact support.',
              needsFirebaseSync: true
            })
          } catch (syncError) {
            return res.status(500).json({ error: 'Failed to sync with Firebase' })
          }
        }
        
        return res.status(401).json({ error: 'Authentication failed' })
      }

    } else {
      // For Google/Facebook auth users without completed profile, redirect to OAuth flow
      return res.status(400).json({ 
        error: 'Please complete your profile first to enable username/password login, or use Google/Facebook sign-in.',
        authProvider: user.authProvider,
        needsProfileCompletion: true
      })
    }

  } catch (error: any) {
    console.error('Login error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}
