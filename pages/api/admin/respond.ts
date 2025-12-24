import { NextApiRequest, NextApiResponse } from 'next'
import { MongoClient, ObjectId } from 'mongodb'

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

async function getMessagesCollection() {
  if (!hasMongoDB) return null
  
  const client = await clientPromise
  const db = client.db('profitwave')
  return db.collection('messages')
}

async function getUsersCollection() {
  if (!hasMongoDB) return null
  
  const client = await clientPromise
  const db = client.db('profitwave')
  return db.collection('users')
}

async function getChatCollection() {
  if (!hasMongoDB) return null
  
  const client = await clientPromise
  const db = client.db('profitwave')
  return db.collection('chats')
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Check admin authentication
  if (!checkAuth(req)) {
    return res.status(401).json({ error: 'Unauthorized access' })
  }

  if (req.method === 'POST') {
    try {
      const { messageId, response, userId } = req.body
      
      if (!messageId || !response || !userId) {
        return res.status(400).json({ error: 'Message ID, response, and user ID are required' })
      }
      
      let success = false
      
      if (hasMongoDB) {
        try {
          // Update the original message status to show admin responded
          const messagesCollection = await getMessagesCollection()
          if (messagesCollection) {
            let query = {}
            try {
              query = { _id: new ObjectId(messageId) }
            } catch {
              query = { _id: messageId }
            }
            
            await messagesCollection.updateOne(query, {
              $set: {
                status: 'resolved',
                adminResponse: response,
                adminResponseDate: new Date(),
                updatedAt: new Date()
              }
            })
          }
          
          // Add the response to the user's chat collection
          const chatCollection = await getChatCollection()
          if (chatCollection) {
            await chatCollection.insertOne({
              userId: userId,
              messageId: messageId,
              adminMessage: response,
              messageDate: new Date(),
              read: false,
              type: 'admin_response',
              createdAt: new Date()
            })
          }
          
          success = true
        } catch (mongoError) {
          console.error('MongoDB error sending admin response:', mongoError)
          success = false
        }
      }
      
      if (success) {
        res.status(200).json({ 
          message: 'Admin response sent successfully',
          success: true
        })
      } else {
        res.status(500).json({ error: 'Failed to send admin response' })
      }
    } catch (error) {
      console.error('Error sending admin response:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  } else if (req.method === 'GET') {
    try {
      const { userId } = req.query
      
      if (!userId) {
        return res.status(400).json({ error: 'User ID is required' })
      }
      
      let unreadCount = 0
      
      if (hasMongoDB) {
        try {
          const chatCollection = await getChatCollection()
          if (chatCollection) {
            unreadCount = await chatCollection.countDocuments({
              userId: userId,
              read: false
            })
          }
        } catch (mongoError) {
          console.error('MongoDB error fetching unread count:', mongoError)
          unreadCount = 0
        }
      }
      
      res.status(200).json({ 
        unreadCount,
        success: true
      })
    } catch (error) {
      console.error('Error fetching unread count:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  } else if (req.method === 'PUT') {
    try {
      const { userId, messageId } = req.body
      
      if (!userId || !messageId) {
        return res.status(400).json({ error: 'User ID and message ID are required' })
      }
      
      let success = false
      
      if (hasMongoDB) {
        try {
          const chatCollection = await getChatCollection()
          if (chatCollection) {
            const result = await chatCollection.updateOne(
              { 
                userId: userId,
                _id: new ObjectId(messageId)
              },
              { 
                $set: { 
                  read: true,
                  readAt: new Date()
                }
              }
            )
            success = result.modifiedCount > 0
          }
        } catch (mongoError) {
          console.error('MongoDB error marking message as read:', mongoError)
          success = false
        }
      }
      
      if (success) {
        res.status(200).json({ 
          message: 'Message marked as read',
          success: true
        })
      } else {
        res.status(404).json({ error: 'Message not found or already read' })
      }
    } catch (error) {
      console.error('Error marking message as read:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST', 'PUT'])
    res.status(405).json({ error: 'Method not allowed' })
  }
}
