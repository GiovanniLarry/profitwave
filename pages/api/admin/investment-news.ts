import { NextApiRequest, NextApiResponse } from 'next'
import { MongoClient, ObjectId } from 'mongodb'

// MongoDB connection
const uri = process.env.MONGODB_URI
const isMongoDBConfigured = process.env.MONGODB_URI && !process.env.MONGODB_URI.includes('username:password')

async function getDatabase() {
  if (!isMongoDBConfigured) {
    throw new Error('MongoDB is not configured')
  }
  const { MongoClient } = require('mongodb')
  const client = new MongoClient(uri!)
  await client.connect()
  return client.db('profitwave')
}

async function getNewsCollection() {
  const db = await getDatabase()
  return db.collection('investmentNews')
}

// Simple admin authentication check
const checkAuth = (req: NextApiRequest) => {
  const adminToken = req.headers.authorization?.split('Bearer ')[1]
  return adminToken === 'admin-token-2024' // Simple token for now
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Check admin authentication
  if (!checkAuth(req)) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    if (req.method === 'GET') {
      // Get all investment news
      if (isMongoDBConfigured) {
        try {
          const news = await getNewsCollection()
          const allNews = await news.find({}).sort({ createdAt: -1 }).toArray()
          return res.status(200).json({ news: allNews })
        } catch (mongoError) {
          console.error('MongoDB error fetching news:', mongoError)
          return res.status(500).json({ error: 'MongoDB error' })
        }
      } else {
        return res.status(500).json({ error: 'MongoDB not configured' })
      }
    }

    if (req.method === 'POST') {
      // Create new investment news
      const { title, content, category, importance = 'normal' } = req.body

      if (!title || !content) {
        return res.status(400).json({ 
          error: 'Missing required fields',
          details: 'title and content are required'
        })
      }

      const newsItem = {
        title,
        content,
        category: category || 'general',
        importance, // 'low', 'normal', 'high'
        status: 'published',
        createdAt: new Date(),
        updatedAt: new Date(),
        publishedBy: 'admin'
      }

      if (isMongoDBConfigured) {
        try {
          const news = await getNewsCollection()
          const result = await news.insertOne(newsItem)
          return res.status(201).json({
            message: 'Investment news created successfully',
            news: { ...newsItem, _id: result.insertedId }
          })
        } catch (mongoError) {
          console.error('MongoDB error creating news:', mongoError)
          return res.status(500).json({ error: 'MongoDB error' })
        }
      } else {
        return res.status(500).json({ error: 'MongoDB not configured' })
      }
    }

    if (req.method === 'PUT') {
      // Update investment news
      const { id, title, content, category, importance, status } = req.body

      if (!id) {
        return res.status(400).json({ error: 'News ID is required' })
      }

      const updateData: any = {
        updatedAt: new Date()
      }

      if (title) updateData.title = title
      if (content) updateData.content = content
      if (category) updateData.category = category
      if (importance) updateData.importance = importance
      if (status) updateData.status = status

      if (isMongoDBConfigured) {
        try {
          const news = await getNewsCollection()
          const result = await news.updateOne(
            { _id: new ObjectId(id) },
            { $set: updateData }
          )

          if (result.matchedCount === 0) {
            return res.status(404).json({ error: 'News not found' })
          }

          return res.status(200).json({
            message: 'Investment news updated successfully'
          })
        } catch (mongoError) {
          console.error('MongoDB error updating news:', mongoError)
          return res.status(500).json({ error: 'MongoDB error' })
        }
      } else {
        return res.status(500).json({ error: 'MongoDB not configured' })
      }
    }

    if (req.method === 'DELETE') {
      // Delete investment news
      const { id } = req.body

      if (!id) {
        return res.status(400).json({ error: 'News ID is required' })
      }

      if (isMongoDBConfigured) {
        try {
          const news = await getNewsCollection()
          const result = await news.deleteOne({ _id: new ObjectId(id) })

          if (result.deletedCount === 0) {
            return res.status(404).json({ error: 'News not found' })
          }

          return res.status(200).json({
            message: 'Investment news deleted successfully'
          })
        } catch (mongoError) {
          console.error('MongoDB error deleting news:', mongoError)
          return res.status(500).json({ error: 'MongoDB error' })
        }
      } else {
        return res.status(500).json({ error: 'MongoDB not configured' })
      }
    }

    res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE'])
    res.status(405).json({ error: 'Method not allowed' })

  } catch (error) {
    console.error('Investment news API error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
