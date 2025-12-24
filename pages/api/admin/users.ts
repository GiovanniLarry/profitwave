import { NextApiRequest, NextApiResponse } from 'next'
import { MongoClient, Db, ObjectId } from 'mongodb'

// Check admin authentication
function checkAuth(req: NextApiRequest): boolean {
  const adminAuth = req.headers.authorization
  const sessionAuth = req.cookies.adminAuthenticated
  
  // Allow access via session or admin header
  return sessionAuth === 'true' || adminAuth === 'Bearer admin-token'
}

// Check if MongoDB URI is available
const hasMongoDB = !!process.env.MONGODB_URI && !process.env.MONGODB_URI.includes('username:password')

const uri = process.env.MONGODB_URI
const options = {}

let client: MongoClient
let clientPromise: Promise<MongoClient>

if (hasMongoDB) {
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

async function getDatabase(): Promise<Db> {
  if (!hasMongoDB) {
    throw new Error('MongoDB not available')
  }
  const client = await clientPromise
  return client.db('profitwave')
}

async function getUsersCollection() {
  if (!hasMongoDB) {
    throw new Error('MongoDB not available')
  }
  const db = await getDatabase()
  return db.collection('users')
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Check admin authentication
  if (!checkAuth(req)) {
    return res.status(401).json({ error: 'Unauthorized access' })
  }

  if (req.method === 'GET') {
    try {
      const { search, status, page = 1, limit = 50 } = req.query
      
      let users = []
      
      if (hasMongoDB) {
        try {
          const usersCollection = await getUsersCollection()
          
          // Build query
          const query: any = {}
          if (status && status !== 'all') {
            query.status = status
          }
          if (search) {
            query.$or = [
              { fullName: { $regex: search, $options: 'i' } },
              { email: { $regex: search, $options: 'i' } },
              { username: { $regex: search, $options: 'i' } }
            ]
          }
          
          // Calculate pagination
          const skip = (Number(page) - 1) * Number(limit)
          
          // Get users with pagination
          const cursor = usersCollection
            .find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit))
          
          users = await cursor.toArray()
          
          // Get total count for pagination
          const totalUsers = await usersCollection.countDocuments(query)
          
          // Transform data with online status calculation
          const now = new Date()
          const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000) // Users active in last 5 minutes
          
          users = users.map(user => ({
            ...user,
            id: user._id?.toString(),
            _id: user._id?.toString(),
            status: user.status || 'active',
            emailVerified: user.emailVerified || false,
            authProvider: user.authProvider || 'email',
            balance: user.balance || 0,
            lastActivity: user.lastActivity || user.lastLoginAt || user.createdAt,
            isOnline: new Date(user.lastActivity || user.lastLoginAt || user.createdAt) > fiveMinutesAgo
          }))
          
          res.status(200).json({
            users,
            pagination: {
              page: Number(page),
              limit: Number(limit),
              total: totalUsers,
              pages: Math.ceil(totalUsers / Number(limit))
            }
          })
        } catch (mongoError) {
          console.error('MongoDB error, using fallback:', mongoError)
          // Fallback to mock data
          users = getMockUsers()
          res.status(200).json({ users, pagination: { page: 1, limit: 50, total: users.length, pages: 1 } })
        }
      } else {
        // Use mock data
        users = getMockUsers()
        res.status(200).json({ users, pagination: { page: 1, limit: 50, total: users.length, pages: 1 } })
      }
    } catch (error) {
      console.error('Error fetching users:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  } else if (req.method === 'PUT') {
    try {
      const { userId, status, action, banDuration } = req.body
      
      if (!userId) {
        return res.status(400).json({ error: 'User ID is required' })
      }
      
      let updated = false
      
      if (hasMongoDB) {
        try {
          const usersCollection = await getUsersCollection()
          
          let query = {}
          try {
            query = { _id: new ObjectId(userId) }
          } catch {
            query = { _id: userId }
          }
          
          const updateData: any = { updatedAt: new Date() }
          
          if (status) {
            updateData.status = status
          }
          
          if (action === 'suspend') {
            updateData.status = 'suspended'
          } else if (action === 'activate') {
            updateData.status = 'active'
          } else if (action === 'deactivate') {
            updateData.status = 'inactive'
          } else if (action === 'ban') {
            updateData.status = 'banned'
            if (banDuration && banDuration > 0) {
              // Temporary ban - set ban expiration
              updateData.bannedUntil = new Date(Date.now() + banDuration * 24 * 60 * 60 * 1000) // Convert days to milliseconds
              updateData.banReason = banDuration === 999 ? 'permanent' : `temporary_ban_${banDuration}_days`
            } else {
              // Permanent ban
              updateData.bannedUntil = null
              updateData.banReason = 'permanent'
            }
          } else if (action === 'unban') {
            updateData.status = 'active'
            updateData.bannedUntil = null
            updateData.banReason = null
          }
          
          const result = await usersCollection.updateOne(query, { $set: updateData })
          updated = result.modifiedCount > 0
        } catch (mongoError) {
          console.error('MongoDB error updating user:', mongoError)
          updated = false
        }
      }
      
      if (updated) {
        res.status(200).json({ message: 'User updated successfully' })
      } else {
        res.status(404).json({ error: 'User not found or update failed' })
      }
    } catch (error) {
      console.error('Error updating user:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  } else if (req.method === 'DELETE') {
    try {
      const { userId } = req.body
      
      if (!userId) {
        return res.status(400).json({ error: 'User ID is required' })
      }
      
      let deleted = false
      
      if (hasMongoDB) {
        try {
          const usersCollection = await getUsersCollection()
          
          let query = {}
          try {
            query = { _id: new ObjectId(userId) }
          } catch {
            query = { _id: userId }
          }
          
          const result = await usersCollection.deleteOne(query)
          deleted = result.deletedCount > 0
        } catch (mongoError) {
          console.error('MongoDB error deleting user:', mongoError)
          deleted = false
        }
      }
      
      if (deleted) {
        res.status(200).json({ message: 'User deleted successfully' })
      } else {
        res.status(404).json({ error: 'User not found or deletion failed' })
      }
    } catch (error) {
      console.error('Error deleting user:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  } else {
    res.setHeader('Allow', ['GET', 'PUT', 'DELETE'])
    res.status(405).end(`Method ${req.method} Not Allowed`)
  }
}

function getMockUsers() {
  return [
    {
      _id: '1',
      id: '1',
      email: 'john.doe@example.com',
      fullName: 'John Doe',
      username: 'johndoe',
      createdAt: new Date('2024-01-15'),
      lastLoginAt: new Date('2024-12-20'),
      emailVerified: true,
      authProvider: 'email',
      balance: 1250.50,
      status: 'active'
    },
    {
      _id: '2',
      id: '2',
      email: 'jane.smith@example.com',
      fullName: 'Jane Smith',
      username: 'janesmith',
      createdAt: new Date('2024-02-20'),
      lastLoginAt: new Date('2024-12-18'),
      emailVerified: true,
      authProvider: 'google',
      balance: 3400.00,
      status: 'active'
    },
    {
      _id: '3',
      id: '3',
      email: 'mike.wilson@example.com',
      fullName: 'Mike Wilson',
      username: 'mikewilson',
      createdAt: new Date('2024-03-10'),
      lastLoginAt: new Date('2024-11-30'),
      emailVerified: false,
      authProvider: 'email',
      balance: 850.75,
      status: 'inactive'
    },
    {
      _id: '4',
      id: '4',
      email: 'sarah.jones@example.com',
      fullName: 'Sarah Jones',
      username: 'sarahjones',
      createdAt: new Date('2024-04-05'),
      lastLoginAt: new Date('2024-12-19'),
      emailVerified: true,
      authProvider: 'facebook',
      balance: 2100.25,
      status: 'active'
    },
    {
      _id: '5',
      id: '5',
      email: 'alex.brown@example.com',
      fullName: 'Alex Brown',
      username: 'alexbrown',
      createdAt: new Date('2024-05-12'),
      lastLoginAt: new Date('2024-10-15'),
      emailVerified: true,
      authProvider: 'email',
      balance: 450.00,
      status: 'suspended'
    }
  ]
}
