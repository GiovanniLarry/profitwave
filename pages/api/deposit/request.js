const { getAuth } = require('firebase/auth')
const { MongoClient } = require('mongodb')
const multer = require('multer')
const { auth } = require('../../../lib/firebase')

// Firebase configuration is handled in lib/firebase.ts

// MongoDB connection
const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017'
const client = new MongoClient(uri)

// Configure multer for file uploads
const storage = multer.memoryStorage()
const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true)
    } else {
      cb(new Error('Only image files are allowed'))
    }
  }
})

module.exports = {
  config: {
    api: {
      bodyParser: false,
    },
  }
}

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Verify user authentication
    const token = req.headers.authorization?.split(' ')[1]
    if (!token) {
      return res.status(401).json({ error: 'No token provided' })
    }

    const decodedToken = await auth.verifyIdToken(token)
    const userId = decodedToken.uid

    // Handle file upload
    upload.single('screenshot')(req, res, async (err) => {
      if (err) {
        console.error('File upload error:', err)
        return res.status(400).json({ error: err.message })
      }

      const { transactionId, amount, method, userEmail } = req.body
      const screenshot = req.file

      if (!transactionId || !amount || !method || !screenshot) {
        return res.status(400).json({ error: 'Missing required fields' })
      }

      // Connect to MongoDB
      await client.connect()
      const db = client.db('profitwave')
      const depositsCollection = db.collection('deposits')

      // Create deposit request
      const depositRequest = {
        userId,
        userEmail,
        transactionId,
        amount: parseFloat(amount),
        method,
        status: 'pending',
        screenshot: {
          data: screenshot.buffer.toString('base64'),
          contentType: screenshot.mimetype,
          size: screenshot.size
        },
        createdAt: new Date(),
        reviewedAt: null,
        reviewedBy: null,
        notes: null
      }

      // Check if transaction ID already exists
      const existingDeposit = await depositsCollection.findOne({ transactionId })
      if (existingDeposit) {
        return res.status(400).json({ error: 'Transaction ID already exists' })
      }

      // Insert deposit request
      const result = await depositsCollection.insertOne(depositRequest)

      console.log(`Deposit request created: ${result.insertedId}`, {
        userId,
        status: 'pending'
      })

      res.status(200).json({ 
        success: true, 
        message: 'Deposit request submitted successfully. Please wait for admin approval.',
        depositId: result.insertedId.toString()
      })
    })

  } catch (error) {
    console.error('Deposit request error:', error)
    res.status(500).json({ error: 'Internal server error' })
  } finally {
    await client.close()
  }
}

module.exports.handler = handler
