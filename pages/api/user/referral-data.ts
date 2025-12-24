import { NextApiRequest, NextApiResponse } from 'next'
import { MongoClient, Db } from 'mongodb'

// Check if MongoDB URI is configured and not using placeholder
const isMongoDBConfigured = process.env.MONGODB_URI && !process.env.MONGODB_URI.includes('username:password')

const uri = process.env.MONGODB_URI
const options = {}

let client: MongoClient
let clientPromise: Promise<MongoClient>

// Only initialize MongoDB if it's configured
if (isMongoDBConfigured) {
  if (process.env.NODE_ENV === 'development') {
    let globalWithMongo = global as typeof global & {
      _mongoClientPromise?: Promise<MongoClient>
    }

    if (!globalWithMongo._mongoClientPromise) {
      client = new MongoClient(uri!, options)
      globalWithMongo._mongoClientPromise = client.connect()
    }
    clientPromise = globalWithMongo._mongoClientPromise
  } else {
    client = new MongoClient(uri!, options)
    clientPromise = client.connect()
  }
}

async function getDatabase(): Promise<Db> {
  if (!clientPromise) {
    throw new Error('MongoDB is not configured')
  }
  const client = await clientPromise
  return client.db('profitwave')
}

async function getUsersCollection() {
  const db = await getDatabase()
  return db.collection('users')
}

async function getReferralsCollection() {
  const db = await getDatabase()
  return db.collection('referrals')
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET'])
    return res.status(405).end(`Method ${req.method} Not Allowed`)
  }

  try {
    const { userId } = req.query

    if (!userId || typeof userId !== 'string') {
      return res.status(400).json({ error: 'User ID is required' })
    }

    // Default response
    const defaultData = {
      referralCode: '',
      referralLink: '',
      totalReferrals: 0,
      totalEarnings: 0
    }

    if (!isMongoDBConfigured) {
      console.log('MongoDB not configured, returning default referral data')
      return res.status(200).json(defaultData)
    }

    try {
      const users = await getUsersCollection()
      const user = await users.findOne({ firebaseUid: userId })

      if (!user) {
        console.log('User not found, returning default referral data')
        return res.status(200).json(defaultData)
      }

      // Generate referral code if not exists
      let referralCode = user.referralCode
      if (!referralCode) {
        // Generate a simple referral code based on user ID
        referralCode = `PW${user.uniqueId || userId.slice(-6).toUpperCase()}`
        
        // Update user with referral code
        await users.updateOne(
          { firebaseUid: userId },
          { $set: { referralCode, updatedAt: new Date() } }
        )
      }

      // Get referral statistics
      let totalReferrals = 0
      let totalEarnings = 0

      try {
        const referrals = await getReferralsCollection()
        
        // Count completed referrals
        totalReferrals = await referrals.countDocuments({ 
          referrerId: userId,
          status: 'completed'
        })

        // Calculate total earnings (500 XAF per successful referral)
        totalEarnings = totalReferrals * 500

        console.log(`Referral stats for ${userId}: ${totalReferrals} referrals, ${totalEarnings} XAF earnings`)
      } catch (referralError) {
        console.error('Error fetching referral statistics:', referralError)
        // Continue with default values
      }

      const referralLink = `${process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_URL || 'https://profitwave.vercel.app'}?ref=${referralCode}`

      const responseData = {
        referralCode,
        referralLink,
        totalReferrals,
        totalEarnings
      }

      console.log('Returning referral data:', responseData)
      res.status(200).json(responseData)

    } catch (mongoError) {
      console.error('MongoDB error in referral-data API:', mongoError)
      res.status(200).json(defaultData)
    }

  } catch (error) {
    console.error('Error in referral-data API:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}
