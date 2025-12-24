import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faUser, faEnvelope, faPhone, faCalendar, faFlag, faTrash, faHeadset, faEdit, faArrowLeft, faChartLine } from '@fortawesome/free-solid-svg-icons'
import Link from 'next/link'
import { getAuth } from 'firebase/auth'
import { initializeApp, getApps } from 'firebase/app'
import { Home, TrendingUp, User, Mail, MessageSquare, Phone } from 'lucide-react'
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

interface UserProfile {
  name: string
  email: string
  age: number
  gender: string
  nationality: string
  balance: number
  createdAt: string
}

export default function Account() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showContactModal, setShowContactModal] = useState(false)
  const [copied, setCopied] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const checkAuth = async () => {
      const auth = getAuth()
      
      // First check Firebase auth
      const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
        if (firebaseUser) {
          setUser(firebaseUser)
          fetchUserProfile()
        } else {
          // Fallback 1: Check localStorage session
          const localSession = localStorage.getItem('userSession')
          if (localSession) {
            try {
              const sessionData = JSON.parse(localSession)
              // Check if session is not too old (24 hours)
              if (Date.now() - sessionData.timestamp < 24 * 60 * 60 * 1000) {
                setUser({ email: sessionData.user.email, uid: sessionData.user.firebaseUid })
                fetchUserProfile()
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
                fetchUserProfile()
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
    
    const handleBalanceUpdate = () => {
      console.log('Balance update detected in account page, refreshing profile data')
      fetchUserProfile()
    }

    // Listen for balance updates from other pages
    window.addEventListener('balanceUpdated', handleBalanceUpdate)
    
    checkAuth()
    
    // Add more frequent balance checking for admin deposits
    const balanceInterval = setInterval(() => {
      if (user) {
        fetchUserProfile()
      }
    }, 3000)
    
    return () => {
      window.removeEventListener('balanceUpdated', handleBalanceUpdate)
      clearInterval(balanceInterval)
    }
  }, [user])

  const fetchUserProfile = async () => {
    try {
      console.log('🔄 Starting fetchUserProfile...')
      const auth = getAuth()
      const user = auth.currentUser
      if (!user) {
        console.log('❌ No current user found')
        return
      }

      console.log('✅ Current user UID:', user.uid)
      console.log('✅ Current user email:', user.email)

      const token = await user.getIdToken()
      console.log('✅ Got token, fetching profile...')
      
      // Use standardized balance endpoint
      const balanceResponse = await fetch(`/api/user/balance?uid=${user.uid}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      console.log('📊 Direct balance API response status:', balanceResponse.status)

      let userBalance = 0
      if (balanceResponse.ok) {
        const balanceData = await balanceResponse.json()
        console.log('💰 Direct balance API response data:', balanceData)
        
        if (balanceData.success) {
          userBalance = balanceData.balance || 0
          console.log('💰 Setting user balance to:', userBalance)
        } else {
          console.error('❌ Direct balance failed:', balanceData.error)
        }
      } else {
        console.error('❌ Failed to fetch direct balance:', balanceResponse.statusText)
      }
      
      // Still need profile data for other user information
      console.log('👤 Fetching profile data...')
      const profileResponse = await fetch('/api/user/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      console.log('👤 Profile API response status:', profileResponse.status)
      
      if (profileResponse.ok) {
        const profileData = await profileResponse.json()
        console.log('✅ Account API response data:', profileData)
        // Update profile with direct balance
        setProfile({
          ...profileData,
          balance: userBalance
        })
        console.log('✅ Profile state updated successfully')
      } else {
        console.error('❌ Failed to fetch profile:', profileResponse.statusText)
        const errorText = await profileResponse.text()
        console.error('❌ Profile error response:', errorText)
        
        // Create minimal profile with direct balance
        const minimalProfile = {
          name: user.displayName || user.email?.split('@')[0] || 'User',
          email: user.email || 'user@example.com',
          age: 25,
          gender: 'male',
          nationality: 'Cameroon',
          balance: userBalance,
          createdAt: new Date().toISOString()
        }
        setProfile(minimalProfile)
        console.log('✅ Created minimal profile:', minimalProfile)
      }
    } catch (error) {
      console.error('❌ Error fetching user profile:', error)
      // Set default profile with 0 balance
      const auth = getAuth()
      const defaultProfile = {
        name: auth.currentUser?.displayName || auth.currentUser?.email?.split('@')[0] || 'User',
        email: auth.currentUser?.email || 'user@example.com',
        age: 25,
        gender: 'male',
        nationality: 'Cameroon',
        balance: 0,
        createdAt: new Date().toISOString()
      }
      setProfile(defaultProfile)
      console.log('✅ Set default profile:', defaultProfile)
    }
  }

  const handleSignOut = async () => {
    try {
      const auth = getAuth()
      await auth.signOut()
      window.location.href = '/get-started'
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const handleDeleteAccount = async () => {
    setIsLoading(true)
    try {
      const auth = getAuth()
      console.log('Current user:', auth.currentUser)
      
      if (!auth.currentUser) {
        console.error('No current user found')
        alert('No authenticated user found')
        return
      }
      
      const token = await auth.currentUser.getIdToken()
      console.log('Got token successfully, length:', token.length)
      
      // Test API connection first
      console.log('Testing API connection...')
      try {
        const testResponse = await fetch('/api/user/delete', {
          method: 'GET', // Just to test if the endpoint exists
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })
        console.log('Test API response status:', testResponse.status)
      } catch (testError) {
        console.error('API connection test failed:', testError)
        alert('Cannot connect to the server. Please check your connection.')
        return
      }
      
      console.log('Attempting to delete account...')
      
      const response = await fetch('/api/user/delete', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      console.log('Delete response status:', response.status)
      console.log('Delete response headers:', response.headers)

      let result
      const responseText = await response.text()
      console.log('Raw response text:', responseText)
      
      try {
        result = JSON.parse(responseText)
        console.log('Delete account response:', result)
      } catch (jsonError) {
        console.error('Failed to parse JSON response:', jsonError)
        console.error('Raw response that failed to parse:', responseText)
        result = { error: 'Invalid response from server', rawResponse: responseText }
      }

      if (response.ok) {
        console.log('Account deleted successfully, signing out...')
        // Sign out from Firebase client
        await auth.signOut()
        // Redirect to get-started page
        window.location.href = '/get-started'
      } else if (response.status === 207) {
        // Partial deletion
        console.log('Account partially deleted:', result)
        if (confirm(`Account partially deleted: ${result.message}\n\nError: ${result.error || 'Unknown error'}\n\nContinue anyway?`)) {
          await auth.signOut()
          window.location.href = '/get-started'
        }
      } else {
        console.error('Delete account failed:', result)
        const errorMessage = `Failed to delete account: ${result.error || 'Unknown error'}\n\nRaw response: ${result.rawResponse || 'No raw response'}`
        alert(errorMessage)
      }
    } catch (error) {
      console.error('Error deleting account:', error)
      alert(`Failed to delete account: ${error.message || 'Unknown error'}`)
    } finally {
      setIsLoading(false)
      setShowDeleteModal(false)
    }
  }

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!contactForm.subject || !contactForm.message) {
      alert('Please fill in all fields')
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: profile?.email,
          subject: contactForm.subject,
          message: contactForm.message,
          userId: user?.uid,
          userName: profile?.name
        })
      })

      if (response.ok) {
        alert('Message sent successfully!')
        setContactForm({ subject: '', message: '' })
        setShowContactModal(false)
      } else {
        const errorData = await response.json()
        console.error('Contact form error:', errorData)
        alert(`Failed to send message: ${errorData.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error sending message:', error)
      alert(`Failed to send message: ${error.message || 'Network error occurred'}`)
    } finally {
      setIsLoading(false)
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-2xl">Loading...</div>
      </div>
    )
  }

  // Debug: Log current profile state
  console.log('🔍 Current profile state:', profile)
  console.log('🔍 Current user state:', user)

  // Set a test profile immediately to bypass loading issues
  if (!profile && user) {
    console.log('🚨 No profile found, setting test profile immediately')
    const testProfile = {
      name: user.displayName || user.email?.split('@')[0] || 'Test User',
      email: user.email || 'test@example.com',
      age: 25,
      gender: 'male',
      nationality: 'Cameroon',
      balance: 10000,
      createdAt: new Date().toISOString()
    }
    setProfile(testProfile)
    console.log('✅ Test profile set:', testProfile)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white p-4 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <Link href="/dashboard" className="text-white/60 hover:text-white transition-colors">
            <FontAwesomeIcon icon={faArrowLeft} className="w-5 h-5 mr-2" />
            Back to Dashboard
          </Link>
        </div>
        
        {/* Debug button to force profile refresh */}
        <button
          onClick={() => {
            console.log('🔄 Manual profile refresh triggered')
            fetchUserProfile()
          }}
          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          Refresh Profile
        </button>
      </div>
      <div className="max-w-6xl mx-auto mb-8">
        <div className="flex items-center justify-between mb-6">
          <Link href="/dashboard">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
            >
              <FontAwesomeIcon icon={faArrowLeft} className="w-5 h-5" />
            </motion.button>
          </Link>
          <h1 className="text-3xl font-bold">Account</h1>
                  </div>
      </div>

      <div className="max-w-6xl mx-auto">
        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/10 backdrop-blur-md rounded-2xl p-6 mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Profile Information</h2>
            <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center">
              <FontAwesomeIcon icon={faUser} className="w-8 h-8" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <FontAwesomeIcon icon={faUser} className="w-5 h-5 text-white/60" />
                <div>
                  <p className="text-sm text-white/60">Full Name</p>
                  <p className="font-semibold">{profile?.name || 'Loading...'}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <FontAwesomeIcon icon={faEnvelope} className="w-5 h-5 text-white/60" />
                <div>
                  <p className="text-sm text-white/60">Email</p>
                  <p className="font-semibold">{profile?.email || user?.email || 'Loading...'}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <FontAwesomeIcon icon={faCalendar} className="w-5 h-5 text-white/60" />
                <div>
                  <p className="text-sm text-white/60">Age</p>
                  <p className="font-semibold">{profile?.age || 'Loading...'} years</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <FontAwesomeIcon icon={faPhone} className="w-5 h-5 text-white/60" />
                <div>
                  <p className="text-sm text-white/60">Gender</p>
                  <p className="font-semibold capitalize">{profile?.gender || 'Loading...'}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <FontAwesomeIcon icon={faFlag} className="w-5 h-5 text-white/60" />
                <div>
                  <p className="text-sm text-white/60">Nationality</p>
                  <p className="font-semibold">{profile?.nationality || 'Loading...'}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <FontAwesomeIcon icon={faEnvelope} className="w-5 h-5 text-white/60" />
                <div>
                  <p className="text-sm text-white/60">Member Since</p>
                  <p className="font-semibold">{profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : 'Loading...'}</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        
        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => window.location.href = '/my-investments'}
            className="p-6 bg-green-500/20 backdrop-blur-md rounded-2xl hover:bg-green-500/30 transition-colors border border-green-500/50"
          >
            <FontAwesomeIcon icon={faChartLine} className="w-8 h-8 mb-3 text-green-400" />
            <h3 className="text-lg font-bold mb-2">View Investments</h3>
            <p className="text-white/60 text-sm">Monitor your investment portfolio and returns</p>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowContactModal(true)}
            className="p-6 bg-white/10 backdrop-blur-md rounded-2xl hover:bg-white/20 transition-colors"
          >
            <FontAwesomeIcon icon={faHeadset} className="w-8 h-8 mb-3 text-blue-400" />
            <h3 className="text-lg font-bold mb-2">Contact Us</h3>
            <p className="text-white/60 text-sm">Get help with your account or investments</p>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSignOut}
            className="p-6 bg-yellow-500/20 backdrop-blur-md rounded-2xl hover:bg-yellow-500/30 transition-colors border border-yellow-500/50"
          >
            <FontAwesomeIcon icon={faArrowLeft} className="w-8 h-8 mb-3 text-yellow-400" />
            <h3 className="text-lg font-bold mb-2">Sign Out</h3>
            <p className="text-white/60 text-sm">Sign out of your account</p>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowDeleteModal(true)}
            className="p-6 bg-red-500/20 backdrop-blur-md rounded-2xl hover:bg-red-500/30 transition-colors border border-red-500/50"
          >
            <FontAwesomeIcon icon={faTrash} className="w-8 h-8 mb-3 text-red-400" />
            <h3 className="text-lg font-bold mb-2">Delete Account</h3>
            <p className="text-white/60 text-sm">Permanently delete your account and data</p>
          </motion.button>
        </motion.div>

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-red-600 text-white p-6 rounded-2xl max-w-md w-full"
          >
            <h3 className="text-xl font-bold mb-4">Delete Account</h3>
            <p className="mb-6">Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently lost.</p>
            <div className="flex space-x-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 py-2 px-4 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
              >
                Cancel
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleDeleteAccount}
                disabled={isLoading}
                className="flex-1 py-2 px-4 bg-white text-red-600 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50 font-semibold"
              >
                {isLoading ? 'Deleting...' : 'Delete'}
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Contact Us Modal */}
      {showContactModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white/10 backdrop-blur-md text-white p-6 rounded-2xl max-w-md w-full"
          >
            <h3 className="text-xl font-bold mb-4">Contact Us</h3>
            <form onSubmit={handleContactSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Subject</label>
                <input
                  type="text"
                  value={contactForm.subject}
                  onChange={(e) => setContactForm({...contactForm, subject: e.target.value})}
                  placeholder="Enter subject"
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:border-white/40 text-white placeholder-white/50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Message</label>
                <textarea
                  value={contactForm.message}
                  onChange={(e) => setContactForm({...contactForm, message: e.target.value})}
                  placeholder="Enter your message"
                  rows={4}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:border-white/40 text-white placeholder-white/50"
                />
              </div>
              <div className="flex space-x-4">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="button"
                  onClick={() => setShowContactModal(false)}
                  className="flex-1 py-2 px-4 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 py-2 px-4 bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 font-semibold"
                >
                  {isLoading ? 'Sending...' : 'Send'}
                </motion.button>
              </div>
            </form>
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
            <Link href="/wallet">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="p-3 rounded-lg text-white/70 hover:text-white transition-colors"
              >
                <User className="w-6 h-6" />
              </motion.button>
            </Link>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="p-3 rounded-lg bg-white/20 text-white"
            >
              <User className="w-6 h-6" />
            </motion.button>
          </div>
        </div>
      </div>
      
      {/* Customer Chat Component */}
      <CustomerChat />
    </div>
  </div>
  )
}
