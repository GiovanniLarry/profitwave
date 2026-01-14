import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faWallet, faArrowDown, faArrowUp, faHistory, faCreditCard, faBank, faMobileAlt, faCheck } from '@fortawesome/free-solid-svg-icons'
import Link from 'next/link'
import { getAuth } from 'firebase/auth'
import { initializeApp, getApps } from 'firebase/app'
import { Home, TrendingUp, User, ArrowLeft, Check, ArrowUp } from 'lucide-react'
import CustomerChat from '../components/CustomerChat'

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

interface Transaction {
  id: string
  type: 'deposit' | 'withdrawal'
  amount: number
  status: 'pending' | 'completed' | 'failed'
  method: string
  timestamp: Date
  description: string
}

export default function Wallet() {
  const [user, setUser] = useState<any>(null)
  const [balance, setBalance] = useState(0)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [depositHistory, setDepositHistory] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState<'deposit' | 'withdrawal'>('deposit')
  const [amount, setAmount] = useState('')
  const [selectedMethod, setSelectedMethod] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false)
  const [withdrawalForm, setWithdrawalForm] = useState({
    phoneNumber: '',
    provider: 'orange', // 'orange' or 'mtn'
    accountName: ''
  })
  const [withdrawalConfirmed, setWithdrawalConfirmed] = useState(false)

  useEffect(() => {
    const checkAuth = async () => {
      const auth = getAuth()
      
      // First check Firebase auth
      const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
        if (firebaseUser) {
          setUser(firebaseUser)
          fetchUserData()
        } else {
          // Fallback 1: Check localStorage session
          const localSession = localStorage.getItem('userSession')
          if (localSession) {
            try {
              const sessionData = JSON.parse(localSession)
              // Check if session is not too old (24 hours)
              if (Date.now() - sessionData.timestamp < 24 * 60 * 60 * 1000) {
                setUser({ email: sessionData.user.email, uid: sessionData.user.firebaseUid })
                fetchUserData()
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
                fetchUserData()
                return
              }
            }
          } catch (error) {
            console.error('Session check failed:', error)
          }
          
          // No authentication found, redirect to login
          window.location.href = '/get-started'
        }
      })

      return unsubscribe
    }
    
    checkAuth()
    
    // Add more frequent balance checking for admin deposits
    const balanceInterval = setInterval(() => {
      if (user) {
        fetchUserData()
      }
    }, 3000)
    
    return () => {
      clearInterval(balanceInterval)
    }
  }, [user])

  const fetchDepositHistory = async () => {
    try {
      const auth = getAuth()
      const user = auth.currentUser
      if (!user) return
      
      const response = await fetch(`/api/user/deposits?userId=${user.uid}`)
      if (response.ok) {
        const data = await response.json()
        setDepositHistory(data.deposits || [])
      }
    } catch (error) {
      console.error('Error fetching deposit history:', error)
    }
  }

  const fetchUserData = async () => {
    try {
      const auth = getAuth()
      const user = auth.currentUser
      if (!user) {
        console.log('No current user found')
        return
      }

      console.log('Current user UID:', user.uid)
      console.log('Current user email:', user.email)

      const token = await user.getIdToken()
      console.log('Got token, fetching direct balance...')
      
      // Use direct balance endpoint like dashboard
      const response = await fetch('/api/user/direct-balance', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      console.log('Direct balance API response status:', response.status)

      if (response.ok) {
        const data = await response.json()
        console.log('Direct balance API response data:', data)
        
        if (data.success) {
          const newBalance = data.balance || 0
          console.log('Setting user balance to:', newBalance)
          setBalance(newBalance)
          console.log('Direct balance set successfully:', newBalance)
        } else {
          console.error('Direct balance failed:', data.error)
          setBalance(0)
        }
      } else {
        console.error('Failed to fetch direct balance:', response.statusText)
        const errorText = await response.text()
        console.error('Error response:', errorText)
        setBalance(0)
      }
      
      // Also fetch deposit history
      fetchDepositHistory()
    } catch (error) {
      console.error('Wallet fetchUserData error:', error)
      setBalance(0)
    }
  }

  const handleTransaction = async () => {
    if (!amount || !selectedMethod) {
      alert('Please fill in all fields')
      return
    }

    // For deposits, redirect to confirmation page
    if (activeTab === 'deposit') {
      const depositAmount = parseFloat(amount)
      if (depositAmount < 6500) {
        alert('Minimum deposit amount is XAF 6,500')
        return
      }
      
      // Store deposit data in localStorage for the confirmation page
      const methodData = {
        'orange-money': {
          name: 'Orange Money',
          merchantName: 'MONIQUE NADEGE MECK',
          merchantNumber: '655621356'
        },
        'mtn-mobile-money': {
          name: 'MTN Mobile Money',
          merchantName: 'DELPHINE NONINDONG',
          merchantNumber: '674281162'
        }
      }
      
      const depositData = {
        amount: depositAmount,
        method: methodData[selectedMethod as keyof typeof methodData].name,
        merchantName: methodData[selectedMethod as keyof typeof methodData].merchantName,
        merchantNumber: methodData[selectedMethod as keyof typeof methodData].merchantNumber
      }
      
      localStorage.setItem('pendingDeposit', JSON.stringify(depositData))
      
      // Redirect to deposit confirmation page
      window.location.href = `/deposit-confirmation?amount=${depositAmount}&method=${selectedMethod}`
      return
    }

    // For withdrawals, validate minimum amount and show modal
    if (activeTab === 'withdrawal') {
      const withdrawalAmount = parseFloat(amount)
      if (withdrawalAmount < 9500) {
        alert('Minimum withdrawal amount is XAF 9,500')
        return
      }
      
      if (withdrawalAmount > balance) {
        alert('Insufficient balance')
        return
      }

      // Show withdrawal modal
      setShowWithdrawalModal(true)
      return
    }
  }

  
  const paymentMethods = [
    { id: 'orange-money', name: 'Orange Money', icon: faMobileAlt, image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c8/Orange_logo.svg/1200px-Orange_logo.svg.png' },
    { id: 'mtn-mobile-money', name: 'MTN Mobile Money', icon: faMobileAlt, image: '/mtn.jpg' }
  ]

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-2xl">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white p-4">
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-8">
        <div className="flex items-center justify-between mb-6">
          <Link href="/dashboard">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </motion.button>
          </Link>
          <h1 className="text-3xl font-bold">Wallet</h1>
          <div className="w-10" />
        </div>

        {/* Balance Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-6 mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/80 mb-2">Account Balance</p>
              <h2 className="text-4xl font-bold">XAF {balance.toLocaleString()}</h2>
            </div>
            <FontAwesomeIcon icon={faWallet} className="w-12 h-12 text-white/50" />
          </div>
        </motion.div>
      </div>

      {/* Transaction Tabs */}
      <div className="max-w-6xl mx-auto">
        <div className="flex space-x-4 mb-6">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setActiveTab('deposit')}
            className={`flex-1 py-3 px-6 rounded-lg font-semibold transition-colors ${
              activeTab === 'deposit'
                ? 'bg-green-600 text-white'
                : 'bg-white/10 text-white/70 hover:bg-white/20'
            }`}
          >
            <FontAwesomeIcon icon={faArrowDown} className="mr-2" />
            Deposit
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setActiveTab('withdrawal')}
            className={`flex-1 py-3 px-6 rounded-lg font-semibold transition-colors ${
              activeTab === 'withdrawal'
                ? 'bg-red-600 text-white'
                : 'bg-white/10 text-white/70 hover:bg-white/20'
            }`}
          >
            <FontAwesomeIcon icon={faArrowUp} className="mr-2" />
            Withdraw
          </motion.button>
        </div>

        {/* Transaction Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/10 backdrop-blur-md rounded-2xl p-6 mb-8"
        >
          <div className="space-y-6">
            {/* Amount Input */}
            <div>
              <label className="block text-sm font-medium mb-2">Amount (XAF)</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount"
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:border-white/40 text-white placeholder-white/50"
              />
            </div>

            {/* Payment Methods */}
            <div>
              <label className="block text-sm font-medium mb-2">Payment Method</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {paymentMethods.map((method) => (
                  <motion.button
                    key={method.id}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedMethod(method.id)}
                    className={`p-6 rounded-lg border-2 transition-colors ${
                      selectedMethod === method.id
                        ? 'border-blue-500 bg-blue-500/20'
                        : 'border-white/20 bg-white/5 hover:bg-white/10'
                    }`}
                  >
                    <img 
                      src={method.image} 
                      alt={method.name}
                      className="w-24 h-12 mx-auto mb-3 object-contain"
                    />
                    <p className="text-base font-medium mb-2">{method.name}</p>
                    
                    {/* Contact Information */}
                    <div className="text-xs text-white/70 space-y-1">
                      {method.id === 'orange-money' && (
                        <>
                          <p><span className="font-semibold">Contact:</span> MONIQUE NADEGE MECK</p>
                          <p><span className="font-semibold">Phone:</span> 655621356</p>
                        </>
                      )}
                      {method.id === 'mtn-mobile-money' && (
                        <>
                          <p><span className="font-semibold">Contact:</span> DELPHINE NONINDONG</p>
                          <p><span className="font-semibold">Phone:</span> 674281162</p>
                        </>
                      )}
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Submit Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleTransaction}
              disabled={isLoading}
              className="w-full py-3 px-6 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Processing...' : `${activeTab === 'deposit' ? 'Request Deposit' : 'Withdraw'} XAF ${amount || '0'}`}
            </motion.button>
          </div>
        </motion.div>

        {/* Transaction History */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/10 backdrop-blur-md rounded-2xl p-6"
        >
          <h3 className="text-xl font-bold mb-4 flex items-center">
            <FontAwesomeIcon icon={faHistory} className="mr-2" />
            Transaction History
          </h3>
          <div className="space-y-3">
            {transactions.length === 0 && depositHistory.length === 0 ? (
              <p className="text-white/50 text-center py-8">No transactions yet</p>
            ) : (
              <>
                {/* Show deposit history first */}
                {depositHistory.map((deposit) => (
                  <div
                    key={deposit.id}
                    className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-green-500/20"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="p-2 rounded-lg bg-green-500/20">
                        <ArrowUp className="w-4 h-4 text-green-400" />
                      </div>
                      <div>
                        <p className="font-semibold text-white">{deposit.description}</p>
                        <p className="text-sm text-white/50">{deposit.method} • {new Date(deposit.date).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-400">
                        + XAF {deposit.amount.toLocaleString()}
                      </p>
                      <p className="text-sm text-white/50 capitalize">{deposit.status}</p>
                    </div>
                  </div>
                ))}
                
                {/* Show regular transactions */}
                {transactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-4 bg-white/5 rounded-lg"
                  >
                    <div className="flex items-center space-x-4">
                      <div className={`p-2 rounded-lg ${
                        transaction.type === 'deposit' ? 'bg-green-500/20' : 'bg-red-500/20'
                      }`}>
                        <FontAwesomeIcon
                          icon={transaction.type === 'deposit' ? faArrowDown : faArrowUp}
                          className={`w-4 h-4 ${
                            transaction.type === 'deposit' ? 'text-green-400' : 'text-red-400'
                          }`}
                        />
                      </div>
                      <div>
                        <p className="font-semibold">{transaction.description}</p>
                        <p className="text-sm text-white/50">{transaction.method}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold ${
                        transaction.type === 'deposit' ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {transaction.type === 'deposit' ? '+' : '-'} XAF {transaction.amount.toLocaleString()}
                      </p>
                      <p className="text-sm text-white/50">
                        {new Date(transaction.timestamp).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
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
            className="bg-green-600 text-white p-6 rounded-2xl max-w-sm mx-4"
          >
            <div className="flex items-center space-x-3">
              <FontAwesomeIcon icon={faCheck} className="w-8 h-8" />
              <div>
                <h3 className="text-lg font-bold">Success!</h3>
                <p>Your {activeTab} has been processed.</p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}

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
                className="p-3 rounded-lg text-white/70 hover:text-white transition-colors"
              >
                <TrendingUp className="w-6 h-6" />
              </motion.button>
            </Link>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="p-3 rounded-lg bg-white/20 text-white"
            >
              <FontAwesomeIcon icon={faWallet} className="w-6 h-6" />
            </motion.button>
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
      
      
      {/* Withdrawal Modal */}
      {showWithdrawalModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-br from-purple-900 to-blue-900 rounded-2xl p-6 w-full max-w-md border border-white/20"
          >
            {!withdrawalConfirmed ? (
              <>
                <h3 className="text-2xl font-bold mb-6 text-white">Withdrawal Details</h3>
                
                <div className="space-y-4">
                  <div className="bg-white/10 rounded-lg p-4">
                    <p className="text-sm text-white/70 mb-1">Withdrawal Amount</p>
                    <p className="text-2xl font-bold text-white">XAF {parseFloat(amount).toLocaleString()}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 text-white">Phone Number</label>
                    <input
                      type="tel"
                      value={withdrawalForm.phoneNumber}
                      onChange={(e) => setWithdrawalForm(prev => ({ ...prev, phoneNumber: e.target.value }))}
                      placeholder="Enter phone number"
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:border-white/40 text-white placeholder-white/50"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 text-white">Mobile Provider</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => setWithdrawalForm(prev => ({ ...prev, provider: 'orange' }))}
                        className={`p-3 rounded-lg border-2 transition-colors ${
                          withdrawalForm.provider === 'orange'
                            ? 'border-orange-500 bg-orange-500/20'
                            : 'border-white/20 bg-white/5 hover:bg-white/10'
                        }`}
                      >
                        <div className="text-orange-400 font-medium">Orange</div>
                      </button>
                      <button
                        onClick={() => setWithdrawalForm(prev => ({ ...prev, provider: 'mtn' }))}
                        className={`p-3 rounded-lg border-2 transition-colors ${
                          withdrawalForm.provider === 'mtn'
                            ? 'border-yellow-500 bg-yellow-500/20'
                            : 'border-white/20 bg-white/5 hover:bg-white/10'
                        }`}
                      >
                        <div className="text-yellow-400 font-medium">MTN</div>
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 text-white">Account Name</label>
                    <input
                      type="text"
                      value={withdrawalForm.accountName}
                      onChange={(e) => setWithdrawalForm(prev => ({ ...prev, accountName: e.target.value }))}
                      placeholder="Enter account holder name"
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:border-white/40 text-white placeholder-white/50"
                    />
                  </div>
                </div>

                <div className="flex space-x-3 mt-6">
                  <button
                    onClick={() => setShowWithdrawalModal(false)}
                    className="flex-1 py-3 px-4 bg-white/10 hover:bg-white/20 rounded-lg font-medium text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={async () => {
                      if (!withdrawalForm.phoneNumber || !withdrawalForm.accountName) {
                        alert('Please fill in all fields')
                        return
                      }

                      setIsLoading(true)
                      try {
                        const auth = getAuth()
                        const token = await auth.currentUser?.getIdToken()
                        
                        const response = await fetch('/api/withdrawal/request', {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                          },
                          body: JSON.stringify({
                            amount: parseFloat(amount),
                            phoneNumber: withdrawalForm.phoneNumber,
                            provider: withdrawalForm.provider,
                            accountName: withdrawalForm.accountName,
                            method: selectedMethod
                          })
                        })

                        if (response.ok) {
                          setWithdrawalConfirmed(true)
                        } else {
                          const errorData = await response.json()
                          alert(errorData.error || 'Withdrawal request failed')
                        }
                      } catch (error) {
                        console.error('Withdrawal error:', error)
                        alert('Withdrawal request failed. Please try again.')
                      } finally {
                        setIsLoading(false)
                      }
                    }}
                    className="flex-1 py-3 px-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 rounded-lg font-medium text-white transition-colors disabled:opacity-50"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Processing...' : 'Confirm Withdrawal'}
                  </button>
                </div>
              </>
            ) : (
              <div className="text-center">
                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="w-8 h-8 text-green-400" />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-white">Withdrawal Submitted</h3>
                <p className="text-white/80 mb-6">
                  Your withdrawal of <span className="font-bold text-white">XAF {parseFloat(amount).toLocaleString()}</span> has been submitted successfully.
                </p>
                <p className="text-white/70 text-sm mb-6">
                  Processing time: <span className="font-medium">30 minutes - 1 hour</span>
                </p>
                <p className="text-white/60 text-sm mb-8">
                  You will receive the funds on your {withdrawalForm.provider === 'orange' ? 'Orange Money' : 'MTN Mobile Money'} account ending in {withdrawalForm.phoneNumber.slice(-4)}.
                </p>
                <button
                  onClick={() => {
                    setShowWithdrawalModal(false)
                    setWithdrawalConfirmed(false)
                    setWithdrawalForm({ phoneNumber: '', provider: 'orange', accountName: '' })
                    setAmount('')
                    setSelectedMethod('')
                    fetchUserData()
                  }}
                  className="w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 rounded-lg font-medium text-white transition-colors"
                >
                  Done
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}
      
      {/* Customer Chat Component */}
      <CustomerChat />
    </div>
  )
}
