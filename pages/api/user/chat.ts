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
  // Get user ID from Firebase auth (for actual users)
  let userId = ''
  
  // Try to get userId from request body first (for POST requests)
  if (req.method === 'POST' && req.body.userId) {
    userId = req.body.userId
  }
  // Then try query parameter
  else if (req.query.userId) {
    userId = req.query.userId as string
  }
  // Then try cookie
  else if (req.cookies.userId) {
    userId = req.cookies.userId
  }
  
  console.log('User chat API - method:', req.method, 'userId:', userId)
  
  if (!userId) {
    return res.status(400).json({ error: 'User ID is required' })
  }

  if (req.method === 'GET') {
    try {
      const { userId } = req.query
      
      console.log('User fetching chat messages for userId:', userId)
      
      if (!userId) {
        return res.status(400).json({ error: 'User ID is required' })
      }
      
      let messages = []
      
      if (hasMongoDB) {
        try {
          const chatCollection = await getChatCollection()
          if (chatCollection) {
            // Calculate the cutoff time (24 hours ago)
            const twentyFourHoursAgo = new Date()
            twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24)
            
            // Only fetch messages from the last 24 hours
            const cursor = chatCollection.find({ 
              userId: userId,
              createdAt: { $gte: twentyFourHoursAgo }
            }).sort({ createdAt: 1 })
            messages = await cursor.toArray()
            
            console.log('Found messages for user:', messages.length, messages)
            
            // Convert ObjectId to string for JSON serialization
            messages = messages.map(msg => ({
              ...msg,
              _id: msg._id.toString()
            }))
          }
        } catch (mongoError) {
          console.error('MongoDB error fetching user chat messages:', mongoError)
          messages = []
        }
      }
      
      res.status(200).json({ 
        messages,
        success: true
      })
    } catch (error) {
      console.error('Error fetching chat messages:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  } else if (req.method === 'PUT') {
    try {
      const { messageId } = req.body
      
      if (!messageId) {
        return res.status(400).json({ error: 'Message ID is required' })
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
  } else if (req.method === 'POST') {
    try {
      const { message } = req.body
      
      if (!message) {
        return res.status(400).json({ error: 'Message is required' })
      }
      
      let success = false
      
      if (hasMongoDB) {
        try {
          const chatCollection = await getChatCollection()
          if (chatCollection) {
            await chatCollection.insertOne({
              userId: userId,
              userMessage: message,
              messageDate: new Date(),
              read: false,
              type: 'user_message',
              createdAt: new Date()
            })
            success = true
          }
        } catch (mongoError) {
          console.error('MongoDB error saving user message:', mongoError)
          success = false
        }
      }
      
      if (success) {
        res.status(200).json({ 
          message: 'Message sent successfully',
          success: true
        })
      } else {
        res.status(500).json({ error: 'Failed to send message' })
      }
    } catch (error) {
      console.error('Error sending user message:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST', 'PUT'])
    res.status(405).json({ error: 'Method not allowed' })
  }
}
