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

async function getChatCollection() {
  if (!hasMongoDB) return null
  
  const client = await clientPromise
  const db = client.db('profitwave')
  return db.collection('chats')
}

async function getUsersCollection() {
  if (!hasMongoDB) return null
  
  const client = await clientPromise
  const db = client.db('profitwave')
  return db.collection('users')
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Check admin authentication
  if (!checkAuth(req)) {
    return res.status(401).json({ error: 'Unauthorized access' })
  }

  if (req.method === 'GET') {
    try {
      let users = []
      
      if (hasMongoDB) {
        try {
          const chatCollection = await getChatCollection()
          const usersCollection = await getUsersCollection()
          
          if (chatCollection && usersCollection) {
            // Get all unique user IDs from chat collection
            const chatUsers = await chatCollection.aggregate([
              {
                $group: {
                  _id: '$userId',
                  lastMessage: { $max: '$createdAt' },
                  unreadCount: {
                    $sum: {
                      $cond: [{ $eq: ['$read', false] }, 1, 0]
                    }
                  }
                }
              },
              {
                $sort: { lastMessage: -1 }
              }
            ]).toArray()
            
            // Get user details for each user
            const userIds = chatUsers.map(u => u._id)
            const userDetails = await usersCollection.find({
              $or: [
                { _id: { $in: userIds.map(id => (typeof id === 'string' ? id : id.toString())) } },
                { firebaseUid: { $in: userIds } }
              ]
            }).toArray()
            
            users = chatUsers.map(chatUser => {
              const userDetail = userDetails.find(u => 
                u._id.toString() === (typeof chatUser._id === 'string' ? chatUser._id : chatUser._id.toString()) ||
                u.firebaseUid === chatUser._id
              )
              
              // Use firebaseUid if available, otherwise use _id
              const correctUserId = userDetail?.firebaseUid || userDetail?._id.toString()
              
              return {
                _id: correctUserId, // Use the correct ID for message sending
                fullName: userDetail?.fullName || 'Unknown User',
                email: userDetail?.email || 'unknown@example.com',
                username: userDetail?.username || 'unknown',
                lastMessage: chatUser.lastMessage,
                unreadCount: chatUser.unreadCount,
                isOnline: userDetail?.isOnline || false
              }
            })
          }
        } catch (mongoError) {
          console.error('MongoDB error fetching chat users:', mongoError)
          users = []
        }
      }
      
      res.status(200).json({ 
        users,
        success: true
      })
    } catch (error) {
      console.error('Error fetching chat users:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  } else {
    res.setHeader('Allow', ['GET'])
    res.status(405).json({ error: 'Method not allowed' })
  }
}
