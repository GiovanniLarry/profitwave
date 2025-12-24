import { NextApiRequest, NextApiResponse } from 'next'
import { MongoClient, ObjectId } from 'mongodb'

// MongoDB connection
const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/profitwave'
const client = new MongoClient(uri)

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Verify admin authentication
  const authHeader = req.headers.authorization
  if (!authHeader || authHeader !== 'Bearer admin-token') {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    await client.connect()
    const db = client.db()

    if (req.method === 'GET') {
      // Fetch all withdrawal requests
      const withdrawalsCollection = db.collection('withdrawals')
      const withdrawals = await withdrawalsCollection
        .find({})
        .sort({ createdAt: -1 })
        .toArray()

      // Fetch user information for each withdrawal
      const usersCollection = db.collection('users')
      const withdrawalsWithUserInfo = await Promise.all(
        withdrawals.map(async (withdrawal) => {
          const user = await usersCollection.findOne({ _id: withdrawal.userId })
          return {
            ...withdrawal,
            userInfo: user ? {
              fullName: user.fullName,
              email: user.email,
              username: user.username,
              uniqueId: user.uniqueId
            } : null
          }
        })
      )

      res.status(200).json({ withdrawals: withdrawalsWithUserInfo })
    } else if (req.method === 'POST') {
      // Process withdrawal (approve/reject)
      const { withdrawalId, action, adminNote } = req.body

      if (!withdrawalId || !action || !['approve', 'reject'].includes(action)) {
        return res.status(400).json({ error: 'Invalid request parameters' })
      }

      const withdrawalsCollection = db.collection('withdrawals')
      const usersCollection = db.collection('users')

      // Find the withdrawal
      const withdrawal = await withdrawalsCollection.findOne({ _id: new ObjectId(withdrawalId) })
      if (!withdrawal) {
        return res.status(404).json({ error: 'Withdrawal not found' })
      }

      if (withdrawal.status !== 'pending') {
        return res.status(400).json({ error: 'Withdrawal already processed' })
      }

      if (action === 'approve') {
        // Update withdrawal status
        await withdrawalsCollection.updateOne(
          { _id: new ObjectId(withdrawalId) },
          {
            $set: {
              status: 'approved',
              processedAt: new Date(),
              adminNote: adminNote || '',
              processedBy: 'admin'
            }
          }
        )

        // Create notification for user
        const notificationsCollection = db.collection('notifications')
        await notificationsCollection.insertOne({
          userId: withdrawal.userId,
          type: 'withdrawal_approved',
          withdrawalId: withdrawal._id,
          amount: withdrawal.amount,
          referenceId: withdrawal.referenceId,
          message: `Your withdrawal request of XAF ${withdrawal.amount.toLocaleString()} has been approved and processed.`,
          read: false,
          createdAt: new Date(),
          priority: 'high'
        })

        res.status(200).json({
          success: true,
          message: 'Withdrawal approved successfully',
          withdrawal: { ...withdrawal, status: 'approved' }
        })
      } else if (action === 'reject') {
        // Update withdrawal status
        await withdrawalsCollection.updateOne(
          { _id: new ObjectId(withdrawalId) },
          {
            $set: {
              status: 'rejected',
              processedAt: new Date(),
              adminNote: adminNote || '',
              processedBy: 'admin'
            }
          }
        )

        // Refund the amount to user's balance
        await usersCollection.updateOne(
          { _id: withdrawal.userId },
          {
            $inc: { balance: withdrawal.amount },
            $set: { updatedAt: new Date() }
          }
        )

        // Create notification for user
        const notificationsCollection = db.collection('notifications')
        await notificationsCollection.insertOne({
          userId: withdrawal.userId,
          type: 'withdrawal_rejected',
          withdrawalId: withdrawal._id,
          amount: withdrawal.amount,
          referenceId: withdrawal.referenceId,
          adminNote: adminNote || '',
          message: `Your withdrawal request of XAF ${withdrawal.amount.toLocaleString()} has been rejected. The amount has been refunded to your balance.`,
          read: false,
          createdAt: new Date(),
          priority: 'high'
        })

        res.status(200).json({
          success: true,
          message: 'Withdrawal rejected and amount refunded',
          withdrawal: { ...withdrawal, status: 'rejected' }
        })
      }
    } else if (req.method === 'DELETE') {
      // Delete withdrawal record
      const { withdrawalId } = req.body

      if (!withdrawalId) {
        return res.status(400).json({ error: 'Withdrawal ID is required' })
      }

      const withdrawalsCollection = db.collection('withdrawals')
      const result = await withdrawalsCollection.deleteOne({ _id: new ObjectId(withdrawalId) })

      if (result.deletedCount === 0) {
        return res.status(404).json({ error: 'Withdrawal not found' })
      }

      res.status(200).json({
        success: true,
        message: 'Withdrawal deleted successfully'
      })
    } else {
      res.status(405).json({ error: 'Method not allowed' })
    }
  } catch (error) {
    console.error('Withdrawals API error:', error)
    res.status(500).json({ error: 'Internal server error' })
  } finally {
    await client.close()
  }
}
