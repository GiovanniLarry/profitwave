import { NextApiRequest, NextApiResponse } from 'next'

// MongoDB connection
const uri = process.env.MONGODB_URI
const isMongoDBConfigured = process.env.MONGODB_URI && !process.env.MONGODB_URI.includes('username:password')

interface TestResults {
  mongodbConfigured: boolean
  mongodbUri: string
  placeholderCheck: boolean
  collections: {
    available: string[]
    count: number
    users?: {
      count: number
      sample: any[]
    }
  }
  sampleData: {
    newsCount: number
    sampleItems: any[]
  } | null
  mongodbError?: string
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const results: TestResults = {
      mongodbConfigured: isMongoDBConfigured,
      mongodbUri: uri ? 'configured' : 'not configured',
      placeholderCheck: uri ? uri.includes('username:password') : false,
      collections: {
        available: [],
        count: 0
      },
      sampleData: null
    }

    if (isMongoDBConfigured) {
      try {
        const { MongoClient } = require('mongodb')
        const client = new MongoClient(uri!)
        await client.connect()
        const db = client.db('profitwave')

        // Check collections
        const collections = await db.listCollections().toArray()
        results.collections = {
          available: collections.map(c => c.name),
          count: collections.length
        }

        // Check investment news collection
        const newsCollection = db.collection('investmentNews')
        const newsCount = await newsCollection.countDocuments()
        const sampleNews = await newsCollection.find({}).limit(3).toArray()
        
        results.sampleData = {
          newsCount,
          sampleItems: sampleNews.map(item => ({
            id: item._id,
            title: item.title,
            status: item.status,
            createdAt: item.createdAt
          }))
        }

        await client.close()
      } catch (mongoError) {
        results.mongodbError = mongoError.message
      }
    }

    res.status(200).json(results)
  } catch (error) {
    console.error('Test MongoDB API error:', error)
    res.status(500).json({ error: 'Internal server error', details: error.message })
  }
}
