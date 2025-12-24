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

async function getChatCollection() {
  if (!hasMongoDB) return null
  
  const client = await clientPromise
  const db = client.db('profitwave')
  return db.collection('chats')
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Get user ID from session or query
  const userId = req.query.userId as string || req.cookies.userId || ''
  
  if (!userId) {
    return res.status(400).json({ error: 'User ID is required' })
  }

  if (req.method === 'GET') {
    try {
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
  } else {
    res.setHeader('Allow', ['GET'])
    res.status(405).json({ error: 'Method not allowed' })
  }
}
