import { NextApiRequest, NextApiResponse } from 'next'
import { MongoClient } from 'mongodb'

// MongoDB connection
const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/profitwave'
const client = new MongoClient(uri)

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('=== MERCHANT INFO DEBUG ===')
  
  let dbConnection = null

  try {
    await client.connect()
    dbConnection = client.db()
    console.log('Connected to database:', dbConnection.databaseName)

    // Check all collections
    const collections = await dbConnection.listCollections().toArray()
    console.log('Available collections:', collections.map(c => c.name))

    // Look for merchant or configuration collections
    const possibleCollections = ['merchants', 'config', 'settings', 'payment_methods', 'admin_config']
    
    for (const collectionName of possibleCollections) {
      try {
        const collection = dbConnection.collection(collectionName)
        const count = await collection.countDocuments()
        if (count > 0) {
          console.log(`Found ${count} documents in ${collectionName} collection`)
          const docs = await collection.find({}).toArray()
          console.log(`${collectionName} documents:`, JSON.stringify(docs, null, 2))
        }
      } catch (e) {
        console.log(`Collection ${collectionName} not found or error:`, e.message)
      }
    }

    // Check deposits collection for merchant info
    const depositsCollection = dbConnection.collection('deposits')
    const recentDeposits = await depositsCollection.find({}).sort({ createdAt: -1 }).limit(5).toArray()
    
    console.log('Recent deposits with merchant info:')
    recentDeposits.forEach(deposit => {
      console.log('Deposit:', {
        id: deposit._id,
        method: deposit.method,
        merchantName: deposit.merchantName,
        merchantNumber: deposit.merchantNumber,
        createdAt: deposit.createdAt
      })
    })

    // Check users collection for merchant info
    const usersCollection = dbConnection.collection('users')
    const users = await usersCollection.find({}).limit(3).toArray()
    
    console.log('Users with merchant info:')
    users.forEach(user => {
      if (user.deposits && user.deposits.length > 0) {
        console.log('User deposits:', user.deposits.map(d => ({
          method: d.method,
          merchantName: d.merchantName,
          merchantNumber: d.merchantNumber
        })))
      }
    })

    res.status(200).json({
      success: true,
      collections: collections.map(c => c.name),
      recentDeposits: recentDeposits.map(d => ({
        id: d._id,
        method: d.method,
        merchantName: d.merchantName,
        merchantNumber: d.merchantNumber,
        createdAt: d.createdAt
      })),
      usersWithDeposits: users.filter(u => u.deposits && u.deposits.length > 0).length
    })

  } catch (error) {
    console.error('Merchant debug error:', error)
    res.status(500).json({ error: error.message })
  } finally {
    if (dbConnection) {
      await client.close()
    }
  }
}
