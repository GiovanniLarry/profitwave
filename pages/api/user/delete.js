// Firebase initialization config (used only for reference / consistency)
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
}

// Initialize Firebase Admin SDK (server-side)
let admin
try {
  admin = require('firebase-admin')
  if (!admin.apps.length) {
    try {
      const serviceAccount = require('../../../service-account-key.json')
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      })
      console.log('Firebase Admin SDK initialized with service account (delete endpoint)')
    } catch (serviceAccountError) {
      console.log('Service account key not found, Firebase Admin SDK not available for delete')
      admin = null
    }
  }
} catch (error) {
  console.log('Firebase Admin SDK not available for delete, using fallback')
  admin = null
}

// MongoDB connection URI (optional)
const uri = process.env.MONGODB_URI

// Shared in-memory user storage (used elsewhere in the app)
const inMemoryUsers =
  typeof global !== 'undefined' && global.inMemoryUsers
    ? global.inMemoryUsers
    : new Map()

if (typeof global !== 'undefined') {
  global.inMemoryUsers = inMemoryUsers
}

async function handler(req, res) {
  // Simple health / debug endpoint used by the frontend
  if (req.method === 'GET') {
    return res.status(200).json({ message: 'Delete endpoint is reachable' })
  }

  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const result = {
    firebaseUserDeleted: false,
    mongoUserDeleted: false,
    memoryUserDeleted: false,
    errors: []
  }

  try {
    // 1. Extract and verify Firebase ID token from Authorization header
    const authHeader = req.headers.authorization || ''
    const token = authHeader.startsWith('Bearer ') ? authHeader.split('Bearer ')[1] : null

    if (!token) {
      return res.status(401).json({ error: 'No token provided' })
    }

    let decodedToken
    try {
      if (admin) {
        console.log('Using Firebase Admin to verify token for delete')
        decodedToken = await admin.auth().verifyIdToken(token)
      } else {
        console.log('Using fallback token decode for delete (NOT for production)')
        const payload = JSON.parse(
          Buffer.from(token.split('.')[1], 'base64').toString()
        )
        decodedToken = { uid: payload.user_id || payload.sub, email: payload.email }
      }
    } catch (tokenError) {
      console.error('Token verification failed (delete):', tokenError)
      return res.status(401).json({ error: 'Invalid token' })
    }

    const firebaseUid = decodedToken.uid
    console.log('Deleting account for Firebase UID:', firebaseUid)

    // 2. Try to delete user from Firebase Auth (if Admin SDK is available)
    if (admin) {
      try {
        await admin.auth().deleteUser(firebaseUid)
        result.firebaseUserDeleted = true
        console.log('Firebase user deleted successfully')
      } catch (firebaseError) {
        console.error('Error deleting Firebase user:', firebaseError)
        result.errors.push(`Firebase delete error: ${firebaseError.message || firebaseError}`)
      }
    } else {
      console.log('Firebase Admin not available, skipping Firebase user deletion')
      result.errors.push('Firebase Admin SDK not available, Firebase user not deleted on server')
    }

    // 3. Try to delete user from MongoDB if configured properly
    const isMongoDBConfigured =
      process.env.MONGODB_URI && !process.env.MONGODB_URI.includes('username:password')

    if (isMongoDBConfigured) {
      try {
        const { MongoClient } = require('mongodb')
        const client = new MongoClient(uri)
        await client.connect()
        const database = client.db('profitwave')
        const users = database.collection('users')

        const deleteResult = await users.deleteOne({ firebaseUid })
        if (deleteResult.deletedCount > 0) {
          result.mongoUserDeleted = true
          console.log('User deleted from MongoDB')
        } else {
          console.log('User not found in MongoDB to delete')
        }

        await client.close()
      } catch (mongoError) {
        console.error('MongoDB delete error:', mongoError)
        result.errors.push(`MongoDB delete error: ${mongoError.message || mongoError}`)
      }
    } else {
      console.log('MongoDB not properly configured - skipping MongoDB delete')
    }

    // 4. Delete from in-memory storage (always attempted for consistency)
    if (inMemoryUsers.has(firebaseUid)) {
      inMemoryUsers.delete(firebaseUid)
      result.memoryUserDeleted = true
      console.log('User deleted from in-memory storage')
    }

    // 5. Build response status: 200 on full success, 207 on partial,
    //    and normally 500 on total failure. However, if no server-side
    //    backends are configured (no Firebase Admin and no MongoDB),
    //    we treat this as a client-only delete and still return 200
    //    so the frontend can sign the user out cleanly.
    const anySuccess =
      result.firebaseUserDeleted || result.mongoUserDeleted || result.memoryUserDeleted

    if (anySuccess && result.errors.length === 0) {
      return res.status(200).json({
        message: 'Account deleted successfully',
        ...result
      })
    }

    if (anySuccess && result.errors.length > 0) {
      // Partial success
      return res.status(207).json({
        message: 'Account partially deleted',
        ...result
      })
    }

    // No deletions succeeded
    if (!admin && !isMongoDBConfigured) {
      console.log('No server backends configured; treating delete as client-only success')
      return res.status(200).json({
        message: 'Account deleted on client (no server backends configured)',
        ...result
      })
    }

    return res.status(500).json({
      error: 'Failed to delete account in all backends',
      ...result
    })
  } catch (error) {
    console.error('Unexpected error in delete API:', error)
    return res.status(500).json({
      error: 'Internal server error',
      details: error.message || String(error),
      ...result
    })
  }
}

// Export for CommonJS and ensure Next.js sees a default export
module.exports = handler
module.exports.default = handler
