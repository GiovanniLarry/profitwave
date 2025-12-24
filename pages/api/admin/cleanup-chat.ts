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
      console.log('Starting chat cleanup process...')
      
      if (!hasMongoDB) {
        return res.status(500).json({ error: 'MongoDB not available' })
      }

      const chatCollection = await getChatCollection()
      if (!chatCollection) {
        return res.status(500).json({ error: 'Failed to connect to chat collection' })
      }

      // Calculate the cutoff time (24 hours ago)
      const twentyFourHoursAgo = new Date()
      twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24)
      
      console.log('Deleting messages older than:', twentyFourHoursAgo.toISOString())

      // Find and delete messages older than 24 hours
      const result = await chatCollection.deleteMany({
        createdAt: { $lt: twentyFourHoursAgo }
      })

      console.log(`Cleanup completed. Deleted ${result.deletedCount} old chat messages`)

      res.status(200).json({
        success: true,
        message: 'Chat cleanup completed successfully',
        deletedCount: result.deletedCount,
        cutoffTime: twentyFourHoursAgo.toISOString()
      })

    } catch (error) {
      console.error('Error during chat cleanup:', error)
      res.status(500).json({ error: 'Internal server error during cleanup' })
    }
  } else if (req.method === 'GET') {
    // Get statistics about old messages
    try {
      if (!hasMongoDB) {
        return res.status(500).json({ error: 'MongoDB not available' })
      }

      const chatCollection = await getChatCollection()
      if (!chatCollection) {
        return res.status(500).json({ error: 'Failed to connect to chat collection' })
      }

      // Calculate the cutoff time (24 hours ago)
      const twentyFourHoursAgo = new Date()
      twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24)

      // Count messages older than 24 hours
      const oldMessagesCount = await chatCollection.countDocuments({
        createdAt: { $lt: twentyFourHoursAgo }
      })

      // Count total messages
      const totalMessagesCount = await chatCollection.countDocuments()

      // Count messages from last 24 hours
      const recentMessagesCount = await chatCollection.countDocuments({
        createdAt: { $gte: twentyFourHoursAgo }
      })

      res.status(200).json({
        success: true,
        statistics: {
          totalMessages: totalMessagesCount,
          oldMessages: oldMessagesCount,
          recentMessages: recentMessagesCount,
          cutoffTime: twentyFourHoursAgo.toISOString()
        }
      })

    } catch (error) {
      console.error('Error getting chat statistics:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST'])
    res.status(405).json({ error: 'Method not allowed' })
  }
}
