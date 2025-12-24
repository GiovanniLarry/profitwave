import { NextApiRequest, NextApiResponse } from 'next'
import { MongoClient, ObjectId } from 'mongodb'

// MongoDB connection
const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/profitwave'
const client = new MongoClient(uri)

// Function to generate unique user ID (pw001, pw002, etc.)
const generateUniqueId = async (db: any): Promise<string> => {
  const usersCollection = db.collection('users')
  const userCount = await usersCollection.countDocuments()
  const nextId = userCount + 1
  return `pw${nextId.toString().padStart(3, '0')}`
}

// Function to get or create user unique ID
const getUserUniqueId = async (db: any, userId: string): Promise<string> => {
  const usersCollection = db.collection('users')
  
  // Try to find existing user
  let user = await usersCollection.findOne({ firebaseUid: userId })
  if (!user) {
    user = await usersCollection.findOne({ _id: new ObjectId(userId) })
  }
  if (!user) {
    user = await usersCollection.findOne({ uid: userId })
  }
  if (!user) {
    user = await usersCollection.findOne({ email: userId })
  }
  
  if (user && user.uniqueId) {
    return user.uniqueId
  }
  
  // Generate new unique ID if user doesn't have one
  const uniqueId = await generateUniqueId(db)
  
  // Update user with unique ID
  if (user) {
    await usersCollection.updateOne(
      { _id: user._id },
      { $set: { uniqueId, updatedAt: new Date() } }
    )
  }
  
  return uniqueId
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  let dbConnection = null

  try {
    // Connect to MongoDB
    await client.connect()
    dbConnection = client.db()
    const depositsCollection = dbConnection.collection('deposits')
    const usersCollection = dbConnection.collection('users')

    if (req.method === 'GET') {
      // Fetch pending deposits with user information
      const pendingDeposits = await depositsCollection
        .find({ status: 'pending' })
        .sort({ createdAt: -1 })
        .toArray()

      // Enrich with user information
      const enrichedDeposits = await Promise.all(
        pendingDeposits.map(async (deposit) => {
          // Try multiple ways to find the user
          let user = null
          
          // Try firebaseUid first
          user = await usersCollection.findOne({ firebaseUid: deposit.userId })
          
          // If not found, try _id
          if (!user) {
            user = await usersCollection.findOne({ _id: new ObjectId(deposit.userId) })
          }
          
          // If still not found, try uid field
          if (!user) {
            user = await usersCollection.findOne({ uid: deposit.userId })
          }
          
          // If still not found, try email as userId
          if (!user) {
            user = await usersCollection.findOne({ email: deposit.userId })
          }
          
          // Get or generate unique ID for this user
          const uniqueId = user ? await getUserUniqueId(dbConnection, deposit.userId) : 'N/A'
          
          console.log('Deposit userId:', deposit.userId, 'Found user:', !!user, 'User data:', user?.fullName, user?.email, 'Unique ID:', uniqueId)
          
          return {
            ...deposit,
            userInfo: user ? {
              fullName: user.fullName || user.name || 'Unknown User',
              email: user.email || 'unknown@example.com',
              username: user.username || user.displayName || 'unknown',
              uniqueId: uniqueId
            } : {
              fullName: 'User Not Found',
              email: 'notfound@example.com',
              username: 'unknown',
              uniqueId: 'N/A'
            }
          }
        })
      )

      res.status(200).json({
        success: true,
        pendingDeposits: enrichedDeposits
      })
    } else if (req.method === 'POST') {
      // Approve or reject deposit
      const { depositId, action } = req.body

      if (!depositId || !action || !['approve', 'reject'].includes(action)) {
        return res.status(400).json({ error: 'Invalid request' })
      }

      // Get deposit details
      const deposit = await depositsCollection.findOne({ _id: new ObjectId(depositId) })
      if (!deposit) {
        return res.status(404).json({ error: 'Deposit not found' })
      }

      // Update deposit status
      const newStatus = action === 'approve' ? 'approved' : 'rejected'
      await depositsCollection.updateOne(
        { _id: new ObjectId(depositId) },
        { 
          $set: { 
            status: newStatus,
            updatedAt: new Date()
          }
        }
      )

      if (action === 'approve') {
        // Credit user account
        await usersCollection.updateOne(
          { firebaseUid: deposit.userId },
          { 
            $inc: { balance: deposit.amount },
            $set: { updatedAt: new Date() }
          }
        )

        // Update user's deposit history
        await usersCollection.updateOne(
          { firebaseUid: deposit.userId },
          { 
            $set: { 
              'deposits.$[elem].status': 'approved',
              updatedAt: new Date()
            }
          },
          { 
            arrayFilters: [{ 'elem._id': new ObjectId(depositId) }]
          }
        )
      } else {
        // Update user's deposit history for rejection
        await usersCollection.updateOne(
          { firebaseUid: deposit.userId },
          { 
            $set: { 
              'deposits.$[elem].status': 'rejected',
              updatedAt: new Date()
            }
          },
          { 
            arrayFilters: [{ 'elem._id': new ObjectId(depositId) }]
          }
        )
      }

      res.status(200).json({
        success: true,
        message: `Deposit ${action}d successfully`,
        status: newStatus
      })
    }
  } catch (error) {
    console.error('Pending deposits API error:', error)
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    })
  } finally {
    if (dbConnection) {
      await client.close()
    }
  }
}
