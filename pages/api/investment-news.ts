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

        // If we have admin posts, return them
        if (allNews.length > 0) {
          return res.status(200).json({ 
            news: allNews.map(item => ({
              id: item._id,
              title: item.title,
              content: item.content,
              category: item.category,
              importance: item.importance,
              createdAt: item.createdAt,
              publishedBy: item.publishedBy || 'admin'
            })),
            source: 'mongodb'
          })
        }
      } catch (mongoError) {
        console.error('MongoDB error fetching news:', mongoError)
        // Fall through to sample news
      }
    }

    // Fallback: Return sample news (this will be used if MongoDB is not configured or has no admin posts)
    const sampleNews = [
      {
        id: '1',
        title: 'ProfitWave Investment Update',
        content: 'New investment opportunities are now available in renewable energy and technology sectors. Contact admin for details.',
        category: 'opportunities',
        importance: 'high',
        createdAt: new Date().toISOString(),
        publishedBy: 'admin'
      },
      {
        id: '2',
        title: 'Market Performance Report',
        content: 'Our investment portfolios are showing strong performance this quarter with average returns exceeding expectations.',
        category: 'performance',
        importance: 'normal',
        createdAt: new Date(Date.now() - 3600000).toISOString(),
        publishedBy: 'admin'
      },
      {
        id: '3',
        title: 'System Maintenance Notice',
        content: 'Scheduled maintenance will occur this weekend. All services will remain operational.',
        category: 'system',
        importance: 'low',
        createdAt: new Date(Date.now() - 7200000).toISOString(),
        publishedBy: 'admin'
      }
    ]

    return res.status(200).json({ 
      news: sampleNews,
      source: 'fallback',
      message: 'Using admin sample news - MongoDB not configured or no admin posts found'
    })
  } catch (error) {
    console.error('Investment news API error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
