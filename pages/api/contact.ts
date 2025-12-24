import { NextApiRequest, NextApiResponse } from 'next'
import { MongoClient, Db, ObjectId } from 'mongodb'

// Global in-memory storage for development when MongoDB isn't available
const inMemoryMessages = (typeof global !== 'undefined' && global.inMemoryMessages) ? global.inMemoryMessages : new Map()
if (typeof global !== 'undefined') {
  global.inMemoryMessages = inMemoryMessages
}

// Check if MongoDB URI is available
const hasMongoDB = !!process.env.MONGODB_URI && !process.env.MONGODB_URI.includes('username:password')

if (hasMongoDB) {
  console.log('MongoDB URI found, will use database storage')
} else {
  console.log('MongoDB URI not found or using placeholder, will use in-memory storage')
}

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

async function getMessagesCollection() {
  if (!hasMongoDB) {
    throw new Error('MongoDB not available')
  }
  const db = await getDatabase()
  return db.collection('contactMessages')
}

// Contact message interface
interface ContactMessage {
  _id?: any
  email: string
  subject: string
  message: string
  status: 'pending' | 'in-progress' | 'resolved'
  createdAt: Date
  updatedAt: Date
  userId?: string // Firebase UID if user is logged in
  userName?: string // User's name if available
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Check if MongoDB is configured and not using placeholder
  const isMongoDBConfigured = hasMongoDB
  
