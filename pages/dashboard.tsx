import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Menu, X, TrendingUp, TrendingDown, DollarSign, 
  Briefcase, MessageCircle, ArrowUpRight, ArrowDownRight, 
  BarChart3, Activity, PieChart, CreditCard, Shield, 
  Bell, Settings, LogOut, Eye, EyeOff, RefreshCw, Home, Newspaper, Clock, TrendingUp as InvestIcon, User
} from 'lucide-react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faWallet } from '@fortawesome/free-solid-svg-icons'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { getAuth } from 'firebase/auth'
import { initializeApp } from 'firebase/app'
import CustomerChat from '../components/CustomerChat'
import dashboardStyles from '../components/Dashboard.module.css'

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

let app
try {
  app = initializeApp(firebaseConfig)
} catch (error) {
  console.log('Firebase app already initialized')
}

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [userData, setUserData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [unreadCount, setUnreadCount] = useState(0)
  const [userBalance, setUserBalance] = useState(0)
  const [showBalance, setShowBalance] = useState(true)
  const [depositHistory, setDepositHistory] = useState<any[]>([])
  const [referralData, setReferralData] = useState({
    referralCode: '',
    referralLink: '',
    totalReferrals: 0,
    totalEarnings: 0
  })
  const [copied, setCopied] = useState(false)
  const [referralLoading, setReferralLoading] = useState(true)
  // Remove mock referral code - use only real referral code from API
  const [showReferralModal, setShowReferralModal] = useState(false)
  const [investmentStats, setInvestmentStats] = useState({
    totalInvested: 0,
    monthlyReturns: 0,
    dailyReturns: 0,
    activeProjects: 0,
    totalReturns: 0
  })
  // Unique color schemes for each cryptocurrency
  const cryptoColors = {
    BTC: { bg: 'from-orange-500/20 to-orange-600/20', border: 'border-orange-500/30', accent: 'text-orange-400' },
    ETH: { bg: 'from-blue-500/20 to-purple-600/20', border: 'border-blue-500/30', accent: 'text-blue-400' },
    BNB: { bg: 'from-yellow-500/20 to-amber-600/20', border: 'border-yellow-500/30', accent: 'text-yellow-400' },
    SOL: { bg: 'from-purple-500/20 to-pink-600/20', border: 'border-purple-500/30', accent: 'text-purple-400' },
    ADA: { bg: 'from-blue-500/20 to-cyan-600/20', border: 'border-blue-500/30', accent: 'text-blue-300' },
    DOT: { bg: 'from-pink-500/20 to-rose-600/20', border: 'border-pink-500/30', accent: 'text-pink-400' }
  }
  const [cryptoData, setCryptoData] = useState([
    { symbol: 'BTC', name: 'Bitcoin', price: 43250.00, change: 2.34, trend: 'up', volume: '28.5B', marketCap: '845.2B', recommendation: 'Strong Buy', sparkline: [42500, 42800, 42650, 42900, 43000, 43250], logo: 'https://cryptologos.cc/logos/bitcoin-btc-logo.png' },
    { symbol: 'ETH', name: 'Ethereum', price: 2280.50, change: -1.23, trend: 'down', volume: '15.2B', marketCap: '274.1B', recommendation: 'Buy', sparkline: [2300, 2290, 2285, 2270, 2285, 2280.50], logo: 'https://cryptologos.cc/logos/ethereum-eth-logo.png' },
    { symbol: 'BNB', name: 'Binance Coin', price: 315.75, change: 3.45, trend: 'up', volume: '1.8B', marketCap: '48.2B', recommendation: 'Buy', sparkline: [310, 312, 311, 313, 314, 315.75], logo: 'https://cryptologos.cc/logos/bnb-bnb-logo.png' },
    { symbol: 'SOL', name: 'Solana', price: 98.20, change: 5.67, trend: 'up', volume: '2.1B', marketCap: '42.1B', recommendation: 'Strong Buy', sparkline: [92, 94, 93, 95, 96, 98.20], logo: 'https://cryptologos.cc/logos/solana-sol-logo.png' },
    { symbol: 'ADA', name: 'Cardano', price: 0.58, change: 1.89, trend: 'up', volume: '0.8B', marketCap: '20.4B', recommendation: 'Hold', sparkline: [0.56, 0.57, 0.56, 0.57, 0.57, 0.58], logo: 'https://cryptologos.cc/logos/cardano-ada-logo.png' },
    { symbol: 'DOT', name: 'Polkadot', price: 7.85, change: -2.15, trend: 'down', volume: '0.4B', marketCap: '9.8B', recommendation: 'Hold', sparkline: [8.0, 7.9, 7.8, 7.7, 7.8, 7.85], logo: 'https://cryptologos.cc/logos/polkadot-new-dot-logo.png' }
  ])
  const [news, setNews] = useState([
    {
      title: 'Bitcoin Reaches New Monthly High Amid Institutional Interest',
      source: 'CryptoNews',
      time: '2 hours ago',
      summary: 'Bitcoin surged past $43,000 as major institutions announce increased crypto allocations...',
      category: 'Bitcoin',
      sentiment: 'positive',
      impact: 'high'
    },
    {
      title: 'Ethereum 2.0 Staking Hits Record Levels',
      source: 'DeFi Daily',
      time: '4 hours ago',
      summary: 'Ethereum staking participation reaches all-time high as network upgrade approaches...',
      category: 'Ethereum',
      sentiment: 'positive',
      impact: 'medium'
    },
    {
      title: 'Central Bank Digital Currencies Gain Global Momentum',
      source: 'Finance Today',
      time: '6 hours ago',
      summary: 'Multiple central banks accelerate CBDC development programs in response to digital asset growth...',
      category: 'Regulation',
      sentiment: 'neutral',
      impact: 'high'
    },
    {
      title: 'DeFi Protocol TVL Surpasses $100 Billion Mark',
      source: 'DeFi Pulse',
      time: '8 hours ago',
      summary: 'Total Value Locked in decentralized finance protocols reaches new milestone as institutional adoption grows...',
      category: 'DeFi',
      sentiment: 'positive',
      impact: 'high'
    },
    {
      title: 'Major Exchange Announces New Trading Pairs',
      source: 'Exchange News',
      time: '10 hours ago',
      summary: 'Leading cryptocurrency exchange adds support for emerging tokens with high trading volumes...',
      category: 'Exchanges',
      sentiment: 'positive',
      impact: 'medium'
    },
    {
      title: 'NFT Market Shows Signs of Recovery',
      source: 'NFT Weekly',
      time: '12 hours ago',
      summary: 'Non-fungible token trading volume increases as new collections gain mainstream attention...',
      category: 'NFT',
      sentiment: 'positive',
      impact: 'low'
    }
  ])

  const allNewsItems = [
    {
      title: 'Bitcoin Reaches New Monthly High Amid Institutional Interest',
      source: 'CryptoNews',
      time: '2 hours ago',
      summary: 'Bitcoin surged past $43,000 as major institutions announce increased crypto allocations...',
      category: 'Bitcoin',
      sentiment: 'positive',
      impact: 'high'
    },
    {
      title: 'Ethereum 2.0 Staking Hits Record Levels',
      source: 'DeFi Daily',
      time: '4 hours ago',
      summary: 'Ethereum staking participation reaches all-time high as network upgrade approaches...',
      category: 'Ethereum',
      sentiment: 'positive',
      impact: 'medium'
    },
    {
      title: 'Central Bank Digital Currencies Gain Global Momentum',
      source: 'Finance Today',
      time: '6 hours ago',
      summary: 'Multiple central banks accelerate CBDC development programs in response to digital asset growth...',
      category: 'Regulation',
      sentiment: 'neutral',
      impact: 'high'
    },
    {
      title: 'DeFi Protocol TVL Surpasses $100 Billion Mark',
      source: 'DeFi Pulse',
      time: '8 hours ago',
      summary: 'Total Value Locked in decentralized finance protocols reaches new milestone as institutional adoption grows...',
      category: 'DeFi',
      sentiment: 'positive',
      impact: 'high'
    },
    {
      title: 'Major Exchange Announces New Trading Pairs',
      source: 'Exchange News',
      time: '10 hours ago',
      summary: 'Leading cryptocurrency exchange adds support for emerging tokens with high trading volumes...',
      category: 'Exchanges',
      sentiment: 'positive',
      impact: 'medium'
    },
    {
      title: 'NFT Market Shows Signs of Recovery',
      source: 'NFT Weekly',
      time: '12 hours ago',
      summary: 'Non-fungible token trading volume increases as new collections gain mainstream attention...',
      category: 'NFT',
      sentiment: 'positive',
      impact: 'low'
    },
    {
      title: 'Solana Network Achieves New Speed Milestone',
      source: 'Solana News',
      time: '14 hours ago',
      summary: 'Solana blockchain processes record transactions per second, challenging Ethereum dominance...',
      category: 'Altcoins',
      sentiment: 'positive',
      impact: 'medium'
    },
    {
      title: 'Crypto Mining Operations Face Regulatory Scrutiny',
      source: 'Mining Report',
      time: '16 hours ago',
      summary: 'Environmental concerns prompt new regulations for cryptocurrency mining operations worldwide...',
      category: 'Mining',
      sentiment: 'negative',
      impact: 'high'
    },
    {
      title: 'Web3 Gaming Platform Secures Major Funding',
      source: 'Gaming Crypto',
      time: '18 hours ago',
      summary: 'Blockchain gaming platform raises $50 million in Series B funding round led by venture capitalists...',
      category: 'Gaming',
      sentiment: 'positive',
      impact: 'medium'
    },
    {
      title: 'Stablecoin Market Cap Exceeds $150 Billion',
      source: 'Stablecoin Watch',
      time: '20 hours ago',
      summary: 'Combined market capitalization of major stablecoins reaches new all-time high...',
      category: 'Stablecoins',
      sentiment: 'positive',
      impact: 'high'
    }
  ]

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

  const fetchInvestments = async () => {
    try {
      const auth = getAuth()
      const user = auth.currentUser
      if (!user) return
      
      const token = await user.getIdToken()
      const response = await fetch('/api/investments/user', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setInvestmentStats({
          totalInvested: data.statistics.totalInvested,
          monthlyReturns: data.statistics.monthlyReturns,
          dailyReturns: data.statistics.dailyReturns,
          activeProjects: data.statistics.activeProjects,
          totalReturns: data.statistics.totalReturns
        })
      }
    } catch (error) {
      console.error('Error fetching investment data:', error)
    }
  }

  const fetchUnreadCount = async () => {
    try {
      const auth = getAuth()
      const user = auth.currentUser
      if (!user) return
      
      const response = await fetch(`/api/user/chat-unread?userId=${user.uid}`)
      if (response.ok) {
        const data = await response.json()
        setUnreadCount(data.unreadCount || 0)
      }
    } catch (error) {
      console.error('Error fetching unread count:', error)
    }
  }

  useEffect(() => {
    // Initialize data with lazy loading
    const initializeData = async () => {
      const auth = getAuth()
      const currentUser = auth.currentUser
      
      if (currentUser) {
        console.log('User authenticated, starting lazy data fetch')
        // Set loading to false immediately to show UI
        setLoading(false)
        
        // Fetch critical data first
        await fetchUserData()
        await fetchUnreadCount()
        await fetchInvestmentNews()
        
        // Fetch non-critical data with delay
        setTimeout(async () => {
          await fetchDepositHistory()
          await fetchInvestments()
          await fetchReferralData()
        }, 1000)
      } else {
        // Wait for auth state to change
        const unsubscribe = auth.onAuthStateChanged(async (user) => {
          if (user) {
            console.log('User authenticated, starting lazy data fetch')
            setLoading(false)
            
            await fetchUserData()
            await fetchUnreadCount()
            await fetchInvestmentNews()
            
            setTimeout(async () => {
              await fetchDepositHistory()
              await fetchInvestments()
              await fetchReferralData()
            }, 1000)
          } else {
            setLoading(false)
          }
        })
        return unsubscribe
      }
    }

    initializeData()
    
    // Update unread count every 30 seconds (reduced from 10 seconds)
    const unreadInterval = setInterval(() => {
      fetchUnreadCount()
    }, 30000)
    
    // Check for balance updates every 10 seconds (reduced from 3 seconds)
    const balanceInterval = setInterval(() => {
      fetchUserData()
    }, 10000)
    
    // Simulate real-time crypto updates
    const cryptoInterval = setInterval(() => {
      updateCryptoPrices()
    }, 10000) // Increased from 5 seconds to 10 seconds
    
    // Listen for balance updates from wallet
    const handleBalanceUpdate = () => {
      console.log('Balance update detected, refreshing user data')
      fetchUserData()
      fetchDepositHistory()
    }

    // Listen for messages being read in chat
    const handleMessagesRead = () => {
      console.log('Messages marked as read, refreshing unread count')
      fetchUnreadCount()
    }

    const handleInvestmentUpdate = () => {
      console.log('Investment update detected, refreshing investment data')
      fetchInvestments()
      fetchUserData()
    }

    window.addEventListener('investmentUpdated', handleInvestmentUpdate)
    window.addEventListener('balanceUpdated', handleBalanceUpdate)
    window.addEventListener('messagesRead', handleMessagesRead)
    
    return () => {
      clearInterval(cryptoInterval)
      clearInterval(unreadInterval)
      clearInterval(balanceInterval)
      window.removeEventListener('investmentUpdated', handleInvestmentUpdate)
      window.removeEventListener('balanceUpdated', handleBalanceUpdate)
      window.removeEventListener('messagesRead', handleMessagesRead)
    }
  }, [])

  const fetchUserData = async () => {
    try {
      const auth = getAuth()
      const user = auth.currentUser
      if (!user) {
        console.log('No current user found')
        return
      }

      console.log('Fetching user balance...')

      const token = await user.getIdToken()
      console.log('Got token, fetching direct balance...')
      
      // Use direct balance endpoint instead of profile endpoint
      const response = await fetch(`/api/user/balance?uid=${user.uid}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        console.log('Balance response:', data)
        setUserBalance(data.balance || 0)
        setUserData(data)
        
        // Also call debug endpoint to check database state
        try {
          const debugResponse = await fetch('/api/user/debug-balance', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          })
          if (debugResponse.ok) {
            const debugData = await debugResponse.json()
            console.log('Debug balance data:', debugData)
          }
        } catch (debugError) {
          console.error('Debug endpoint error:', debugError)
        }
      } else {
        console.error('Failed to fetch direct balance:', response.statusText)
        const errorText = await response.text()
        console.error('Error response:', errorText)
      }
      setLoading(false)
    } catch (error) {
      console.error('Error fetching direct balance:', error)
      setLoading(false)
    }
  }

  const updateCryptoPrices = () => {
    setCryptoData(prev => prev.map(crypto => {
      const newPrice = crypto.price * (1 + (Math.random() - 0.5) * 0.001)
      const newChange = parseFloat((crypto.change + (Math.random() - 0.5) * 0.5).toFixed(2))
      const newTrend = Math.random() > 0.5 ? 'up' : 'down'
      
      // Update sparkline with new price while maintaining unique patterns
      const newSparkline = [...crypto.sparkline.slice(1), newPrice]
      
      return {
        ...crypto,
        price: newPrice,
        change: newChange,
        trend: newTrend,
        sparkline: newSparkline,
        logo: crypto.logo // Keep the same logo
      }
    }))
  }

  const fetchReferralData = async () => {
    try {
      const auth = getAuth()
      const user = auth.currentUser
      if (!user) return
      
      const response = await fetch(`/api/user/referral-data?userId=${user.uid}`)
      if (response.ok) {
        const data = await response.json()
        setReferralData(data)
        setReferralLoading(false)
      }
    } catch (error) {
      console.error('Error fetching referral data:', error)
      setReferralLoading(false)
    }
  }

  const generateReferralCode = () => {
    const auth = getAuth()
    const currentUser = auth.currentUser
    if (!currentUser) return
    
    // Don't generate referral code - it should come from API
    console.log('Referral code should come from API, not generated locally')
    return
  }

  const copyReferralCode = () => {
    navigator.clipboard.writeText(referralData.referralLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const fetchInvestmentNews = async () => {
    try {
      const response = await fetch('/api/investment-news')
      if (response.ok) {
        const data = await response.json()
        setNews(data.news || [])
      } else {
        console.error('Failed to fetch investment news')
      }
    } catch (error) {
      console.error('Error fetching investment news:', error)
    }
  }

  const stats = [
    {
      title: 'Total Investment',
      value: `${investmentStats.totalInvested.toLocaleString()} XAF`,
      change: investmentStats.totalInvested > 0 ? '+12.5%' : '0%',
      trend: investmentStats.totalInvested > 0 ? 'up' : 'neutral',
      icon: TrendingUp
    },
    {
      title: 'Daily Returns',
      value: `${investmentStats.dailyReturns.toLocaleString()} XAF`,
      change: investmentStats.dailyReturns > 0 ? '+2.5%' : '0%',
      trend: investmentStats.dailyReturns > 0 ? 'up' : 'neutral',
      icon: TrendingUp
    },
    {
      title: 'Active Projects',
      value: investmentStats.activeProjects.toString(),
      change: investmentStats.activeProjects > 0 ? `+${investmentStats.activeProjects}` : '0',
      trend: investmentStats.activeProjects > 0 ? 'up' : 'neutral',
      icon: Briefcase
    }
  ]

  const recentProjects = [
    {
      name: 'Tech Startup Fund',
      invested: '$5,000',
      returns: '$5,625',
      status: 'active',
      performance: '+12.5%'
    },
    {
      name: 'Real Estate Portfolio',
      invested: '$3,500',
      returns: '$3,780',
      status: 'active',
      performance: '+8.0%'
    },
    {
      name: 'Green Energy Initiative',
      invested: '$2,000',
      returns: '$2,180',
      status: 'active',
      performance: '+9.0%'
    },
    {
      name: 'Healthcare Innovation',
      invested: '$1,950',
      returns: '$1,865',
      status: 'completed',
      performance: '-4.4%'
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Loading State - Only show for initial load */}
      {loading && !userData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-white text-lg">Loading your dashboard...</p>
          </div>
        </div>
      )}

      {/* Main Content - Show immediately when loading is false */}
      {!loading && (
        <>
          {/* Header */}
          <div className="fixed top-0 w-full z-40 bg-black/20 backdrop-blur-lg border-b border-white/10">
            <div className="px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center h-16">
                <div className="flex items-center space-x-2 sm:space-x-4">
                  <button
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                  </button>
                  <Link href="/" className="flex items-center space-x-2">
                    <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 text-purple-400" />
                    <span className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                      ProfitWave
                    </span>
                  </Link>
                </div>
                <div className="flex items-center space-x-2 sm:space-x-4">
                  <button 
                    className="relative text-gray-400 hover:text-white transition-colors group"
                    title="Customer Support"
                    onClick={() => {
                      // Trigger chat opening
                      const chatButton = document.querySelector('[data-chat-trigger]') as HTMLButtonElement;
                      if (chatButton) chatButton.click();
                    }}
                  >
                    <MessageCircle className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                    <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      Customer Support
                    </span>
                  </button>
                                  </div>
              </div>
            </div>
          </div>

          {/* Mobile Sidebar */}
          {sidebarOpen && (
            <div
              className="fixed top-16 left-0 w-72 h-full bg-black/95 backdrop-blur-lg border-r border-white/10 z-[60]"
            >
              <div className="p-4 space-y-2">
                <Link href="/dashboard" className="flex items-center space-x-3 p-3 rounded-lg bg-purple-600/20 text-purple-300 hover:bg-purple-600/30 transition-colors">
                  <Home className="w-5 h-5" />
                  <span>Home</span>
                </Link>
                <Link href="/invest" className="flex items-center space-x-3 p-3 rounded-lg text-gray-300 hover:bg-white/10 transition-colors">
                  <InvestIcon className="w-5 h-5" />
                  <span>Invest</span>
                </Link>
                <Link href="/my-investments" className="flex items-center space-x-3 p-3 rounded-lg text-gray-300 hover:bg-white/10 transition-colors">
                  <Briefcase className="w-5 h-5" />
                  <span>View My Investment</span>
                </Link>
                <Link href="/wallet" className="flex items-center space-x-3 p-3 rounded-lg text-gray-300 hover:bg-white/10 transition-colors">
                  <FontAwesomeIcon icon={faWallet} className="w-5 h-5" />
                  <span>Wallet</span>
                </Link>
                <Link href="/account" className="flex items-center space-x-3 p-3 rounded-lg text-gray-300 hover:bg-white/10 transition-colors">
                  <User className="w-5 h-5" />
                  <span>Account</span>
                </Link>
                <Link href="/account#contact" className="flex items-center space-x-3 p-3 rounded-lg text-gray-300 hover:bg-white/10 transition-colors">
                  <MessageCircle className="w-5 h-5" />
                  <span>Contact Us</span>
                </Link>
                <div className="pt-4 border-t border-white/10">
                  <button 
                    className="flex items-center space-x-3 p-3 rounded-lg text-gray-300 hover:bg-white/10 transition-colors w-full"
                    onClick={() => {
                      const auth = getAuth()
                      auth.signOut()
                      router.push('/get-started')
                    }}
                  >
                    <LogOut className="w-5 h-5" />
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Overlay for mobile sidebar */}
          {sidebarOpen && (
            <div 
              className="fixed inset-0 bg-black/50 z-[50]"
              onClick={() => setSidebarOpen(false)}
            />
          )}

          {/* All dashboard content */}
          <div className="pt-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
            <div className="py-4 sm:py-8">
              {/* Page Title */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 sm:mb-8"
              >
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start space-y-4 sm:space-y-0">
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Dashboard</h1>
                    <p className="text-gray-400 text-sm sm:text-base">Welcome back! Here's your investment overview.</p>
                  </div>
                  <button 
                    className="bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 px-3 sm:px-4 py-2 rounded-lg border border-purple-500/30 flex items-center space-x-2 transition-colors text-sm sm:text-base"
                    onClick={() => {
                      // Trigger chat opening
                      const chatButton = document.querySelector('[data-chat-trigger]') as HTMLButtonElement;
                      if (chatButton) chatButton.click();
                    }}
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span className="hidden sm:inline">Need Help?</span>
                    <span className="sm:hidden">Help</span>
                  </button>
                </div>
              </motion.div>

              {/* Account Balance Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="glass rounded-2xl p-4 sm:p-6 lg:p-8 mb-6 sm:mb-8 bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/30"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                  <div className="flex-1">
                    <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                      {showBalance ? `${userBalance.toLocaleString()} XAF` : '***,*** XAF'}
                    </h2>
                    <p className="text-lg sm:text-xl text-gray-300">Account Balance</p>
                    <p className="text-sm text-gray-400 mt-2">
                      Available for investment and withdrawals
                    </p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={async () => {
                        setShowBalance(!showBalance)
                        if (!showBalance) {
                          // Refresh balance when showing
                          try {
                            console.log('Refreshing balance...')
                            const auth = getAuth()
                            const token = await auth.currentUser?.getIdToken()
                            if (token) {
                              const response = await fetch('/api/user/direct-balance', {
                                headers: {
                                  'Authorization': `Bearer ${token}`
                                }
                              })
                              const data = await response.json()
                              if (data.success) {
                                setUserBalance(data.balance)
                              }
                            }
                          } catch (error) {
                            console.error('Error refreshing balance:', error)
                          }
                        }
                      }}
                      className="w-10 h-10 sm:w-12 sm:h-12 bg-white/10 hover:bg-white/20 rounded-xl flex items-center justify-center transition-colors"
                      title={showBalance ? "Hide balance" : "Show balance"}
                    >
                      {showBalance ? <EyeOff className="w-5 h-5 sm:w-6 sm:h-6 text-white" /> : <Eye className="w-5 h-5 sm:w-6 sm:h-6 text-white" />}
                    </button>
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center">
                      <DollarSign className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
                {stats.map((stat, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="glass rounded-2xl p-4 sm:p-6"
                  >
                    <div className="flex items-center justify-between mb-3 sm:mb-4">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
                        <stat.icon className="w-5 h-5 sm:w-6 sm:h-6 text-purple-400" />
                      </div>
                      <div className={`flex items-center space-x-1 text-xs sm:text-sm ${
                        stat.trend === 'up' ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {stat.trend === 'up' ? <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4" /> : <TrendingDown className="w-3 h-3 sm:w-4 sm:h-4" />}
                        <span>{stat.change}</span>
                      </div>
                    </div>
                    <h3 className="text-xl sm:text-2xl font-bold text-white mb-1">{stat.value}</h3>
                    <p className="text-gray-400 text-xs sm:text-sm">{stat.title}</p>
                  </motion.div>
                ))}
              </div>

              {/* Real-Time Crypto Trading */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="glass rounded-2xl p-6 mb-8"
              >
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-white">Real-Time Crypto Markets</h2>
                  <div className="flex items-center space-x-2 text-green-400">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-sm">Live</span>
                  </div>
                </div>
                
                {/* Best Investment Picks */}
                <div className="mb-6 p-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-xl border border-purple-500/20">
                  <h3 className="text-lg font-semibold text-white mb-3 flex items-center">
                    <TrendingUp className="w-5 h-5 mr-2 text-green-400" />
                    Today's Best Investment Picks
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {cryptoData.filter(crypto => crypto.recommendation === 'Strong Buy').slice(0, 3).map((crypto, index) => (
                      <div key={crypto.symbol} className="bg-white/5 rounded-lg p-3 border border-white/10">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-white font-semibold">{crypto.symbol}</span>
                          <span className="text-green-400 text-xs font-medium">Strong Buy</span>
                        </div>
                        <div className="text-sm text-gray-300">${crypto.price.toLocaleString()}</div>
                        <div className={`text-xs ${crypto.trend === 'up' ? 'text-green-400' : 'text-red-400'}`}>
                          {crypto.change > 0 ? '+' : ''}{crypto.change}%
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Enhanced Crypto Cards with Charts */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  {cryptoData.map((crypto, index) => {
                    const colors = cryptoColors[crypto.symbol] || cryptoColors.BTC
                    return (
                    <motion.div
                      key={crypto.symbol}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.1 * index }}
                      className={`bg-gradient-to-br ${colors.bg} ${colors.border} border rounded-xl p-3 sm:p-4 hover:bg-white/10 transition-all duration-200 hover:scale-105`}
                    >
                      <div className="flex items-center justify-between mb-2 sm:mb-3">
                        <div>
                          <h3 className={`font-semibold text-sm sm:base ${colors.accent}`}>{crypto.symbol}</h3>
                          <p className="text-gray-400 text-xs">{crypto.name}</p>
                        </div>
                        <div className={`px-1.5 sm:px-2 py-1 rounded-full text-xs font-medium ${
                          crypto.recommendation === 'Strong Buy' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                          crypto.recommendation === 'Buy' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                          'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                        }`}>
                          {crypto.recommendation}
                        </div>
                      </div>
                      
                      {/* Crypto Logo and Chart */}
                      <div className="mb-2 sm:mb-3 flex items-center justify-between space-x-2 sm:space-x-3">
                        {/* Crypto Logo */}
                        <div className="flex-shrink-0">
                          <img 
                            src={crypto.logo} 
                            alt={`${crypto.name} logo`}
                            className="w-8 h-8 sm:w-12 sm:h-12 object-contain"
                          />
                        </div>
                        
                        {/* Real-time Mini Chart */}
                        <div className="flex-1 h-8 sm:h-12 flex items-end justify-between">
                          {crypto.sparkline.map((price, i) => {
                            const max = Math.max(...crypto.sparkline)
                            const min = Math.min(...crypto.sparkline)
                            const height = ((price - min) / (max - min)) * 100 || 20
                            
                            // Map height to CSS class (rounded to nearest 10)
                            const heightClass = `sparklineHeight${Math.round(height / 10) * 10}`
                            
                            return (
                              <div
                                key={i}
                                className={`flex-1 mx-px rounded-t transition-all duration-300 ${
                                  crypto.trend === 'up' ? 'bg-green-400' : 'bg-red-400'
                                } ${dashboardStyles[heightClass]}`}
                              />
                            )
                          })}
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center mb-1 sm:mb-2">
                        <div className="text-lg sm:text-2xl font-bold text-white">
                          ${crypto.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        <div className={`flex items-center space-x-1 text-xs sm:text-sm ${
                          crypto.trend === 'up' ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {crypto.trend === 'up' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                          <span>{crypto.change > 0 ? '+' : ''}{crypto.change}%</span>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-gray-400">Vol:</span>
                          <span className="text-gray-300 ml-1">${crypto.volume}</span>
                        </div>
                        <div>
                          <span className="text-gray-400">MCap:</span>
                          <span className="text-gray-300 ml-1">${crypto.marketCap}</span>
                        </div>
                      </div>
                    </motion.div>
                    )
                  })}
                </div>
              </motion.div>

              {/* Investment News - Enhanced Visibility */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="bg-gradient-to-r from-purple-600/20 to-blue-600/20 backdrop-blur-lg rounded-2xl p-6 border border-purple-500/30 shadow-lg shadow-purple-500/10"
              >
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-6 space-y-2 sm:space-y-0">
                  <h2 className="text-xl sm:text-2xl font-bold text-white flex flex-col sm:flex-row sm:items-center">
                    <div className="flex items-center">
                      <Newspaper className="w-5 h-5 sm:w-6 sm:h-6 mr-3 text-purple-300" />
                      Investment News
                    </div>
                    <div className="ml-0 sm:ml-4 flex items-center space-x-2 mt-2 sm:mt-0">
                      <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                      <span className="text-sm text-green-400 font-medium">Latest Updates</span>
                    </div>
                  </h2>
                  <button 
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors flex items-center space-x-2 shadow-lg"
                    onClick={() => fetchInvestmentNews()}
                    title="Refresh news articles"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>Refresh</span>
                  </button>
                </div>
                
                {news.length === 0 ? (
                  <div className="text-center py-8">
                    <Newspaper className="w-16 h-16 mx-auto mb-4 text-purple-400/50" />
                    <p className="text-gray-300 text-lg">No investment news available</p>
                    <p className="text-gray-400 text-sm mt-2">Check back later for the latest market updates</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {news.map((article, index) => (
                      <motion.div
                        key={`${article.title}-${index}`}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 * index }}
                        className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20 hover:bg-white/15 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/20"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <h3 className="text-white font-bold text-lg hover:text-purple-300 transition-colors cursor-pointer">
                                {article.title}
                              </h3>
                              <span className={`px-3 py-1 rounded-full text-xs font-bold flex-shrink-0 ${
                                article.impact === 'high' ? 'bg-red-500/30 text-red-300 border border-red-500/50' :
                                article.impact === 'medium' ? 'bg-blue-500/30 text-blue-300 border border-blue-500/50' :
                                'bg-gray-500/30 text-gray-300 border border-gray-500/50'
                              }`}>
                                {article.impact || 'normal'}
                              </span>
                            </div>
                            <p className="text-gray-200 text-sm leading-relaxed mb-3">
                              {article.summary}
                            </p>
                            <div className="flex items-center justify-between text-xs text-gray-400">
                              <span className="px-2 py-1 bg-purple-500/20 rounded-full text-purple-300">
                                {article.category || 'general'}
                              </span>
                              <span>{article.time}</span>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            </div>
          </div>
        </>
      )}
      
      {/* Bottom Navigation Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-lg border-t border-white/10">
        <div className="pb-safe-area-inset-bottom">
          <div className="flex justify-around items-center">
            <Link href="/dashboard" className="flex flex-col items-center p-2 text-purple-400 hover:text-purple-300 transition-colors">
              <Home className="w-5 h-5 sm:w-6 sm:h-6 mb-1" />
              <span className="text-xs">Home</span>
            </Link>
            <Link href="/invest" className="flex flex-col items-center p-2 text-gray-400 hover:text-purple-300 transition-colors">
              <InvestIcon className="w-5 h-5 sm:w-6 sm:h-6 mb-1" />
              <span className="text-xs">Invest</span>
            </Link>
            <Link href="/wallet" className="flex flex-col items-center p-2 text-gray-400 hover:text-purple-300 transition-colors">
              <FontAwesomeIcon icon={faWallet} className="w-5 h-5 sm:w-6 sm:h-6 mb-1" />
              <span className="text-xs">Wallet</span>
            </Link>
            <Link href="/account" className="flex flex-col items-center p-2 text-gray-400 hover:text-purple-300 transition-colors">
              <User className="w-5 h-5 sm:w-6 sm:h-6 mb-1" />
              <span className="text-xs">Account</span>
            </Link>
          </div>
        </div>
      </div>
      
      {/* Customer Chat Component */}
      <CustomerChat />
    </div>
  )
}
