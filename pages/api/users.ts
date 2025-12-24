import { NextApiRequest, NextApiResponse } from 'next'
import { MongoClient, Db } from 'mongodb'

// Global in-memory storage for development when MongoDB isn't available
const inMemoryUsers = (typeof global !== 'undefined' && global.inMemoryUsers) ? global.inMemoryUsers : new Map()
if (typeof global !== 'undefined') {
  global.inMemoryUsers = inMemoryUsers
}

// Check if MongoDB URI is configured and not using placeholder
const isMongoDBConfigured = process.env.MONGODB_URI && !process.env.MONGODB_URI.includes('username:password')

// Only throw error if we're in production and don't have MongoDB
if (process.env.NODE_ENV === 'production' && !isMongoDBConfigured) {
  throw new Error('MongoDB URI is required in production')
}

const uri = process.env.MONGODB_URI
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
      client = new MongoClient(uri!, options)
      globalWithMongo._mongoClientPromise = client.connect()
    }
    clientPromise = globalWithMongo._mongoClientPromise
  } else {
    client = new MongoClient(uri!, options)
    clientPromise = client.connect()
  }
}

async function getDatabase(): Promise<Db> {
  if (!clientPromise) {
    throw new Error('MongoDB is not configured')
  }
  const client = await clientPromise
  return client.db('profitwave')
}

async function getUsersCollection() {
  const db = await getDatabase()
  return db.collection('users')
}

// Function to generate unique user ID (pw001, pw002, etc.)
const generateUniqueId = async (db: Db | null): Promise<string> => {
  if (!db) {
    // Fallback for in-memory storage
    const userCount = inMemoryUsers.size
    return `pw${(userCount + 1).toString().padStart(3, '0')}`
  }
  
  const users = db.collection('users')
  const userCount = await users.countDocuments()
  return `pw${(userCount + 1).toString().padStart(3, '0')}`
}

// User schema interface
interface User {
  _id?: any
  email: string
  firebaseUid: string
  username?: string
  password?: string // Store password for MongoDB-driven authentication
  fullName: string
  dateOfBirth: Date
  age: number
  gender: string
  nationality: string
  authProvider: 'email' | 'google' | 'apple'
  emailVerified: boolean
  createdAt: Date
  updatedAt: Date
  lastLoginAt?: Date
  profileCompleted: boolean
  balance?: number // Account balance for deposits
  uniqueId?: string // Unique ID like pw001, pw002, etc.
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Check if MongoDB URI is configured and not using placeholder
  const isMongoDBConfigured = process.env.MONGODB_URI && !process.env.MONGODB_URI.includes('username:password')

  // Only throw error if we're in production and don't have MongoDB
  if (process.env.NODE_ENV === 'production' && !isMongoDBConfigured) {
    throw new Error('MongoDB URI is required in production')
  }