  if (req.method === 'POST') {
    try {
      const { email, subject, message, userId, userName } = req.body
      
      console.log('POST request to /api/contact with data:', { email, subject: subject?.substring(0, 50) + '...', messageLength: message?.length })
      
      // Validate required fields
      if (!email || !subject || !message) {
        console.log('Missing required fields:', { email: !!email, subject: !!subject, message: !!message })
        return res.status(400).json({ error: 'Missing required fields: email, subject, and message are required' })
      }

      // Validate email format
      const emailRegex = /\S+@\S+\.\S+/
      if (!emailRegex.test(email)) {
        return res.status(400).json({ error: 'Invalid email format' })
      }

      // Validate message length
      if (message.length < 10) {
        return res.status(400).json({ error: 'Message must be at least 10 characters long' })
      }

      if (message.length > 2000) {
        return res.status(400).json({ error: 'Message must be less than 2000 characters' })
      }

      const now = new Date()
      const contactMessage: Omit<ContactMessage, '_id'> = {
        email: email.trim(),
        subject: subject.trim(),
        message: message.trim(),
        status: 'pending',
        createdAt: now,
        updatedAt: now,
        userId: userId || undefined,
        userName: userName || undefined
      }

      console.log('Processed contact message:', { ...contactMessage, message: contactMessage.message.substring(0, 50) + '...' })

      if (isMongoDBConfigured) {
        console.log('MongoDB configured, trying to save to database...')
        // Use MongoDB
        try {
          const messages = await getMessagesCollection()
          const result = await messages.insertOne(contactMessage)
          console.log('Contact message saved to MongoDB with ID:', result.insertedId)
          
          // Create notification for admin about new message
          try {
            const db = await getDatabase()
            const notifications = db.collection('notifications')
            await notifications.insertOne({
              type: 'new_message',
              messageId: result.insertedId,
              userInfo: {
                email: email,
                name: userName || email.split('@')[0],
                userId: userId
              },
              message: `New message from ${userName || email}: ${subject}`,
              priority: 'high',
              read: false,
              createdAt: new Date(),
              actionUrl: `/system/portal-2024/dashboard?tab=messages&messageId=${result.insertedId}`
            })
            console.log('Admin notification created for new message')
          } catch (notifError) {
            console.error('Error creating notification:', notifError)
          }
          
          res.status(201).json({ 
            message: 'Contact message sent successfully', 
            messageId: result.insertedId,
            status: 'pending'
          })
        } catch (mongoError) {
          console.error('MongoDB error, falling back to memory:', mongoError)
          // Fallback to in-memory storage
          const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
          inMemoryMessages.set(messageId, { ...contactMessage, _id: messageId })
          console.log('Contact message saved to in-memory storage with ID:', messageId)
          res.status(201).json({ 
            message: 'Contact message sent successfully (in-memory fallback)', 
            messageId,
            status: 'pending'
          })
        }
      } else {
        console.log('MongoDB not configured, using in-memory storage')
        // Use in-memory storage
        const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        inMemoryMessages.set(messageId, { ...contactMessage, _id: messageId })
        console.log('Contact message saved to in-memory storage with ID:', messageId)
        res.status(201).json({ 
          message: 'Contact message sent successfully (in-memory)', 
          messageId,
          status: 'pending'
        })
      }
    } catch (error) {
      console.error('Error in contact API:', error)
      res.status(500).json({ error: 'Internal server error', details: error.message })
    }
  } else if (req.method === 'GET') {
    try {
      // This endpoint could be used by admin to view all messages
      const { status, userId } = req.query
      
      console.log('GET request to /api/contact with params:', { status, userId })
      
      let messages = []

      if (isMongoDBConfigured) {
        console.log('Trying MongoDB first...')
        try {
          const messagesCollection = await getMessagesCollection()
          
          // Build query based on parameters
          const query: any = {}
          if (status) query.status = status
          if (userId) query.userId = userId
          
          // Sort by creation date (newest first)
          const cursor = messagesCollection.find(query).sort({ createdAt: -1 })
          messages = await cursor.toArray()
          console.log(`Found ${messages.length} messages in MongoDB`)
        } catch (mongoError) {
          console.error('MongoDB error, checking memory:', mongoError)
          // Fallback to in-memory
          messages = Array.from(inMemoryMessages.values())
          if (status) {
            messages = messages.filter((msg: any) => msg.status === status)
          }
          if (userId) {
            messages = messages.filter((msg: any) => msg.userId === userId)
          }
          console.log(`Found ${messages.length} messages in in-memory fallback`)
        }
      } else {
        console.log('Using in-memory storage only')
        messages = Array.from(inMemoryMessages.values())
        if (status) {
          messages = messages.filter((msg: any) => msg.status === status)
        }
        if (userId) {
          messages = messages.filter((msg: any) => msg.userId === userId)
        }
        console.log(`Found ${messages.length} messages in in-memory storage`)
      }
      
      res.status(200).json({ 
        messages: messages.map(msg => ({
          ...msg,
          id: msg._id?.toString() || msg._id,
          // Don't include full message in list view for privacy
          messagePreview: msg.message?.substring(0, 100) + (msg.message?.length > 100 ? '...' : '')
        })),
        total: messages.length
      })
    } catch (error) {
      console.error('Error fetching contact messages:', error)
      res.status(500).json({ error: 'Internal server error', details: error.message })
    }
  } else if (req.method === 'PUT') {
    try {
      const { messageId, status } = req.body
      
      console.log('PUT request to /api/contact to update message status:', { messageId, status })
      
      if (!messageId || !status) {
        return res.status(400).json({ error: 'Message ID and status are required' })
      }

      const validStatuses = ['pending', 'in-progress', 'resolved']
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: 'Invalid status. Must be one of: ' + validStatuses.join(', ') })
      }

      let updated = false

      if (isMongoDBConfigured) {
        try {
          const messagesCollection = await getMessagesCollection()
          let query = {}
          
          // Try to convert messageId to ObjectId, if it fails use string
          try {
            query = { _id: new ObjectId(messageId) }
          } catch {
            query = { _id: messageId }
          }
          
          const result = await messagesCollection.updateOne(
            query,
            { 
              $set: { 
                status: status,
                updatedAt: new Date()
              }
            }
          )
          updated = result.modifiedCount > 0
        } catch (mongoError) {
          console.error('MongoDB error updating message:', mongoError)
          // Fallback to in-memory
          if (inMemoryMessages.has(messageId)) {
            const msg = inMemoryMessages.get(messageId)
            inMemoryMessages.set(messageId, { ...msg, status, updatedAt: new Date() })
            updated = true
          }
        }
      } else {
        // Use in-memory storage
        if (inMemoryMessages.has(messageId)) {
          const msg = inMemoryMessages.get(messageId)
          inMemoryMessages.set(messageId, { ...msg, status, updatedAt: new Date() })
          updated = true
        }
      }

      if (updated) {
        res.status(200).json({ message: 'Message status updated successfully' })
      } else {
        res.status(404).json({ error: 'Message not found' })
      }
    } catch (error) {
      console.error('Error updating contact message:', error)
      res.status(500).json({ error: 'Internal server error', details: error.message })
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST', 'PUT'])
    res.status(405).end(`Method ${req.method} Not Allowed`)
  }
}
