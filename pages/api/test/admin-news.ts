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
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const results = {
      mongodbConfigured: isMongoDBConfigured,
      mongodbUri: uri ? 'configured' : 'not configured',
      placeholderCheck: uri ? uri.includes('username:password') : false,
      test: {
        created: false,
        retrieved: false,
        error: null
      },
      sampleNews: null
    }

    if (isMongoDBConfigured) {
      try {
        const news = await getNewsCollection()
        
        // Test creating a sample admin news post
        const testNewsItem = {
          title: 'Test Admin Investment News',
          content: 'This is a test news post created by admin to verify MongoDB storage works correctly.',
          category: 'test',
          importance: 'normal',
          status: 'published',
          createdAt: new Date(),
          updatedAt: new Date(),
          publishedBy: 'admin',
          isTest: true // Mark as test for cleanup
        }

        const result = await news.insertOne(testNewsItem)
        results.test.created = true
        console.log('Test news created with ID:', result.insertedId)

        // Test retrieving the news
        const retrievedNews = await news.findOne({ _id: result.insertedId })
        if (retrievedNews) {
          results.test.retrieved = true
          results.sampleNews = {
            id: retrievedNews._id,
            title: retrievedNews.title,
            content: retrievedNews.content,
            category: retrievedNews.category,
            importance: retrievedNews.importance,
            status: retrievedNews.status,
            publishedBy: retrievedNews.publishedBy,
            createdAt: retrievedNews.createdAt
          }
        }

        // Clean up the test news
        await news.deleteOne({ _id: result.insertedId })
        console.log('Test news cleaned up')

      } catch (mongoError) {
        results.test.error = mongoError.message
        console.error('MongoDB test error:', mongoError)
      }
    }

    res.status(200).json(results)
  } catch (error) {
    console.error('Test admin news API error:', error)
    res.status(500).json({ error: 'Internal server error', details: error.message })
  }
}
