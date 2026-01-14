import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faWallet, faArrowLeft } from '@fortawesome/free-solid-svg-icons'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { getAuth } from 'firebase/auth'
import { initializeApp, getApps } from 'firebase/app'
import { Home, TrendingUp, User, ArrowLeft as ArrowLeftIcon, Check, AlertCircle } from 'lucide-react'

// Initialize Firebase
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

interface InvestmentPlan {
  id: string
  name: string
  minAmount: number
  maxAmount: number
  returnAmount: number
  period: number
  dailyReturn: number
  image: string
  risk: 'low' | 'medium' | 'high'
  description: string
  features: string[]
}

const InvestmentAmountPage = () => {
  const router = useRouter()
  const { planId } = router.query
  const [user, setUser] = useState<any>(null)
  const [userData, setUserData] = useState<any>(null)
  const [plan, setPlan] = useState<InvestmentPlan | null>(null)
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  // Base investment plans
  const baseInvestmentPlans: InvestmentPlan[] = [
    {
      id: 'special-6500',
      name: 'Premium Investment Plan',
      minAmount: 6500,
      maxAmount: 6500,
      returnAmount: 9750,
      period: 28,
      dailyReturn: 116,
      image: 'https://images.unsplash.com/photo-1633412802994-5c843bb244d6?w=1200&h=800&fit=crop&crop=center&auto=format&q=100',
      risk: 'low',
      description: 'Exclusive premium investment with guaranteed tiered returns',
      features: ['25% return in first 14 days', '50% + principal after 28 days', 'Zero risk', 'Instant withdrawal', 'Premium support', 'Insurance backed']
    },
    {
      id: 'plan-10000',
      name: 'Bronze Investment Plan',
      minAmount: 10000,
      maxAmount: 10000,
      returnAmount: 15000,
      period: 28,
      dailyReturn: 179,
      image: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=1200&h=800&fit=crop&crop=center&auto=format&q=100',
      risk: 'low',
      description: 'Bronze tier investment with solid returns (~15 EUR)',
      features: ['25% return in first 14 days', '50% + principal after 28 days', 'Low risk', 'Quick withdrawal', 'Bronze status', 'Great value']
    },
    {
      id: 'plan-13000',
      name: 'Silver Investment Plan',
      minAmount: 13000,
      maxAmount: 13000,
      returnAmount: 19500,
      period: 28,
      dailyReturn: 232,
      image: 'https://images.unsplash.com/photo-1621974789855-9c2a0a7236a3?w=1200&h=800&fit=crop&crop=center&auto=format&q=100',
      risk: 'medium',
      description: 'Silver tier investment with enhanced returns (~19 EUR)',
      features: ['25% return in first 14 days', '50% + principal after 28 days', 'Medium risk', 'Fast withdrawal', 'Silver status', 'Better returns']
    },
    {
      id: 'plan-25000',
      name: 'Gold Investment Plan',
      minAmount: 25000,
      maxAmount: 25000,
      returnAmount: 37500,
      period: 28,
      dailyReturn: 446,
      image: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=1200&h=800&fit=crop&crop=center&auto=format&q=100',
      risk: 'medium',
      description: 'Gold tier investment with premium returns (~38 EUR)',
      features: ['25% return in first 14 days', '50% + principal after 28 days', 'Medium risk', 'Priority withdrawal', 'Gold status', 'High returns']
    },
    {
      id: 'plan-50000',
      name: 'Platinum Investment Plan',
      minAmount: 50000,
      maxAmount: 50000,
      returnAmount: 75000,
      period: 28,
      dailyReturn: 893,
      image: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=1200&h=800&fit=crop&crop=center&auto=format&q=100',
      risk: 'high',
      description: 'Platinum tier investment with maximum returns (~75 EUR)',
      features: ['25% return in first 14 days', '50% + principal after 28 days', 'High risk', 'Instant withdrawal', 'Platinum status', 'Maximum returns']
    },
    {
      id: 'plan-100000',
      name: 'Diamond Investment Plan',
      minAmount: 100000,
      maxAmount: 100000,
      returnAmount: 150000,
      period: 28,
      dailyReturn: 1786,
      image: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=1200&h=800&fit=crop&crop=center&auto=format&q=100',
      risk: 'high',
      description: 'Diamond tier investment for elite investors (~150 EUR)',
      features: ['25% return in first 14 days', '50% + principal after 28 days', 'High risk', 'VIP withdrawal', 'Diamond status', 'Elite returns']
    }
  ]

  useEffect(() => {
    const auth = getAuth()
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      if (currentUser) {
        setUser(currentUser)
        fetchUserData(currentUser)
      } else {
        // Redirect to login if not authenticated
        window.location.href = '/get-started'
      }
    })

    return () => unsubscribe()
  }, [])

  useEffect(() => {
    if (planId) {
      const foundPlan = baseInvestmentPlans.find(p => p.id === planId)
      setPlan(foundPlan || null)
      setLoading(false)
    }
  }, [planId])

  const fetchUserData = async (currentUser: any) => {
    try {
      const token = await currentUser.getIdToken()
      const response = await fetch('/api/user/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setUserData(data)
      }
    } catch (error) {
      console.error('Error fetching user data:', error)
    }
  }

  const handleInvest = async () => {
    if (!plan || !amount) {
      setError('Please enter an investment amount')
      return
    }

    const investmentAmount = parseFloat(amount)
    if (isNaN(investmentAmount) || investmentAmount < plan.minAmount || investmentAmount > plan.maxAmount) {
      setError(`Amount must be between ${plan.minAmount.toLocaleString()} and ${plan.maxAmount.toLocaleString()} XAF`)
      return
    }

    // Check user balance
    if (userData && userData.balance < investmentAmount) {
      setError('Insufficient balance. Please deposit funds to your wallet first.')
      return
    }

    setProcessing(true)
    setError('')

    try {
      const auth = getAuth()
      const token = await auth.currentUser?.getIdToken()
      
      const response = await fetch('/api/investments/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          userId: user.uid,
          planId: plan.id,
          amount: investmentAmount,
          planName: plan.name,
          returnAmount: plan.returnAmount,
          period: plan.period,
          dailyReturn: plan.dailyReturn
        })
      })

      if (response.ok) {
        setSuccess(true)
        // Update user data to reflect new balance
        fetchUserData(user)
        // Trigger dashboard refresh by setting localStorage event
        localStorage.setItem('investmentUpdated', Date.now().toString())
        window.dispatchEvent(new Event('investmentUpdated'))
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Investment failed')
      }
    } catch (error) {
      console.error('Investment error:', error)
      setError('Investment failed. Please try again.')
    } finally {
      setProcessing(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-black text-white flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    )
  }

  if (!plan) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-black text-white flex items-center justify-center">
        <div className="text-xl">Investment plan not found</div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-black text-white flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-r from-green-600 to-green-700 p-8 rounded-2xl max-w-md mx-4 text-center"
        >
          <Check className="w-16 h-16 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Investment Successful!</h2>
          <p className="mb-6">Your investment of {parseFloat(amount).toLocaleString()} XAF has been processed successfully.</p>
          <Link href="/dashboard">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-white text-green-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              Go to Dashboard
            </motion.button>
          </Link>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-black text-white p-4">
      {/* Header */}
      <div className="max-w-4xl mx-auto mb-8">
        <div className="flex items-center justify-between mb-6">
          <Link href="/invest">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
            >
              <ArrowLeftIcon className="w-5 h-5" />
            </motion.button>
          </Link>
          <h1 className="text-3xl font-bold">Investment Details</h1>
          <div className="w-10" />
        </div>

        {/* Plan Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-2xl p-6 mb-8"
        >
          <div className="flex flex-col md:flex-row gap-6">
            <div className="md:w-1/3">
              <img 
                src={plan.image} 
                alt={plan.name}
                className="w-full h-48 object-cover rounded-lg"
              />
            </div>
            <div className="md:w-2/3">
              <h2 className="text-2xl font-bold mb-2">{plan.name}</h2>
              <p className="text-gray-300 mb-4">{plan.description}</p>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm text-gray-400">Investment Period</p>
                  <p className="font-semibold">{plan.period} days</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Daily Return</p>
                  <p className="font-semibold">{plan.dailyReturn.toLocaleString()} XAF</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Total Return</p>
                  <p className="font-semibold text-green-400">{plan.returnAmount.toLocaleString()} XAF</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Risk Level</p>
                  <p className="font-semibold capitalize">{plan.risk}</p>
                </div>
              </div>
              <div className="space-y-2">
                {plan.features.map((feature, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <Check className="w-4 h-4 text-green-400" />
                    <span className="text-sm">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Investment Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass rounded-2xl p-6 mb-8"
        >
          <h3 className="text-xl font-bold mb-6">Enter Investment Amount</h3>
          
          {/* User Balance Display */}
          {userData && (
            <div className="bg-white/5 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Available Balance</p>
                  <p className="text-2xl font-bold">{userData.balance?.toLocaleString() || 0} XAF</p>
                </div>
                <FontAwesomeIcon icon={faWallet} className="w-8 h-8 text-purple-400" />
              </div>
            </div>
          )}

          {/* Amount Input */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Investment Amount (XAF)</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={`Enter amount between ${plan.minAmount.toLocaleString()} and ${plan.maxAmount.toLocaleString()}`}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:border-purple-400 text-white placeholder-white/50"
              min={plan.minAmount}
              max={plan.maxAmount}
            />
            <p className="text-sm text-gray-400 mt-2">
              Minimum: {plan.minAmount.toLocaleString()} XAF | Maximum: {plan.maxAmount.toLocaleString()} XAF
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-500/20 border border-red-500/30 rounded-lg p-4 mb-6 flex items-center space-x-3"
            >
              <AlertCircle className="w-5 h-5 text-red-400" />
              <p className="text-red-400">{error}</p>
            </motion.div>
          )}

          {/* Investment Summary */}
          {amount && !isNaN(parseFloat(amount)) && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/5 rounded-lg p-4 mb-6"
            >
              <h4 className="font-semibold mb-3">Investment Summary</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-400">Investment Amount:</span>
                  <span>{parseFloat(amount).toLocaleString()} XAF</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Expected Return:</span>
                  <span className="text-green-400">{plan.returnAmount.toLocaleString()} XAF</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Daily Profit:</span>
                  <span>{plan.dailyReturn.toLocaleString()} XAF</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Duration:</span>
                  <span>{plan.period} days</span>
                </div>
              </div>
            </motion.div>
          )}

          {/* Invest Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleInvest}
            disabled={processing || !amount}
            className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg font-semibold text-white hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {processing ? 'Processing Investment...' : 'Start Investing'}
          </motion.button>
        </motion.div>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-black/80 backdrop-blur-md border-t border-white/10">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex justify-around py-2">
            <Link href="/dashboard">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="p-3 rounded-lg text-white/70 hover:text-white transition-colors"
              >
                <Home className="w-6 h-6" />
              </motion.button>
            </Link>
            <Link href="/invest">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="p-3 rounded-lg text-purple-400"
              >
                <TrendingUp className="w-6 h-6" />
              </motion.button>
            </Link>
            <Link href="/wallet">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="p-3 rounded-lg text-white/70 hover:text-white transition-colors"
              >
                <FontAwesomeIcon icon={faWallet} className="w-6 h-6" />
              </motion.button>
            </Link>
            <Link href="/account">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="p-3 rounded-lg text-white/70 hover:text-white transition-colors"
              >
                <User className="w-6 h-6" />
              </motion.button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default InvestmentAmountPage
