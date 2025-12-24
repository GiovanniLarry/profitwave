import { NextApiRequest, NextApiResponse } from 'next'
import { MongoClient } from 'mongodb'

// Check if MongoDB URI is available
const hasMongoDB = !!process.env.MONGODB_URI && !process.env.MONGODB_URI.includes('username:password')

const uri = process.env.MONGODB_URI
const options = {}

let client: MongoClient
let clientPromise: Promise<MongoClient>

if (hasMongoDB) {
  client = new MongoClient(uri!, options)
  clientPromise = client.connect()
}

// Check admin authentication
function checkAuth(req: NextApiRequest): boolean {
  const adminAuth = req.headers.authorization
  const sessionAuth = req.cookies.adminAuthenticated
  
  // Allow access via session or admin header
  return sessionAuth === 'true' || adminAuth === 'Bearer admin-token'
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Check admin authentication
  if (!checkAuth(req)) {
    return res.status(401).json({ error: 'Unauthorized access' })
  }

  try {
    const debugInfo = {
      hasMongoDB,
      collections: {}
    }

    if (hasMongoDB) {
      const client = await clientPromise
      const db = client.db('profitwave')
      
      // Check chats collection
      const chatCollection = db.collection('chats')
      const chatCount = await chatCollection.countDocuments()
      const allChats = await chatCollection.find({}).limit(10).toArray()
      
      // Check users collection
      const usersCollection = db.collection('users')
      const userCount = await usersCollection.countDocuments()
      const allUsers = await usersCollection.find({}).limit(5).toArray()
      
      debugInfo.collections = {
        chats: {
          count: chatCount,
          sample: allChats.map(chat => ({
            _id: chat._id.toString(),
            userId: chat.userId,
            adminMessage: chat.adminMessage,
            userMessage: chat.userMessage,
            type: chat.type,
            createdAt: chat.createdAt
          }))
        },
        users: {
          count: userCount,
          sample: allUsers.map(user => ({
            _id: user._id.toString(),
            firebaseUid: user.firebaseUid,
            email: user.email,
            fullName: user.fullName
          }))
        }
      }
    }

    res.status(200).json(debugInfo)
  } catch (error) {
    console.error('Debug API error:', error)
    res.status(500).json({ error: error.message })
  }
}
