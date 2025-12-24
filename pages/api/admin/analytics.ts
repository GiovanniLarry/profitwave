import { NextApiRequest, NextApiResponse } from 'next'

// Check admin authentication
function checkAuth(req: NextApiRequest): boolean {
  const adminAuth = req.headers.authorization
  const sessionAuth = req.cookies.adminAuthenticated
  
  // Allow access via session or admin header
  return sessionAuth === 'true' || adminAuth === 'Bearer admin-token'
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Check admin authentication
  if (!checkAuth(req)) {
    return res.status(401).json({ error: 'Unauthorized access' })
  }

  if (req.method === 'GET') {
    try {
      const { period = '30d' } = req.query
      
      // Generate mock analytics data based on period
      const analyticsData = generateAnalyticsData(period as string)
      
      res.status(200).json(analyticsData)
    } catch (error) {
      console.error('Error fetching analytics:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  } else {
    res.setHeader('Allow', ['GET'])
    res.status(405).end(`Method ${req.method} Not Allowed`)
  }
}

function generateAnalyticsData(period: string) {
  const days = period === '7d' ? 7 : period === '30d' ? 30 : 90
  const today = new Date()
  
  // Generate user growth data
  const userGrowth = []
  let totalUsers = 850
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    
    // Simulate user growth with some randomness
    const newUsers = Math.floor(Math.random() * 15) + 5
    totalUsers += newUsers
    
    userGrowth.push({
      date: date.toISOString().split('T')[0],
      newUsers,
      totalUsers,
      activeUsers: Math.floor(totalUsers * (0.6 + Math.random() * 0.3))
    })
  }
  
  // Generate revenue data
  const revenueData = []
  let cumulativeRevenue = 45000
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    
    const dailyRevenue = Math.floor(Math.random() * 2000) + 800
    cumulativeRevenue += dailyRevenue
    
    revenueData.push({
      date: date.toISOString().split('T')[0],
      revenue: dailyRevenue,
      cumulativeRevenue
    })
  }
  
  // Generate message activity data
  const messageActivity = []
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    
    messageActivity.push({
      date: date.toISOString().split('T')[0],
      messages: Math.floor(Math.random() * 8) + 2,
      resolved: Math.floor(Math.random() * 6) + 1
    })
  }
  
  // Generate top metrics
  const metrics = {
    totalUsers: totalUsers,
    activeUsers: Math.floor(totalUsers * 0.75),
    newUsersThisPeriod: userGrowth.reduce((sum, day) => sum + day.newUsers, 0),
    totalRevenue: cumulativeRevenue,
    revenueThisPeriod: revenueData.reduce((sum, day) => sum + day.revenue, 0),
    totalMessages: messageActivity.reduce((sum, day) => sum + day.messages, 0),
    resolvedMessages: messageActivity.reduce((sum, day) => sum + day.resolved, 0),
    averageSessionDuration: '12m 34s',
    conversionRate: '3.2%',
    bounceRate: '42.1%',
    topPages: [
      { page: '/dashboard', views: 15420, unique: 8900 },
      { page: '/account', views: 12300, unique: 6700 },
      { page: '/investments', views: 9800, unique: 5400 },
      { page: '/contact', views: 7600, unique: 4200 },
      { page: '/pricing', views: 5400, unique: 3100 }
    ],
    topCountries: [
      { country: 'United States', users: 3400, percentage: 40.0 },
      { country: 'United Kingdom', users: 1800, percentage: 21.2 },
      { country: 'Canada', users: 1200, percentage: 14.1 },
      { country: 'Australia', users: 900, percentage: 10.6 },
      { country: 'Germany', users: 600, percentage: 7.1 },
      { country: 'Others', users: 600, percentage: 7.0 }
    ],
    deviceStats: {
      desktop: 58.3,
      mobile: 38.7,
      tablet: 3.0
    },
    browserStats: {
      chrome: 45.2,
      safari: 22.1,
      firefox: 15.3,
      edge: 12.4,
      others: 5.0
    }
  }
  
  // Generate funnel data
  const funnelData = [
    { stage: 'Visitors', count: 125000, conversion: 100 },
    { stage: 'Sign Ups', count: 8500, conversion: 6.8 },
    { stage: 'Email Verified', count: 6800, conversion: 80.0 },
    { stage: 'Profile Completed', count: 5100, conversion: 75.0 },
    { stage: 'First Investment', count: 3400, conversion: 66.7 },
    { stage: 'Active Users', count: 2550, conversion: 75.0 }
  ]
  
  return {
    period,
    metrics,
    charts: {
      userGrowth,
      revenueData,
      messageActivity,
      funnelData
    },
    lastUpdated: new Date().toISOString()
  }
}
