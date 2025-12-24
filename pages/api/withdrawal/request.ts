import { NextApiRequest, NextApiResponse } from 'next'
import { MongoClient, ObjectId } from 'mongodb'

// MongoDB connection
const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/profitwave'
const client = new MongoClient(uri)

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { amount, phoneNumber, provider, accountName, method } = req.body

    // Validate required fields
    if (!amount || !phoneNumber || !provider || !accountName) {
      return res.status(400).json({ error: 'All fields are required' })
    }

    // Validate minimum withdrawal amount
    if (amount < 9500) {
      return res.status(400).json({ error: 'Minimum withdrawal amount is XAF 9,500' })
    }

    // Get user from Firebase token
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const token = authHeader.substring(7)
    let userId: string

    try {
      // Parse Firebase token (simplified - in production, verify with Firebase Admin SDK)
      const payload = JSON.parse(atob(token.split('.')[1]))
      userId = payload.sub || payload.user_id
    } catch (error) {
      return res.status(401).json({ error: 'Invalid token' })
    }

    await client.connect()
    const db = client.db()

    // Check user's current balance
    const usersCollection = db.collection('users')
    const user = await usersCollection.findOne({ firebaseUid: userId })

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    if (user.balance < amount) {
      return res.status(400).json({ error: 'Insufficient balance' })
    }

    // Create withdrawal record
    const withdrawalsCollection = db.collection('withdrawals')
    const withdrawalRecord = {
      userId: user._id,
      firebaseUid: userId,
      amount,
      phoneNumber,
      provider,
      accountName,
      method: method || `${provider === 'orange' ? 'Orange Money' : 'MTN Mobile Money'}`,
      status: 'pending',
      createdAt: new Date(),
      processedAt: null,
      referenceId: `WD_${Date.now()}_${Math.random().toString(36).substr(2, 9).toUpperCase()}`
    }

    const result = await withdrawalsCollection.insertOne(withdrawalRecord)

    // Update user balance (deduct amount)
    await usersCollection.updateOne(
      { _id: user._id },
      { 
        $inc: { balance: -amount },
        $set: { updatedAt: new Date() }
      }
    )

    // Create notification for admin
    const notificationsCollection = db.collection('notifications')
    await notificationsCollection.insertOne({
      type: 'withdrawal_pending',
      userId: user._id,
      withdrawalId: result.insertedId,
      userInfo: {
        fullName: user.fullName,
        email: user.email,
        userId: user.uniqueId || 'N/A'
      },
      amount,
      phoneNumber,
      provider,
      accountName,
      status: 'pending',
      priority: 'high',
      read: false,
      createdAt: new Date(),
      message: `New withdrawal request: XAF ${amount.toLocaleString()} via ${provider === 'orange' ? 'Orange Money' : 'MTN Mobile Money'}`,
      actionUrl: `/system/portal-2024/dashboard?tab=withdrawals&withdrawalId=${result.insertedId}`
    })

    res.status(200).json({
      success: true,
      message: 'Withdrawal request submitted successfully',
      withdrawalId: result.insertedId,
      referenceId: withdrawalRecord.referenceId,
      processingTime: '30 minutes - 1 hour'
    })

  } catch (error) {
    console.error('Withdrawal request error:', error)
    res.status(500).json({ error: 'Internal server error' })
  } finally {
    await client.close()
  }
}