  if (req.method === 'POST') {
    try {
      const userData = req.body
      
      console.log('POST request to /api/users with data:', userData)
      
      // Validate required fields
      if (!userData.email || !userData.firebaseUid) {
        console.log('Missing required fields:', { email: !!userData.email, firebaseUid: !!userData.firebaseUid })
        return res.status(400).json({ error: 'Missing required fields' })
      }

      // Check if username is unique (if provided)
      if (userData.username) {
        console.log('Checking username uniqueness for:', userData.username)
        
        let existingUsernameUser = null
        if (isMongoDBConfigured) {
          try {
            const users = await getUsersCollection()
            existingUsernameUser = await users.findOne({ 
              username: userData.username,
              firebaseUid: { $ne: userData.firebaseUid } // Exclude current user
            })
          } catch (mongoError) {
            console.error('MongoDB error checking username:', mongoError)
            // Fallback to in-memory
            existingUsernameUser = Array.from(inMemoryUsers.values()).find((u: any) => 
              u.username === userData.username && u.firebaseUid !== userData.firebaseUid
            )
          }
        } else {
          existingUsernameUser = Array.from(inMemoryUsers.values()).find((u: any) => 
            u.username === userData.username && u.firebaseUid !== userData.firebaseUid
          )
        }
        
        if (existingUsernameUser) {
          console.log('Username already taken:', userData.username)
          return res.status(409).json({ error: 'Username is already taken. Please choose another one.' })
        }
      }

      const now = new Date()
      
      // Generate unique ID for new users
      let uniqueId = userData.uniqueId
      if (!uniqueId) {
        if (isMongoDBConfigured) {
          try {
            const db = await getDatabase()
            uniqueId = await generateUniqueId(db)
          } catch (error) {
            console.error('Error generating unique ID:', error)
            uniqueId = `pw${Date.now().toString().slice(-3)}` // Fallback
          }
        } else {
          uniqueId = await generateUniqueId(null)
        }
      }
      
      const user: Omit<User, '_id'> = {
        email: userData.email,
        firebaseUid: userData.firebaseUid,
        username: userData.username || '',
        password: userData.password || '', // Store password for email auth
        fullName: userData.fullName,
        dateOfBirth: new Date(userData.dateOfBirth),
        age: userData.age,
        gender: userData.gender,
        nationality: userData.nationality,
        authProvider: userData.authProvider,
        emailVerified: userData.emailVerified || false,
        profileCompleted: userData.profileCompleted || true,
        createdAt: now,
        updatedAt: now,
        uniqueId: uniqueId
      }

      console.log('Processed user object:', user)

      if (isMongoDBConfigured) {
        console.log('MongoDB configured, trying to save to database...')
        // Use MongoDB
        try {
          const users = await getUsersCollection()
          const existingUser = await users.findOne({ firebaseUid: userData.firebaseUid })
          
          if (existingUser) {
            // Update existing user
            await users.updateOne(
              { firebaseUid: userData.firebaseUid },
              { $set: { ...user, createdAt: existingUser.createdAt } }
            )
            console.log('User updated in MongoDB')
            
            // Handle referral tracking for existing users completing profile
            if (userData.referralCode && !existingUser.profileCompleted) {
              console.log('🎯 Processing referral for profile completion')
              console.log('📝 Referral code provided:', userData.referralCode)
              console.log('👤 Referred user ID:', userData.firebaseUid)
              
              try {
                const database = await getDatabase()
                const referrals = database.collection('referrals')
                
                // Find referrer by their unique referral code (not Firebase UID slice)
                const referrer = await users.findOne({ referralCode: userData.referralCode })
                
                console.log('🔍 Referrer search result:', referrer ? 'FOUND' : 'NOT FOUND')
                
                if (referrer) {
                  console.log('✅ Referrer found:', referrer.email)
                  console.log('💰 Current referrer balance:', referrer.balance || 0)
                  
                  // Check referrer's referral usage count (limit: 12)
                  const referralCount = await referrals.countDocuments({ referrerId: referrer.firebaseUid })
                  
                  console.log('📊 Referrer current referral count:', referralCount)
                 
                  if (referralCount >= 12) {
                    console.log('❌ Referral limit exceeded for referrer:', referrer.firebaseUid)
                    // Don't create referral record, but still update user
                    // User can still complete profile, but referrer doesn't get reward
                  } else {
                    console.log('🎁 Awarding referral reward to referrer')
                    
                    // Create referral record
                    await referrals.insertOne({
                      referrerId: referrer.firebaseUid,
                      referredUserId: userData.firebaseUid,
                      referralCode: userData.referralCode,
                      status: 'completed', // Mark as completed since user is completing profile
                      createdAt: new Date(),
                      rewardAmount: 500, // 500 XAF reward
                      rewardPaid: false
                    })
                    
                    console.log('📋 Referral record created')
                    
                    // Update referrer's balance immediately
                    const updateResult = await users.updateOne(
                      { firebaseUid: referrer.firebaseUid },
                      { 
                        $inc: { balance: 500 },
                        $set: { updatedAt: new Date() }
                      }
                    )
                    
                    console.log('💳 Balance update result:', updateResult)
                    console.log('✅ Referral tracked successfully for referrer during profile completion:', referrer.firebaseUid)
                    console.log('💰 Referrer new balance should be:', (referrer.balance || 0) + 500)
                  }
                } else {
                  console.log('❌ Invalid referral code provided during profile completion:', userData.referralCode)
                }
              } catch (referralError) {
                console.error('❌ Error tracking referral during profile completion:', referralError)
              }
            }
            
            res.status(200).json({ message: 'User updated successfully', user })
          } else {
            // Create new user
            const result = await users.insertOne(user)
            console.log('User created in MongoDB with ID:', result.insertedId)
            
            // Create notification for admin about new user
            try {
              const db = await getDatabase()
              const notifications = db.collection('notifications')
              await notifications.insertOne({
                type: 'new_user',
                userId: userData.firebaseUid,
                userInfo: {
                  fullName: userData.fullName,
                  email: userData.email,
                  username: userData.username,
                  uniqueId: uniqueId
                },
                message: `New user registered: ${userData.fullName} (${userData.email})`,
                priority: 'medium',
                read: false,
                createdAt: new Date(),
                actionUrl: '/system/portal-2024/dashboard?tab=users'
              })
              console.log('Admin notification created for new user')
            } catch (notifError) {
              console.error('Error creating notification:', notifError)
            }
            
            res.status(201).json({ message: 'User created successfully', user: { ...user, _id: result.insertedId } })
          }
        } catch (mongoError) {
          console.error('MongoDB error, falling back to memory:', mongoError)
          // Fallback to in-memory storage
          inMemoryUsers.set(userData.firebaseUid, user)
          console.log('User saved to in-memory storage')
          res.status(200).json({ message: 'User saved successfully (in-memory fallback)', user })
        }
      } else {
        console.log('MongoDB not configured, using in-memory storage')
        // Use in-memory storage
        const existingUser = inMemoryUsers.get(userData.firebaseUid)
        
        if (existingUser) {
          // Update existing user
          inMemoryUsers.set(userData.firebaseUid, { ...user, createdAt: existingUser.createdAt })
          console.log('User updated in in-memory storage')
            
            res.status(200).json({ message: 'User updated successfully (in-memory)', user })
        } else {
          // Create new user
          inMemoryUsers.set(userData.firebaseUid, user)
          console.log('User created in in-memory storage')
          res.status(201).json({ message: 'User created successfully (in-memory)', user })
        }
      }
    } catch (error) {
      console.error('Error in users API:', error)
      res.status(500).json({ error: 'Internal server error', details: error.message })
    }
  } else if (req.method === 'PUT') {
    try {
      const userData = req.body
      
      console.log('🔄 PUT request to /api/users with data:', userData)
      
      // Validate required fields
      if (!userData.email || !userData.firebaseUid) {
        console.log('❌ Missing required fields for PUT:', { email: !!userData.email, firebaseUid: !!userData.firebaseUid })
        return res.status(400).json({ error: 'Missing required fields' })
      }

      const now = new Date()
      
      const user: Omit<User, '_id'> = {
        email: userData.email,
        firebaseUid: userData.firebaseUid,
        username: userData.username || '',
        fullName: userData.fullName,
        dateOfBirth: new Date(userData.dateOfBirth),
        age: userData.age,
        gender: userData.gender,
        nationality: userData.nationality,
        authProvider: userData.authProvider,
        emailVerified: userData.emailVerified || false,
        profileCompleted: userData.profileCompleted || true,
        createdAt: now,
        updatedAt: now,
        balance: userData.balance || 0
      }

      console.log('📝 Processed user object for PUT:', user)

      if (isMongoDBConfigured) {
        console.log('🗄️ MongoDB configured, updating user...')
        try {
          const users = await getUsersCollection()
          const existingUser = await users.findOne({ firebaseUid: userData.firebaseUid })
          
          if (existingUser) {
            // Update existing user
            await users.updateOne(
              { firebaseUid: userData.firebaseUid },
              { $set: { ...user, createdAt: existingUser.createdAt } }
            )
            console.log('✅ User updated in MongoDB')
            
            // Handle referral tracking for existing users completing profile
            if (userData.referralCode && !existingUser.profileCompleted) {
              console.log('🎯 Processing referral for profile completion')
              console.log('📝 Referral code provided:', userData.referralCode)
              console.log('👤 Referred user ID:', userData.firebaseUid)
              
              try {
                const database = await getDatabase()
                const referrals = database.collection('referrals')
                
                // Find referrer by their unique referral code (not Firebase UID slice)
                const referrer = await users.findOne({ referralCode: userData.referralCode })
                
                console.log('🔍 Referrer search result:', referrer ? 'FOUND' : 'NOT FOUND')
                
                if (referrer) {
                  console.log('✅ Referrer found:', referrer.email)
                  console.log('💰 Current referrer balance:', referrer.balance || 0)
                  
                  // Check referrer's referral usage count (limit: 12)
                  const referralCount = await referrals.countDocuments({ referrerId: referrer.firebaseUid })
                  
                  console.log('📊 Referrer current referral count:', referralCount)
                 
                  if (referralCount >= 12) {
                    console.log('❌ Referral limit exceeded for referrer:', referrer.firebaseUid)
                  } else {
                    console.log('🎁 Awarding referral reward to referrer')
                    
                    // Create referral record
                    await referrals.insertOne({
                      referrerId: referrer.firebaseUid,
                      referredUserId: userData.firebaseUid,
                      referralCode: userData.referralCode,
                      status: 'completed',
                      createdAt: new Date(),
                      rewardAmount: 500,
                      rewardPaid: false
                    })
                    
                    console.log('📋 Referral record created')
                    
                    // Update referrer's balance immediately
                    const updateResult = await users.updateOne(
                      { firebaseUid: referrer.firebaseUid },
                      { 
                        $inc: { balance: 500 },
                        $set: { updatedAt: new Date() }
                      }
                    )
                    
                    console.log('💳 Balance update result:', updateResult)
                    console.log('✅ Referral tracked successfully for referrer during profile completion:', referrer.firebaseUid)
                    console.log('💰 Referrer new balance should be:', (referrer.balance || 0) + 500)
                  }
                } else {
                  console.log('❌ Invalid referral code provided during profile completion:', userData.referralCode)
                }
              } catch (referralError) {
                console.error('❌ Error tracking referral during profile completion:', referralError)
              }
            }
            
            res.status(200).json({ message: 'User updated successfully', user })
          } else {
            console.log('❌ User not found for update')
            res.status(404).json({ error: 'User not found' })
          }
        } catch (mongoError) {
          console.error('❌ MongoDB error during PUT:', mongoError)
          res.status(500).json({ error: 'Internal server error', details: mongoError.message })
        }
      } else {
        console.log('🗄️ Using in-memory storage for PUT...')
        try {
          const existingUser = inMemoryUsers.get(userData.firebaseUid)
          
          if (existingUser) {
            // Update existing user
            inMemoryUsers.set(userData.firebaseUid, { ...user, createdAt: existingUser.createdAt })
            console.log('✅ User updated in in-memory storage')
            
            res.status(200).json({ message: 'User updated successfully (in-memory)', user })
          } else {
            console.log('❌ User not found for update (in-memory)')
            res.status(404).json({ error: 'User not found' })
          }
        } catch (memoryError) {
          console.error('❌ In-memory error during PUT:', memoryError)
          res.status(500).json({ error: 'Internal server error', details: memoryError.message })
        }
      }
    } catch (error) {
      console.error('❌ PUT request error:', error)
      res.status(500).json({ error: 'Internal server error', details: error.message })
    }
  } else if (req.method === 'GET') {
    try {
      const { firebaseUid, email, checkEmail, checkUsername, username } = req.query
      
      console.log('GET request to /api/users with params:', { firebaseUid, email, checkEmail, checkUsername, username })
      
      // Special endpoint for checking if email exists before login
      if (checkEmail && email) {
        const emailStr = email as string
        console.log('Checking if email exists:', emailStr)
        
        let user = null

        if (isMongoDBConfigured) {
          console.log('Trying MongoDB first...')
          // Try MongoDB first
          try {
            const users = await getUsersCollection()
            user = await users.findOne({ email: emailStr })
            console.log('MongoDB result for email check:', user)
          } catch (mongoError) {
            console.error('MongoDB error, checking memory:', mongoError)
            // Fallback to in-memory
            user = Array.from(inMemoryUsers.values()).find((u: any) => u.email === emailStr)
            console.log('In-memory fallback result for email check:', user)
          }
        } else {
          console.log('Using in-memory storage only')
          // Use in-memory storage
          user = Array.from(inMemoryUsers.values()).find((u: any) => u.email === emailStr)
          console.log('In-memory result for email check:', user)
        }
        
        if (user) {
          console.log('Email found in database')
          res.status(200).json({ exists: true, message: 'Email is registered' })
        } else {
          console.log('Email not found in database')
          res.status(404).json({ exists: false, message: 'Email not registered' })
        }
        return
      }

      // Special endpoint for checking if username exists
      if (checkUsername && username) {
        const usernameStr = username as string
        console.log('Checking username existence for:', usernameStr)
        
        let user = null
        
        if (isMongoDBConfigured) {
          console.log('Trying MongoDB first for username check...')
          try {
            const users = await getUsersCollection()
            user = await users.findOne({ username: usernameStr })
            console.log('MongoDB result for username check:', user)
            console.log('Query was: { username:', usernameStr, '}')
          } catch (mongoError) {
            console.error('MongoDB error, checking memory:', mongoError)
            // Fallback to in-memory
            user = Array.from(inMemoryUsers.values()).find((u: any) => u.username === usernameStr)
            console.log('In-memory fallback result for username check:', user)
          }
        } else {
          console.log('Using in-memory storage only for username check')
          // Use in-memory storage
          user = Array.from(inMemoryUsers.values()).find((u: any) => u.username === usernameStr)
          console.log('In-memory result for username check:', user)
        }
        
        if (user) {
          console.log('Username found in database, user data:', JSON.stringify(user, null, 2))
          res.status(200).json({ exists: true, message: 'Username is already taken' })
        } else {
          console.log('Username not found in database')
          res.status(200).json({ exists: false, message: 'Username is available' })
        }
        return
      }
      
      if (!firebaseUid && !email) {
        return res.status(400).json({ error: 'firebaseUid or email is required' })
      }

      // Ensure email is a string if provided
      const emailStr = email as string
      
      console.log('Looking for user with firebaseUid:', firebaseUid, 'email:', emailStr)
      console.log('Current in-memory users:', Array.from(inMemoryUsers.entries()))
      
      let user = null

      if (isMongoDBConfigured) {
        console.log('Trying MongoDB first...')
        // Try MongoDB first
        try {
          const users = await getUsersCollection()
          user = await users.findOne(
            firebaseUid ? { firebaseUid } : { email: emailStr }
          )
          console.log('MongoDB result:', user)
        } catch (mongoError) {
          console.error('MongoDB error, checking memory:', mongoError)
          // Fallback to in-memory
          user = inMemoryUsers.get(firebaseUid as string) || 
                 Array.from(inMemoryUsers.values()).find((u: any) => u.email === emailStr)
          console.log('In-memory fallback result:', user)
        }
      } else {
        console.log('Using in-memory storage only')
        // Use in-memory storage
        user = inMemoryUsers.get(firebaseUid as string) || 
               Array.from(inMemoryUsers.values()).find((u: any) => u.email === emailStr)
        console.log('In-memory result:', user)
      }
      
      if (!user) {
        console.log('User not found, returning 404')
        return res.status(404).json({ error: 'User not found' })
      }
      
      console.log('Found user:', user)
      res.status(200).json({ user })
    } catch (error) {
      console.error('Error in users API:', error)
      res.status(500).json({ error: 'Internal server error', details: error.message })
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST', 'PUT'])
    res.status(405).end(`Method ${req.method} Not Allowed`)
  }
}
