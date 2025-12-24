import { NextApiRequest, NextApiResponse } from 'next'
import { MongoClient } from 'mongodb'

// MongoDB connection
const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/profitwave'
const client = new MongoClient(uri)

// Check admin authentication
function checkAuth(req: NextApiRequest): boolean {
  const adminAuth = req.headers.authorization
  const sessionAuth = req.cookies.adminAuthenticated
  
  return sessionAuth === 'true' || adminAuth === 'Bearer admin-token'
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!checkAuth(req)) {
    return res.status(401).json({ error: 'Unauthorized access' })
  }

  if (req.method === 'GET') {
    let dbConnection = null
    try {
      // Connect to MongoDB
      await client.connect()
      dbConnection = client.db()
      const notificationsCollection = dbConnection.collection('notifications')
      
      const { type, limit = 50 } = req.query
      
      // Get notifications from MongoDB
      let allNotifications = await notificationsCollection.find({}).sort({ createdAt: -1 }).toArray()
      
      // Filter by type if specified
      if (type && type !== 'all') {
        allNotifications = allNotifications.filter((n: any) => n.type === type)
      }
      
      // Limit results
      const limitedNotifications = allNotifications.slice(0, Number(limit))
      
      res.status(200).json({
        notifications: limitedNotifications,
        unread: limitedNotifications.filter((n: any) => !n.read).length
      })
    } catch (error) {
      console.error('Error fetching notifications:', error)
      res.status(500).json({ error: 'Internal server error' })
    } finally {
      if (dbConnection) {
        await client.close()
      }
    }
  } else if (req.method === 'PUT') {
    let dbConnection = null
    try {
      const { notificationId, read } = req.body
      
      if (!notificationId) {
        return res.status(400).json({ error: 'Notification ID is required' })
      }
      
      // Connect to MongoDB
      await client.connect()
      dbConnection = client.db()
      const notificationsCollection = dbConnection.collection('notifications')
      
      // Update notification
      const result = await notificationsCollection.updateOne(
        { _id: new (require('mongodb').ObjectId)(notificationId) },
        { $set: { read: read !== undefined ? read : true, updatedAt: new Date() } }
      )
      
      if (result.matchedCount === 0) {
        return res.status(404).json({ error: 'Notification not found' })
      }
      
      res.status(200).json({
        message: 'Notification updated',
        success: true
      })
    } catch (error) {
      console.error('Error updating notification:', error)
      res.status(500).json({ error: 'Internal server error' })
    } finally {
      if (dbConnection) {
        await client.close()
      }
    }
  } else if (req.method === 'DELETE') {
    let dbConnection = null
    try {
      const { notificationId } = req.body
      
      if (!notificationId) {
        return res.status(400).json({ error: 'Notification ID is required' })
      }
      
      // Connect to MongoDB
      await client.connect()
      dbConnection = client.db()
      const notificationsCollection = dbConnection.collection('notifications')
      
      // Delete notification
      const result = await notificationsCollection.deleteOne({ _id: new (require('mongodb').ObjectId)(notificationId) })
      
      if (result.deletedCount === 0) {
        return res.status(404).json({ error: 'Notification not found' })
      }
      
      res.status(200).json({ message: 'Notification deleted' })
    } catch (error) {
      console.error('Error deleting notification:', error)
      res.status(500).json({ error: 'Internal server error' })
    } finally {
      if (dbConnection) {
        await client.close()
      }
    }
  } else {
    res.setHeader('Allow', ['GET', 'PUT', 'DELETE'])
    res.status(405).end(`Method ${req.method} Not Allowed`)
  }
}
