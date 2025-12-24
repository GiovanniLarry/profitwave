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

  if (req.method === 'GET') {
    try {
      const { userId } = req.query
      
      console.log('Admin fetching chat messages for userId:', userId)
      
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
            
            // Try to find messages with the provided userId from the last 24 hours
            const cursor = chatCollection.find({ 
              userId: userId,
              createdAt: { $gte: twentyFourHoursAgo }
            }).sort({ createdAt: 1 })
            messages = await cursor.toArray()
            
            console.log('Found messages for admin:', messages.length, messages)
            
            // Convert ObjectId to string for JSON serialization
            messages = messages.map(msg => ({
              ...msg,
              _id: msg._id.toString()
            }))
          }
        } catch (mongoError) {
          console.error('MongoDB error fetching admin chat messages:', mongoError)
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
  } else {
    res.setHeader('Allow', ['GET'])
    res.status(405).json({ error: 'Method not allowed' })
  }
}
