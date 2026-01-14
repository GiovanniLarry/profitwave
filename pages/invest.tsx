import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faWallet } from '@fortawesome/free-solid-svg-icons'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { getAuth } from 'firebase/auth'
import { initializeApp, getApps } from 'firebase/app'
import { ArrowLeft, TrendingUp, DollarSign, Home, User, ChevronRight, Clock, Shield, Star } from 'lucide-react'

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

const InvestPage = () => {
  const router = useRouter()
  const [selectedCurrency, setSelectedCurrency] = useState<'USD' | 'EUR' | 'XAF' | 'YEN'>('XAF')
  const [investmentPlans, setInvestmentPlans] = useState<InvestmentPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [userData, setUserData] = useState<any>(null)
  const [investing, setInvesting] = useState(false)

  // Check authentication status on component mount
  useEffect(() => {
    const auth = getAuth()
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser)
      if (currentUser) {
        // Fetch user data when authenticated
        fetchUserData(currentUser)
      }
    })

    return () => unsubscribe()
  }, [])

  // Fetch user data
  const fetchUserData = async (currentUser: any) => {
    try {
      const token = await currentUser.getIdToken()
      const userResponse = await fetch('/api/user/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (userResponse.ok) {
        const userProfile = await userResponse.json()
        setUserData(userProfile)
      }
    } catch (error) {
      console.error('Error fetching user data:', error)
    }
  }

  // Handle investment - navigate to amount selection page
  const handleInvest = (plan: InvestmentPlan) => {
    router.push(`/invest/${plan.id}`)
  }

  // Currency conversion rates (base: XAF)
  const conversionRates = {
    USD: 0.0016,  // 1 XAF = 0.0016 USD
    EUR: 0.0015,  // 1 XAF = 0.0015 EUR  
    XAF: 1,       // 1 XAF = 1 XAF
    YEN: 0.24     // 1 XAF = 0.24 YEN
  }

  // Currency symbols
  const currencySymbols = {
    USD: '$',
    EUR: '€',
    XAF: 'XAF',
    YEN: '¥'
  }

  const baseInvestmentPlans: InvestmentPlan[] = [
    {
      id: 'special-6500',
      name: 'Premium Investment Plan',
      minAmount: 6500,
      maxAmount: 6500,
      returnAmount: 9750,
      period: 28,
      dailyReturn: 116,
      image: '/card1.jpeg',
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
      image: '/card2.jpeg',
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
      image: '/card3.jpeg',
      risk: 'low',
      description: 'Silver tier investment with balanced returns (~20 EUR)',
      features: ['25% return in first 14 days', '50% + principal after 28 days', 'Very low risk', 'Instant withdrawal', 'Silver benefits', 'Popular choice']
    },
    {
      id: 'plan-17000',
      name: 'Gold Investment Plan',
      minAmount: 17000,
      maxAmount: 17000,
      returnAmount: 25500,
      period: 28,
      dailyReturn: 304,
      image: '/card4.jpeg',
      risk: 'low',
      description: 'Gold tier investment with excellent returns (~25 EUR)',
      features: ['25% return in first 14 days', '50% + principal after 28 days', 'Zero risk', 'Instant withdrawal', 'Gold status', 'Premium returns']
    },
    {
      id: 'plan-20000',
      name: 'Platinum Investment Plan',
      minAmount: 20000,
      maxAmount: 20000,
      returnAmount: 30000,
      period: 28,
      dailyReturn: 357,
      image: '/card5.jpeg',
      risk: 'low',
      description: 'Platinum tier investment with superior returns (~30 EUR)',
      features: ['25% return in first 14 days', '50% + principal after 28 days', 'Zero risk', 'Instant withdrawal', 'Platinum perks', 'High returns']
    },
    {
      id: 'plan-27000',
      name: 'Diamond Investment Plan',
      minAmount: 27000,
      maxAmount: 27000,
      returnAmount: 40500,
      period: 28,
      dailyReturn: 482,
      image: '/card6.jpeg',
      risk: 'low',
      description: 'Diamond tier investment with maximum guaranteed returns (~40 EUR)',
      features: ['25% return in first 14 days', '50% + principal after 28 days', 'Zero risk', 'Instant withdrawal', 'Diamond exclusive', 'Maximum returns']
    },
    {
      id: 'plan-33000',
      name: 'Elite Investment Plan',
      minAmount: 33000,
      maxAmount: 33000,
      returnAmount: 49500,
      period: 28,
      dailyReturn: 591,
      image: '/card7.jpeg',
      risk: 'low',
      description: 'Elite tier investment for serious investors (~50 EUR)',
      features: ['25% return in first 14 days', '50% + principal after 28 days', 'Zero risk', 'Instant withdrawal', 'Elite benefits', 'Professional grade']
    },
    {
      id: 'plan-40000',
      name: 'Royal Investment Plan',
      minAmount: 40000,
      maxAmount: 40000,
      returnAmount: 60000,
      period: 28,
      dailyReturn: 714,
      image: '/card8.jpeg',
      risk: 'low',
      description: 'Royal tier investment with exceptional returns (~60 EUR)',
      features: ['25% return in first 14 days', '50% + principal after 28 days', 'Zero risk', 'Instant withdrawal', 'Royal privileges', 'Exceptional service']
    },
    {
      id: 'plan-50000',
      name: 'Mogul Investment Plan',
      minAmount: 50000,
      maxAmount: 50000,
      returnAmount: 75000,
      period: 28,
      dailyReturn: 893,
      image: '/card9.jpeg',
      risk: 'low',
      description: 'Mogul tier investment for high-achieving investors (~75 EUR)',
      features: ['25% return in first 14 days', '50% + principal after 28 days', 'Zero risk', 'Instant withdrawal', 'Mogul status', 'High performance']
    },
    {
      id: 'plan-67000',
      name: 'Titan Investment Plan',
      minAmount: 67000,
      maxAmount: 67000,
      returnAmount: 100500,
      period: 28,
      dailyReturn: 1196,
      image: '/card10.jpeg',
      risk: 'low',
      description: 'Titan tier investment with legendary returns (~100 EUR)',
      features: ['25% return in first 14 days', '50% + principal after 28 days', 'Zero risk', 'Instant withdrawal', 'Titan exclusive', 'Legendary returns']
    }
  ]

  useEffect(() => {
    // Convert investment amounts based on selected currency
    const convertedPlans = baseInvestmentPlans.map(plan => ({
      ...plan,
      minAmount: Math.round(plan.minAmount * conversionRates[selectedCurrency]),
      maxAmount: Math.round(plan.maxAmount * conversionRates[selectedCurrency]),
      returnAmount: Math.round(plan.returnAmount * conversionRates[selectedCurrency]),
      dailyReturn: Math.round(plan.dailyReturn * conversionRates[selectedCurrency])
    }))
    setInvestmentPlans(convertedPlans)
    setLoading(false)
  }, [selectedCurrency])

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'text-green-400 bg-green-400/10 border-green-400/30'
      case 'medium': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30'
      case 'high': return 'text-red-400 bg-red-400/10 border-red-400/30'
      default: return 'text-gray-400 bg-gray-400/10 border-gray-400/30'
    }
  }

  const getRiskIcon = (risk: string) => {
    switch (risk) {
      case 'low': return <Shield className="w-4 h-4" />
      case 'medium': return <TrendingUp className="w-4 h-4" />
      case 'high': return <Star className="w-4 h-4" />
      default: return <Shield className="w-4 h-4" />
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-black text-white flex items-center justify-center">
        <div className="text-xl">Loading investment plans...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-black text-white">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-lg border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard" className="flex items-center space-x-2">
                <ArrowLeft className="w-5 h-5 text-purple-400" />
                <span className="text-purple-400">Back</span>
              </Link>
              <h1 className="text-xl font-bold">Investment Plans</h1>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="pt-20 pb-24 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Currency Selection */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-2xl p-6 mb-8"
          >
            <h2 className="text-2xl font-bold mb-6">Select Your Currency</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(conversionRates).map(([currency, rate]) => (
                <motion.button
                  key={currency}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedCurrency(currency as any)}
                  className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                    selectedCurrency === currency
                      ? 'border-purple-400 bg-purple-400/10'
                      : 'border-white/20 bg-white/5 hover:border-purple-400/50'
                  }`}
                >
                  <div className="text-2xl font-bold mb-2">{currencySymbols[currency as keyof typeof currencySymbols]}</div>
                  <div className="text-sm text-gray-400">{currency}</div>
                  <div className="text-xs text-gray-500 mt-1">1 XAF = {rate} {currency}</div>
                </motion.button>
              ))}
            </div>
          </motion.div>

          {/* Investment Plans Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {investmentPlans.map((plan, index) => (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`glass rounded-2xl overflow-hidden hover:scale-105 transition-transform duration-300 h-full flex flex-col ${
                  plan.id === 'special-6500' 
                    ? 'ring-2 ring-purple-400 ring-offset-2 ring-offset-black shadow-2xl shadow-purple-500/20' 
                    : ''
                }`}
              >
                {/* Special Badge for Premium Plan */}
                {plan.id === 'special-6500' && (
                  <div className="absolute top-4 right-4 z-10">
                    <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center space-x-1">
                      <Star className="w-3 h-3" />
                      <span>PREMIUM</span>
                    </div>
                  </div>
                )}

                {/* Plan Image */}
                <div className="h-48 relative overflow-hidden flex-shrink-0">
                  <img 
                    src={plan.image} 
                    alt={plan.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end justify-center pb-4">
                    <div className="text-center">
                      <h3 className={`font-bold text-white ${plan.id === 'special-6500' ? 'text-2xl' : 'text-xl'}`}>
                        {plan.name}
                      </h3>
                    </div>
                  </div>
                </div>

                {/* Plan Details */}
                <div className="p-6 flex-grow flex flex-col">
                  {/* Special Investment Amount Display for Premium Plan */}
                  {plan.id === 'special-6500' ? (
                    <div className="mb-6">
                      <div className="text-center mb-4">
                        <div className="text-sm text-gray-400 mb-2">Exclusive Investment Amount</div>
                        <div className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                          {currencySymbols[selectedCurrency]}{plan.minAmount.toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">Fixed Amount Investment</div>
                      </div>
                      
                      {/* Tiered Returns Display */}
                      <div className="space-y-3">
                        <div className="bg-gradient-to-r from-green-500/20 to-green-500/20 border border-green-500/30 rounded-lg p-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                                <span className="text-white text-xs font-bold">1</span>
                              </div>
                              <div>
                                <div className="text-sm font-semibold text-green-400">First 14 Days</div>
                                <div className="text-xs text-gray-400">Phase 1 Returns</div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-bold text-green-400">+25%</div>
                              <div className="text-xs text-gray-500">{currencySymbols[selectedCurrency]}{(plan.minAmount * 0.25).toLocaleString()}</div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-lg p-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                                <span className="text-white text-xs font-bold">2</span>
                              </div>
                              <div>
                                <div className="text-sm font-semibold text-purple-400">After 14 Days</div>
                                <div className="text-xs text-gray-400">Phase 2 Returns</div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-bold text-purple-400">+50%</div>
                              <div className="text-xs text-gray-500">{currencySymbols[selectedCurrency]}{(plan.minAmount * 0.50).toLocaleString()}</div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 rounded-lg p-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <TrendingUp className="w-5 h-5 text-yellow-400" />
                              <div>
                                <div className="text-sm font-semibold text-yellow-400">Total Returns</div>
                                <div className="text-xs text-gray-400">After 28 Days</div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-xl font-bold text-yellow-400">{currencySymbols[selectedCurrency]}{plan.returnAmount.toLocaleString()}</div>
                              <div className="text-xs text-gray-500">Principal + 50% Returns</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Regular Investment Amount */}
                      <div className="mb-4">
                        <div className="text-sm text-gray-400 mb-1">Investment Amount</div>
                        <div className="text-2xl font-bold">
                          {currencySymbols[selectedCurrency]}{plan.minAmount.toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-500">
                          {selectedCurrency === 'EUR' ? `~${Math.round(plan.minAmount * conversionRates['EUR'])} EUR` : 
                           selectedCurrency === 'USD' ? `~${Math.round(plan.minAmount * conversionRates['USD'])} USD` : ''}
                        </div>
                      </div>

                      {/* Returns */}
                      <div className="mb-4">
                        <div className="text-sm text-gray-400 mb-1">Total Returns</div>
                        <div className="text-3xl font-bold text-green-400">
                          {currencySymbols[selectedCurrency]}{plan.returnAmount.toLocaleString()}
                        </div>
                        <div className="text-sm text-gray-500">
                          +25% in 14 days, +50% after 28 days
                        </div>
                      </div>

                      {/* Period */}
                      <div className="mb-4">
                        <div className="flex items-center space-x-2 text-sm text-gray-400">
                          <Clock className="w-4 h-4" />
                          <span>{plan.period} days</span>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Description */}
                  <p className="text-sm text-gray-400 mb-4 flex-grow">{plan.description}</p>

                  {/* Features */}
                  <div className="mb-6">
                    <div className="text-sm text-gray-400 mb-2">Features</div>
                    <div className="space-y-1">
                      {plan.features.slice(0, plan.id === 'special-6500' ? 6 : 3).map((feature, idx) => (
                        <div key={idx} className="text-xs text-gray-300 flex items-center space-x-1">
                          <ChevronRight className={`w-3 h-3 ${plan.id === 'special-6500' ? 'text-purple-400' : 'text-purple-400'}`} />
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Invest Button */}
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleInvest(plan)}
                    disabled={investing}
                    className={`w-full py-3 rounded-xl font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 ${
                      plan.id === 'special-6500'
                        ? 'bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 text-white hover:from-purple-700 hover:via-pink-700 hover:to-purple-700 shadow-lg shadow-purple-500/30'
                        : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700'
                    }`}
                  >
                    {investing ? 'Processing...' : (plan.id === 'special-6500' ? 'Invest Now - Premium Plan' : 'Invest Now')}
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-lg border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-around items-center py-2">
            <Link href="/dashboard" className="flex flex-col items-center p-2 text-gray-400 hover:text-purple-400 transition-colors">
              <Home className="w-5 h-5" />
              <span className="text-xs mt-1">Home</span>
            </Link>
            <Link href="/invest" className="flex flex-col items-center p-2 text-purple-400">
              <TrendingUp className="w-5 h-5" />
              <span className="text-xs mt-1">Invest</span>
            </Link>
            <Link href="/wallet" className="flex flex-col items-center p-2 text-gray-400 hover:text-purple-400 transition-colors">
              <FontAwesomeIcon icon={faWallet} className="w-5 h-5" />
              <span className="text-xs mt-1">Wallet</span>
            </Link>
            <Link href="/profile" className="flex flex-col items-center p-2 text-gray-400 hover:text-purple-400 transition-colors">
              <User className="w-5 h-5" />
              <span className="text-xs mt-1">Profile</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default InvestPage
