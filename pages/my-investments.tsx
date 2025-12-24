import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faWallet, faArrowLeft } from '@fortawesome/free-solid-svg-icons'
import Link from 'next/link'
import { getAuth } from 'firebase/auth'
import { Home, TrendingUp, User, ArrowLeft as ArrowLeftIcon, Check, AlertCircle, Clock, Target, DollarSign } from 'lucide-react'
import { auth } from '../lib/firebase'
import styles from '../components/Investments.module.css'

// Firebase configuration is handled in lib/firebase.ts

// Helper function to generate progress bar classes
const getProgressBarClass = (progress: number) => {
  // Map progress to Tailwind width classes
  if (progress <= 5) return 'w-[5%]'
  if (progress <= 10) return 'w-[10%]'
  if (progress <= 15) return 'w-[15%]'
  if (progress <= 20) return 'w-[20%]'
  if (progress <= 25) return 'w-[25%]'
  if (progress <= 30) return 'w-[30%]'
  if (progress <= 35) return 'w-[35%]'
  if (progress <= 40) return 'w-[40%]'
  if (progress <= 45) return 'w-[45%]'
  if (progress <= 50) return 'w-[50%]'
  if (progress <= 55) return 'w-[55%]'
  if (progress <= 60) return 'w-[60%]'
  if (progress <= 65) return 'w-[65%]'
  if (progress <= 70) return 'w-[70%]'
  if (progress <= 75) return 'w-[75%]'
  if (progress <= 80) return 'w-[80%]'
  if (progress <= 85) return 'w-[85%]'
  if (progress <= 90) return 'w-[90%]'
  if (progress <= 95) return 'w-[95%]'
  return 'w-full'
}

interface Investment {
  id: string
  planId: string
  planName: string
  amount: number
  returnAmount: number
  period: number
  dailyReturn: number
  status: 'active' | 'completed' | 'cancelled'
  startDate: Date
  endDate: Date
  currentReturn: number
  progress: number
  daysPassed: number
  totalDays: number
  createdAt: Date
}

interface InvestmentStats {
  totalInvested: number
  totalReturns: number
  monthlyReturns: number
  activeProjects: number
  totalInvestments: number
}

const MyInvestmentsPage = () => {
  const [user, setUser] = useState<any>(null)
  const [investments, setInvestments] = useState<Investment[]>([])
  const [statistics, setStatistics] = useState<InvestmentStats>({
    totalInvested: 0,
    totalReturns: 0,
    monthlyReturns: 0,
    activeProjects: 0,
    totalInvestments: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const auth = getAuth()
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      if (currentUser) {
        setUser(currentUser)
        fetchInvestments(currentUser)
      } else {
        // Redirect to login if not authenticated
        window.location.href = '/get-started'
      }
    })

    return () => unsubscribe()
  }, [])

  const fetchInvestments = async (currentUser: any) => {
    try {
      const token = await currentUser.getIdToken()
      const response = await fetch('/api/investments/user', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setInvestments(data.investments)
        setStatistics(data.statistics)
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to fetch investments')
      }
    } catch (error) {
      console.error('Error fetching investments:', error)
      setError('Failed to fetch investments')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-400 bg-green-400/10 border-green-400/30'
      case 'completed': return 'text-blue-400 bg-blue-400/10 border-blue-400/30'
      case 'cancelled': return 'text-red-400 bg-red-400/10 border-red-400/30'
      default: return 'text-gray-400 bg-gray-400/10 border-gray-400/30'
    }
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-black text-white flex items-center justify-center">
        <div className="text-xl">Loading investments...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-black text-white p-4">
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-8">
        <div className="flex items-center justify-between mb-6">
          <Link href="/dashboard">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
            >
              <ArrowLeftIcon className="w-5 h-5" />
            </motion.button>
          </Link>
          <h1 className="text-3xl font-bold">My Investments</h1>
          <div className="w-10" />
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-2xl p-6"
          >
            <div className="flex items-center justify-between mb-2">
              <DollarSign className="w-8 h-8 text-purple-400" />
              <span className="text-sm text-gray-400">Total</span>
            </div>
            <h3 className="text-2xl font-bold">{statistics.totalInvested.toLocaleString()} XAF</h3>
            <p className="text-sm text-gray-400">Total Investment</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass rounded-2xl p-6"
          >
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="w-8 h-8 text-green-400" />
              <span className="text-sm text-gray-400">Monthly</span>
            </div>
            <h3 className="text-2xl font-bold">{statistics.monthlyReturns.toLocaleString()} XAF</h3>
            <p className="text-sm text-gray-400">Monthly Returns</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass rounded-2xl p-6"
          >
            <div className="flex items-center justify-between mb-2">
              <Target className="w-8 h-8 text-blue-400" />
              <span className="text-sm text-gray-400">Active</span>
            </div>
            <h3 className="text-2xl font-bold">{statistics.activeProjects}</h3>
            <p className="text-sm text-gray-400">Active Projects</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass rounded-2xl p-6"
          >
            <div className="flex items-center justify-between mb-2">
              <Check className="w-8 h-8 text-yellow-400" />
              <span className="text-sm text-gray-400">Total</span>
            </div>
            <h3 className="text-2xl font-bold">{statistics.totalInvestments}</h3>
            <p className="text-sm text-gray-400">All Investments</p>
          </motion.div>
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

        {/* Investments List */}
        <div className="space-y-6">
          {investments.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="glass rounded-2xl p-8 text-center"
            >
              <Target className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Investments Yet</h3>
              <p className="text-gray-400 mb-6">Start investing to see your investments here</p>
              <Link href="/invest">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-colors"
                >
                  Start Investing
                </motion.button>
              </Link>
            </motion.div>
          ) : (
            investments.map((investment, index) => (
              <motion.div
                key={investment.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="glass rounded-2xl p-6"
              >
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-bold">{investment.planName}</h3>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(investment.status)}`}>
                        {investment.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-gray-400">Investment</p>
                        <p className="font-semibold">{investment.amount.toLocaleString()} XAF</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">Expected Return</p>
                        <p className="font-semibold text-green-400">{investment.returnAmount.toLocaleString()} XAF</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">Daily Return</p>
                        <p className="font-semibold">{investment.dailyReturn.toLocaleString()} XAF</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">Current Returns</p>
                        <p className="font-semibold text-blue-400">{investment.currentReturn.toLocaleString()} XAF</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-sm text-gray-400">
                      <div className="flex items-center space-x-4">
                        <span>Started: {formatDate(investment.startDate)}</span>
                        <span>•</span>
                        <span>Ends: {formatDate(investment.endDate)}</span>
                      </div>
                      <span>Day {investment.daysPassed} of {investment.totalDays}</span>
                    </div>
                  </div>

                  <div className="lg:w-48">
                    <div className="mb-2">
                      <div className="flex justify-between text-sm mb-1">
                        <span>Progress</span>
                        <span>{Math.round(investment.progress)}%</span>
                      </div>
                      <div className="w-full bg-white/10 rounded-full h-2">
                        <div
                          className={`bg-gradient-to-r from-purple-600 to-pink-600 h-2 rounded-full transition-all duration-300 ${styles.progressBar} ${getProgressBarClass(investment.progress)}`}
                        />
                      </div>
                    </div>
                    <div className="text-center">
                      <Clock className="w-4 h-4 inline mr-1" />
                      <span className="text-sm">
                        {investment.totalDays - investment.daysPassed} days remaining
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
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

export default MyInvestmentsPage
