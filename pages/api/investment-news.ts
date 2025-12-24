import { NextApiRequest, NextApiResponse } from 'next'

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

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    if (isMongoDBConfigured) {
      try {
        const news = await getNewsCollection()
        const allNews = await news
          .find({ status: 'published' })
          .sort({ createdAt: -1 })
          .limit(20) // Limit to latest 20 news items
          .toArray()

        return res.status(200).json({ 
          news: allNews.map(item => ({
            id: item._id,
            title: item.title,
            content: item.content,
            category: item.category,
            importance: item.importance,
            createdAt: item.createdAt
          }))
        })
      } catch (mongoError) {
        console.error('MongoDB error fetching news:', mongoError)
        return res.status(500).json({ error: 'MongoDB error' })
      }
    } else {
      // Fallback to sample news if MongoDB not configured
      const sampleNews = [
        {
          id: '1',
          title: 'Market Update: Tech Stocks Rally',
          content: 'Technology stocks showed strong performance today with major gains in software and semiconductor sectors.',
          category: 'markets',
          importance: 'high',
          createdAt: new Date().toISOString()
        },
        {
          id: '2',
          title: 'New Investment Opportunities Available',
          content: 'We are pleased to announce new investment opportunities in renewable energy and emerging markets.',
          category: 'opportunities',
          importance: 'normal',
          createdAt: new Date(Date.now() - 3600000).toISOString()
        }
      ]

      return res.status(200).json({ news: sampleNews })
    }
  } catch (error) {
    console.error('Investment news API error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
