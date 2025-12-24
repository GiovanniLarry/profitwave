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

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Check admin authentication
  if (!checkAuth(req)) {
    return res.status(401).json({ error: 'Unauthorized access' })
  }

  if (req.method === 'POST') {
    try {
      const { userId, message } = req.body
      
      console.log('Admin sending chat message:', { userId, message })
      
      if (!userId || !message) {
        return res.status(400).json({ error: 'User ID and message are required' })
      }
      
      let success = false
      
      if (hasMongoDB) {
        try {
          const chatCollection = await getChatCollection()
          if (chatCollection) {
            const result = await chatCollection.insertOne({
              userId: userId,
              adminMessage: message,
              messageDate: new Date(),
              read: false,
              type: 'admin_response',
              createdAt: new Date()
            })
            console.log('Message inserted with ID:', result.insertedId)
            success = true
          }
        } catch (mongoError) {
          console.error('MongoDB error sending admin chat message:', mongoError)
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
      console.error('Error sending admin chat message:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  } else {
    res.setHeader('Allow', ['POST'])
    res.status(405).json({ error: 'Method not allowed' })
  }
}
