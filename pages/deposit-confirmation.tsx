import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArrowLeft, faUpload, faCheck, faMobileAlt, faImage, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons'
import Link from 'next/link'
import { getAuth } from 'firebase/auth'
import { initializeApp, getApps } from 'firebase/app'
import { useRouter } from 'next/router'

// Firebase initialization
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
}

if (!getApps().length) {
  initializeApp(firebaseConfig)
}

interface DepositData {
  amount: number
  method: string
  merchantName: string
  merchantNumber: string
}

export default function DepositConfirmation() {
  const [user, setUser] = useState<any>(null)
  const [depositData, setDepositData] = useState<DepositData | null>(null)
  const [screenshot, setScreenshot] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string>('')
  const [paymentId, setPaymentId] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const paymentMethods = {
    'orange-money': {
      name: 'Orange Money',
      merchantName: 'ProfitWave Cameroon',
      merchantNumber: '+237 695 814 541',
      instructions: [
        'Go to your Orange Money app',
        'Select "Send Money"',
        'Enter merchant number: +237 695 814 541',
        'Enter the amount',
        'Confirm transaction with your PIN',
        'Take a screenshot showing the payment ID (this is the transaction ID you receive in the confirmation message)'
      ]
    },
    'mtn-mobile-money': {
      name: 'MTN Mobile Money',
      merchantName: 'ProfitWave Cameroon',
      merchantNumber: '+237 695 814 541',
      instructions: [
        'Go to your MTN Mobile Money app',
        'Select "Send Money"',
        'Enter merchant number: +237 695 814 541',
        'Enter the amount',
        'Confirm transaction with your PIN',
        'Take a screenshot showing the payment ID (this is the transaction ID you receive in the confirmation message)'
      ]
    }
  }

  useEffect(() => {
    const checkAuth = async () => {
      const auth = getAuth()
      
      // First check Firebase auth
      const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
        if (firebaseUser) {
          setUser(firebaseUser)
        } else {
          // Fallback 1: Check localStorage session
          const localSession = localStorage.getItem('userSession')
          if (localSession) {
            try {
              const sessionData = JSON.parse(localSession)
              // Check if session is not too old (24 hours)
              if (Date.now() - sessionData.timestamp < 24 * 60 * 60 * 1000) {
                setUser({ email: sessionData.user.email, uid: sessionData.user.firebaseUid })
                return
              } else {
                // Session expired, remove it
                localStorage.removeItem('userSession')
              }
            } catch (error) {
              console.error('Invalid session data:', error)
              localStorage.removeItem('userSession')
            }
          }
          
          // Fallback 2: Check if user has MongoDB session
          try {
            const response = await fetch('/api/auth/check-session')
            if (response.ok) {
              const data = await response.json()
              if (data.authenticated) {
                // User is authenticated via MongoDB, allow access
                setUser({ email: data.user.email, uid: data.user.firebaseUid })
                return
              }
            }
          } catch (error) {
            console.error('Session check failed:', error)
          }
          
          // No authentication found, redirect to login
          router.push('/get-started')
        }
      })

      return unsubscribe
    }

    const initializeAuth = async () => {
      const unsubscribe = await checkAuth()

      // Get deposit data from query params or localStorage
      const { amount, method } = router.query
      if (amount && method) {
        const depositAmount = parseFloat(amount as string)
        if (depositAmount < 6500) {
          router.push('/wallet')
          return
        }
        const methodData = paymentMethods[method as keyof typeof paymentMethods]
        const depositData = {
          amount: depositAmount,
          method: methodData.name,
          merchantName: methodData.merchantName,
          merchantNumber: methodData.merchantNumber
        }
        setDepositData(depositData)
      } else {
        // Fallback to localStorage
        const storedDeposit = localStorage.getItem('pendingDeposit')
        if (storedDeposit) {
          const data = JSON.parse(storedDeposit)
          if (data.amount < 6500) {
            localStorage.removeItem('pendingDeposit')
            router.push('/wallet')
            return
          }
          setDepositData(data)
        } else {
          router.push('/wallet')
        }
      }

      return unsubscribe
    }

    initializeAuth()

    return () => {
      // Cleanup if needed
    }
  }, [router])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type - specific formats only
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/bmp', 'image/webp']
      if (!allowedTypes.includes(file.type)) {
        setError('Unsupported file type. Allowed formats: JPG, PNG, GIF, BMP, WEBP')
        return
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setError('File size must be less than 10MB')
        return
      }

      setScreenshot(file)
      setPreviewUrl(URL.createObjectURL(file))
      setError('')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!screenshot || !paymentId || !depositData) {
      setError('Please fill in all fields and upload a screenshot')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const auth = getAuth()
      let token = null
      
      // Try to get token from Firebase auth first
      if (auth.currentUser) {
        token = await auth.currentUser.getIdToken()
      } else {
        // Fallback: create a simple token from user data for session-based auth
        token = Buffer.from(JSON.stringify({
          uid: user.uid,
          email: user.email,
          timestamp: Date.now()
        })).toString('base64')
      }

      if (!token) {
        setError('Authentication error. Please refresh the page and try again.')
        return
      }

      const formData = new FormData()
      formData.append('screenshot', screenshot)
      formData.append('paymentId', paymentId)
      formData.append('amount', depositData.amount.toString())
      formData.append('method', depositData.method)
      formData.append('userId', user.uid)

      const response = await fetch('/api/deposit/confirm', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      })

      if (response.ok) {
        const data = await response.json()
        setShowSuccess(true)
        
        // Clear localStorage
        localStorage.removeItem('pendingDeposit')
        
        // Redirect after 3 seconds
        setTimeout(() => {
          router.push('/wallet')
        }, 3000)
      } else {
        const errorData = await response.json()
        const errorMessage = errorData.details || errorData.error || 'Failed to submit deposit confirmation'
        setError(errorMessage)
      }
    } catch (error) {
      console.error('Error submitting deposit:', error)
      setError('Failed to submit deposit confirmation. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  if (!user || !depositData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-2xl">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white p-4">
      {/* Header */}
      <div className="max-w-4xl mx-auto mb-8">
        <div className="flex items-center justify-between mb-6">
          <Link href="/wallet">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
            >
              <FontAwesomeIcon icon={faArrowLeft} className="w-5 h-5" />
            </motion.button>
          </Link>
          <h1 className="text-3xl font-bold">Deposit Confirmation</h1>
          <div className="w-10" />
        </div>
      </div>

      <div className="max-w-4xl mx-auto">
        {/* Minimum Deposit Notice */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-blue-500/20 border border-blue-500/50 rounded-xl p-4 mb-8"
        >
          <div className="flex items-start space-x-3">
            <FontAwesomeIcon icon={faExclamationTriangle} className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-blue-400">Minimum Deposit: XAF 6,500</p>
              <p className="text-sm text-white/80">All deposits must be at least XAF 6,500 to be processed.</p>
            </div>
          </div>
        </motion.div>

        {/* Deposit Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-6 mb-8"
        >
          <h2 className="text-2xl font-bold mb-4">Deposit Summary</h2>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Amount:</span>
              <span className="font-bold">XAF {depositData.amount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Payment Method:</span>
              <span className="font-bold">{depositData.method}</span>
            </div>
            <div className="flex justify-between">
              <span>Merchant Name:</span>
              <span className="font-bold">{depositData.merchantName}</span>
            </div>
            <div className="flex justify-between">
              <span>Merchant Number:</span>
              <span className="font-bold">{depositData.merchantNumber}</span>
            </div>
          </div>
        </motion.div>

        {/* Payment Instructions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/10 backdrop-blur-md rounded-2xl p-6 mb-8"
        >
          <h3 className="text-xl font-bold mb-4">Payment Instructions</h3>
          <div className="space-y-3">
            {paymentMethods[depositData.method.toLowerCase().replace(' ', '-') as keyof typeof paymentMethods]?.instructions.map((instruction, index) => (
              <div key={index} className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold">{index + 1}</span>
                </div>
                <p className="text-white/80">{instruction}</p>
              </div>
            ))}
          </div>
          
          <div className="mt-6 p-4 bg-yellow-500/20 border border-yellow-500/50 rounded-lg">
            <div className="flex items-start space-x-3">
              <FontAwesomeIcon icon={faExclamationTriangle} className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-yellow-400">Important!</p>
                <p className="text-sm text-white/80">Make sure the Payment ID is clearly visible in your screenshot. This is required for verification.</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Upload Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/10 backdrop-blur-md rounded-2xl p-6"
        >
          <h3 className="text-xl font-bold mb-6">Upload Payment Screenshot</h3>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Payment ID Input */}
            <div>
              <label className="block text-sm font-medium mb-2">Payment ID *</label>
              <input
                type="text"
                value={paymentId}
                onChange={(e) => setPaymentId(e.target.value)}
                placeholder="Enter payment ID from your transaction"
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:border-white/40 text-white placeholder-white/50"
                required
              />
              <p className="text-xs text-white/50 mt-1">This ID must be visible in your screenshot</p>
            </div>

            {/* File Upload */}
            <div>
              <label className="block text-sm font-medium mb-2">Payment Screenshot *</label>
              <div className="border-2 border-dashed border-white/30 rounded-lg p-6 text-center hover:border-white/50 transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                  id="screenshot-upload"
                  required
                />
                <label htmlFor="screenshot-upload" className="cursor-pointer">
                  {previewUrl ? (
                    <div className="space-y-4">
                      <img src={previewUrl} alt="Screenshot preview" className="max-w-full max-h-64 mx-auto rounded-lg" />
                      <p className="text-sm text-white/60">Click to change image</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <FontAwesomeIcon icon={faUpload} className="w-12 h-12 text-white/50" />
                      <div>
                        <p className="text-lg font-medium">Click to upload screenshot</p>
                        <p className="text-sm text-white/50">JPG, PNG, GIF, BMP, WEBP up to 10MB</p>
                      </div>
                    </div>
                  )}
                </label>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-lg">
                <p className="text-red-400">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={isLoading}
              className="w-full py-4 px-6 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <FontAwesomeIcon icon={faCheck} className="w-5 h-5" />
                  <span>Submit Deposit Confirmation</span>
                </>
              )}
            </motion.button>
          </form>
        </motion.div>
      </div>

      {/* Success Modal */}
      {showSuccess && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-green-600 text-white p-6 rounded-2xl max-w-md mx-4"
          >
            <div className="flex items-center space-x-3">
              <FontAwesomeIcon icon={faCheck} className="w-8 h-8" />
              <div>
                <h3 className="text-lg font-bold">Deposit Submitted!</h3>
                <p>Your deposit confirmation has been received. You will be redirected to your wallet shortly.</p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  )
}
