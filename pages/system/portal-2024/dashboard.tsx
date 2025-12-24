import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Home, Users, MessageSquare, TrendingUp, Settings, Activity, 
  Shield, LogOut, Search, Filter, Download, Eye, 
  Mail, Calendar, DollarSign, BarChart3, PieChart,
  Clock, CheckCircle, AlertCircle, X, Menu, ChevronRight,
  Bell, CheckSquare, Square, Trash2, Send, FileText,
  ChevronDown, Ban, MoreVertical, UserCheck, MessageCircle,
  ArrowUpLeft, CreditCard
} from 'lucide-react'
import { useRouter } from 'next/router'
import { useSocket } from '../../../hooks/useSocket'

interface AdminStats {
  totalUsers: number
  activeUsers: number
  totalMessages: number
  pendingMessages: number
  totalInvestments: number
  revenue: number
  growthRate: number
}

interface User {
  _id: string
  email: string
  fullName: string
  username: string
  createdAt: string
  lastLoginAt?: string
  lastActivity?: string
  isOnline: boolean
  emailVerified: boolean
  authProvider: string
  balance: number
  status: 'active' | 'inactive' | 'suspended' | 'banned'
  bannedUntil?: string
  banReason?: string
}

interface ContactMessage {
  _id: string
  email: string
  subject: string
  message: string
  status: 'pending' | 'in-progress' | 'resolved'
  createdAt: string
  userName?: string
  userId?: string
  adminResponse?: string
  adminResponseDate?: string
}

interface Notification {
  id: string
  type: 'user' | 'message' | 'system' | 'security'
  title: string
  message: string
  read: boolean
  timestamp: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  data?: any
}

export default function AdminDashboard() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'messages' | 'chat' | 'analytics' | 'settings' | 'deposit' | 'deposit-verification' | 'withdrawals' | 'investment-news'>('overview')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    activeUsers: 0,
    totalMessages: 0,
    pendingMessages: 0,
    totalInvestments: 0,
    revenue: 0,
    growthRate: 0
  })
  const [users, setUsers] = useState<User[]>([])
  const [messages, setMessages] = useState<ContactMessage[]>([])
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null)
  const [notificationCount, setNotificationCount] = useState(0)
  
  // Investment News State
  const [investmentNews, setInvestmentNews] = useState<any[]>([])
  const [newsForm, setNewsForm] = useState({
    title: '',
    content: '',
    category: 'general',
    importance: 'normal'
  })
  const [editingNews, setEditingNews] = useState<any>(null)
  const [showNewsForm, setShowNewsForm] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null)
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [selectedMessages, setSelectedMessages] = useState<string[]>([])
  const [showBulkActions, setShowBulkActions] = useState(false)
  const [userActionMenu, setUserActionMenu] = useState<string | null>(null)
  const [messageDateFilter, setMessageDateFilter] = useState<'all' | 'today' | 'yesterday' | 'custom'>('all')
  const [customStartDate, setCustomStartDate] = useState('')
  const [customEndDate, setCustomEndDate] = useState('')
  const [respondingTo, setRespondingTo] = useState<string | null>(null)
  const [responseText, setResponseText] = useState('')
  const [chatUsers, setChatUsers] = useState<any[]>([])
  const [selectedChatUser, setSelectedChatUser] = useState<any>(null)
  const [chatMessages, setChatMessages] = useState<any[]>([])
  const [chatInput, setChatInput] = useState('')
  const [userTyping, setUserTyping] = useState<{ [key: string]: boolean }>({})
  const [depositSelectedUser, setDepositSelectedUser] = useState<any>(null)
  const [depositAmount, setDepositAmount] = useState('')
  const [depositDescription, setDepositDescription] = useState('')
  const [pendingDeposits, setPendingDeposits] = useState<any[]>([])
  const [selectedDeposit, setSelectedDeposit] = useState<any>(null)
  const [depositLoading, setDepositLoading] = useState(false)
  const [withdrawals, setWithdrawals] = useState<any[]>([])
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<any>(null)
  const [withdrawalLoading, setWithdrawalLoading] = useState(false)
  const [adminNote, setAdminNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [adminUsername, setAdminUsername] = useState('Admin')
  
  const socket = useSocket()

  useEffect(() => {
    // Check admin authentication
    const isAuthenticated = typeof window !== 'undefined' && sessionStorage.getItem('adminAuthenticated') === 'true'
    if (!isAuthenticated) {
      router.push('/system/portal-2024/login')
      return
    }

    fetchDashboardData()
    fetchPendingDeposits()
    fetchWithdrawals()
    fetchNotifications()
    
    // Fetch chat users if chat tab is active
    if (activeTab === 'chat') {
      fetchChatUsers()
    }
    
    // Fetch investment news if investment-news tab is active
    if (activeTab === 'investment-news') {
      fetchInvestmentNews()
    }
    
    // Set up real-time updates every 30 seconds
    const interval = setInterval(() => {
      fetchDashboardData()
      fetchPendingDeposits()
      fetchWithdrawals()
      fetchNotifications()
    }, 30000)
    
    return () => clearInterval(interval)
  }, [activeTab])

  // Set admin username after hydration
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const username = sessionStorage.getItem('adminUsername')
      if (username) {
        setAdminUsername(username)
      }
    }
  }, [])

  // WebSocket setup for admin chat
  useEffect(() => {
    if (socket.connected && activeTab === 'chat') {
      // Join admin room
      socket.joinAdminRoom()
      
      // Set up WebSocket event listeners
      socket.onNewUserMessage((data) => {
        console.log('Received user message via WebSocket:', data)
        
        // Add message to chat if this user is selected
        if (selectedChatUser && selectedChatUser._id === data.userId) {
          const newMessage = {
            _id: Date.now().toString(),
            userMessage: data.message,
            type: 'user_message',
            messageDate: data.timestamp,
            createdAt: data.timestamp
          }
          setChatMessages(prev => [...prev, newMessage])
        }
        
        // Update user list to show new message
        setChatUsers(prev => prev.map(user => 
          user._id === data.userId 
            ? { ...user, lastMessage: data.timestamp, unreadCount: (user.unreadCount || 0) + 1 }
            : user
        ))
      })

      socket.onUserTyping((data) => {
        setUserTyping(prev => ({ ...prev, [data.userId]: data.isTyping }))
      })

      socket.onOnlineUsers((users) => {
        console.log('Online users updated:', users)
        // Update online status for users
        setChatUsers(prev => prev.map(user => {
          const onlineUser = users.find(u => u.userId === user._id)
          return onlineUser ? { ...user, isOnline: true } : { ...user, isOnline: false }
        }))
      })

      socket.onMessageSent((data) => {
        if (!data.success) {
          console.error('Failed to send admin message:', data.error)
        }
      })
    }
  }, [socket.connected, activeTab, selectedChatUser])

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userActionMenu) {
        setUserActionMenu(null)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [userActionMenu])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      
      // Prepare authentication headers
      const authHeaders = {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer admin-token'
      }
      
      // Fetch users
      const usersResponse = await fetch('/api/admin/users', {
        headers: authHeaders
      })
      let usersData: User[] = []
      if (usersResponse.ok) {
        const userData = await usersResponse.json()
        usersData = userData.users || []
        setUsers(usersData)
      } else {
        console.error('Failed to fetch users:', usersResponse.status)
      }

      // Fetch contact messages
      const messagesResponse = await fetch('/api/contact')
      let messagesData: ContactMessage[] = []
      if (messagesResponse.ok) {
        const messageData = await messagesResponse.json()
        messagesData = messageData.messages || []
        setMessages(messagesData)
      } else {
        console.error('Failed to fetch messages:', messagesResponse.status)
      }

      // Fetch notifications
      const notificationsResponse = await fetch('/api/admin/notifications', {
        headers: authHeaders
      })
      if (notificationsResponse.ok) {
        const notificationsData = await notificationsResponse.json()
        setNotifications(notificationsData.notifications || [])
      } else {
        console.error('Failed to fetch notifications:', notificationsResponse.status)
      }

      // Calculate real stats from actual data
      const totalUsers = usersData.length
      const currentlyActiveUsers = usersData.filter(u => u.isOnline).length // Users currently online
      const totalMessages = messagesData.length
      const pendingMessages = messagesData.filter(m => m.status === 'pending').length
      const totalCashDeposits = usersData.reduce((sum, user) => sum + (user.balance || 0), 0)
      const growthRate = totalUsers > 0 ? ((currentlyActiveUsers / totalUsers) * 100).toFixed(1) : '0'

      const realStats: AdminStats = {
        totalUsers,
        activeUsers: currentlyActiveUsers, // Now shows currently online users
        totalMessages,
        pendingMessages,
        totalInvestments: totalCashDeposits,
        revenue: totalCashDeposits,
        growthRate: parseFloat(growthRate)
      }

      setStats(realStats)
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      const response = await fetch('/api/admin/notifications')
      if (response.ok) {
        const data = await response.json()
        setNotifications(data.notifications || [])
        setNotificationCount(data.notifications?.filter((n: any) => !n.read).length || 0)
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
    }
  }

  // Investment News Functions
  const fetchInvestmentNews = async () => {
    try {
      const response = await fetch('/api/admin/investment-news', {
        headers: {
          'Authorization': 'Bearer admin-token-2024'
        }
      })
      if (response.ok) {
        const data = await response.json()
        setInvestmentNews(data.news || [])
      }
    } catch (error) {
      console.error('Error fetching investment news:', error)
    }
  }

  const handleCreateNews = async () => {
    try {
      const response = await fetch('/api/admin/investment-news', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer admin-token-2024'
        },
        body: JSON.stringify(newsForm)
      })
      
      if (response.ok) {
        alert('Investment news created successfully!')
        setNewsForm({ title: '', content: '', category: 'general', importance: 'normal' })
        setShowNewsForm(false)
        fetchInvestmentNews()
      } else {
        const errorData = await response.json()
        alert(`Failed to create news: ${errorData.error}`)
      }
    } catch (error) {
      console.error('Error creating news:', error)
      alert('Failed to create news')
    }
  }

  const handleUpdateNews = async () => {
    if (!editingNews) return
    
    try {
      const response = await fetch('/api/admin/investment-news', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer admin-token-2024'
        },
        body: JSON.stringify({ ...newsForm, id: editingNews._id })
      })
      
      if (response.ok) {
        alert('Investment news updated successfully!')
        setNewsForm({ title: '', content: '', category: 'general', importance: 'normal' })
        setEditingNews(null)
        setShowNewsForm(false)
        fetchInvestmentNews()
      } else {
        const errorData = await response.json()
        alert(`Failed to update news: ${errorData.error}`)
      }
    } catch (error) {
      console.error('Error updating news:', error)
      alert('Failed to update news')
    }
  }

  const handleDeleteNews = async (newsId: string) => {
    if (!confirm('Are you sure you want to delete this news article?')) return
    
    try {
      const response = await fetch('/api/admin/investment-news', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer admin-token-2024'
        },
        body: JSON.stringify({ id: newsId })
      })
      
      if (response.ok) {
        alert('Investment news deleted successfully!')
        fetchInvestmentNews()
      } else {
        const errorData = await response.json()
        alert(`Failed to delete news: ${errorData.error}`)
      }
    } catch (error) {
      console.error('Error deleting news:', error)
      alert('Failed to delete news')
    }
  }

  const handleEditNews = (news: any) => {
    setEditingNews(news)
    setNewsForm({
      title: news.title,
      content: news.content,
      category: news.category,
      importance: news.importance
    })
    setShowNewsForm(true)
  }

  // Handle notification click
  const handleNotificationClick = async (notification: any) => {
    // Mark as read
    try {
      await fetch('/api/admin/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId: notification._id, read: true })
      })
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }

    // Redirect to action URL
    if (notification.actionUrl) {
      // Parse the URL to extract the tab and any parameters
      const url = new URL(notification.actionUrl, window.location.origin)
      const tabParam = url.searchParams.get('tab')
      const depositId = url.searchParams.get('depositId')
      
      if (tabParam) {
        setActiveTab(tabParam as any)
      }
      
      // If there's a specific deposit ID, we might want to select it
      if (depositId) {
        // Find and select the specific deposit
        const targetDeposit = pendingDeposits.find(d => d._id === depositId)
        if (targetDeposit) {
          setSelectedDeposit(targetDeposit)
        }
      }
    } else {
      // Default redirects based on notification type
      switch (notification.type) {
        case 'new_user':
          setActiveTab('users')
          break
        case 'new_message':
          setActiveTab('messages')
          break
        case 'deposit_pending':
          setActiveTab('deposit-verification')
          // If we have depositId in the notification data, select it
          if (notification.depositId) {
            const targetDeposit = pendingDeposits.find(d => d._id === notification.depositId)
            if (targetDeposit) {
              setSelectedDeposit(targetDeposit)
            }
          }
          break
        default:
          break
      }
    }
    
    setShowNotifications(false)
    fetchNotifications()
  }

  const fetchPendingDeposits = async () => {
    try {
      const response = await fetch('/api/admin/pending-deposits', {
        headers: {
          'Authorization': 'Bearer admin-token'
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setPendingDeposits(data.pendingDeposits || [])
      } else {
        console.error('Failed to fetch pending deposits')
      }
    } catch (error) {
      console.error('Error fetching pending deposits:', error)
    }
  }

  const fetchWithdrawals = async () => {
    try {
      const response = await fetch('/api/admin/withdrawals', {
        headers: {
          'Authorization': 'Bearer admin-token'
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setWithdrawals(data.withdrawals || [])
      } else {
        console.error('Failed to fetch withdrawals')
      }
    } catch (error) {
      console.error('Error fetching withdrawals:', error)
    }
  }

  // Handle message status update
  const handleMessageStatusUpdate = async (messageId: string, status: 'pending' | 'in-progress' | 'resolved') => {
    try {
      const response = await fetch('/api/contact', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId, status })
      })
      
      if (response.ok) {
        // Update local state
        setMessages(prev => prev.map(msg => 
          msg._id === messageId ? { ...msg, status } : msg
        ))
      } else {
        console.error('Failed to update message status')
      }
    } catch (error) {
      console.error('Error updating message status:', error)
    }
  }

  const handleDepositAction = async (depositId: string, action: 'approve' | 'reject') => {
    if (!confirm(`Are you sure you want to ${action} this deposit?`)) {
      return
    }

    try {
      const response = await fetch('/api/admin/pending-deposits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer admin-token'
        },
        body: JSON.stringify({
          depositId,
          action
        })
      })

      if (response.ok) {
        const data = await response.json()
        alert(`Deposit ${action}d successfully!`)
        
        // Refresh pending deposits
        await fetchPendingDeposits()
        
        // Refresh dashboard data to update user balances
        await fetchDashboardData()
        
        setSelectedDeposit(null)
      } else {
        const errorData = await response.json()
        alert(`Failed to ${action} deposit: ${errorData.error}`)
      }
    } catch (error) {
      console.error(`Error ${action}ing deposit:`, error)
      alert(`Failed to ${action} deposit. Please try again.`)
    }
  }

  const handleBulkUserAction = async (action: string) => {
    if (selectedUsers.length === 0) return
    
    try {
      const response = await fetch('/api/admin/bulk-operations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer admin-token'
        },
        body: JSON.stringify({
          operation: 'bulk_user_update',
          data: {
            userIds: selectedUsers,
            updates: { status: action }
          }
        })
      })
      
      if (response.ok) {
        await fetchDashboardData()
        setSelectedUsers([])
        setShowBulkActions(false)
      }
    } catch (error) {
      console.error('Bulk operation failed:', error)
    }
  }

  const handleExportData = async (type: 'users' | 'messages', format: 'csv' | 'json') => {
    try {
      const response = await fetch('/api/admin/bulk-operations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer admin-token'
        },
        body: JSON.stringify({
          operation: `export_${type}`,
          data: { format }
        })
      })
      
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${type}_export.${format}`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      console.error('Export failed:', error)
    }
  }

  const markNotificationAsRead = async (notificationId: string) => {
    try {
      const response = await fetch('/api/admin/notifications', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer admin-token'
        },
        body: JSON.stringify({ notificationId, read: true })
      })
      
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      )
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
    }
  }

  const handleUserAction = async (userId: string, action: string, banDuration?: number) => {
    console.log('handleUserAction called:', { userId, action, banDuration })
    
    try {
      const requestBody = { userId, action, banDuration }
      console.log('Request body:', requestBody)
      
      const response = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer admin-token'
        },
        body: JSON.stringify(requestBody)
      })
      
      console.log('Response status:', response.status)
      console.log('Response ok:', response.ok)
      
      if (response.ok) {
        const responseData = await response.json()
        console.log('Response data:', responseData)
        await fetchDashboardData()
        alert(`User ${action} successful`)
      } else {
        const errorData = await response.json()
        console.error('API Error:', errorData)
        alert(`Failed to ${action} user: ${errorData.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Network error:', error)
      alert(`Error performing ${action} on user: ${error.message}`)
    }
  }

  const handleDeleteUser = async (userId: string) => {
    console.log('handleDeleteUser called with userId:', userId)
    
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      console.log('User cancelled delete operation')
      return
    }
    
    try {
      console.log('Attempting to delete user:', userId)
      
      const response = await fetch('/api/admin/users', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer admin-token'
        },
        body: JSON.stringify({ userId })
      })
      
      console.log('Delete response status:', response.status)
      console.log('Delete response ok:', response.ok)
      
      if (response.ok) {
        const responseData = await response.json()
        console.log('Delete response data:', responseData)
        await fetchDashboardData()
        alert('User deleted successfully')
      } else {
        const errorData = await response.json()
        console.error('Delete API Error:', errorData)
        alert(`Failed to delete user: ${errorData.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Delete network error:', error)
      alert(`Error deleting user: ${error.message}`)
    }
  }

  // Test function to verify click events work
  const testClick = () => {
    console.log('Test click function called - click events are working!')
    alert('Click events are working!')
  }

  const handleAdminResponse = async (messageId: string, userId: string) => {
    if (!responseText.trim()) {
      alert('Please enter a response message')
      return
    }
    
    console.log('Sending admin response:', { messageId, userId, response: responseText })
    
    try {
      const response = await fetch('/api/admin/respond', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer admin-token'
        },
        body: JSON.stringify({
          messageId,
          response: responseText,
          userId
        })
      })
      
      if (response.ok) {
        const responseData = await response.json()
        console.log('Admin response sent:', responseData)
        alert('Response sent successfully!')
        setResponseText('')
        setRespondingTo(null)
        await fetchDashboardData() // Refresh messages to update status
      } else {
        const errorData = await response.json()
        console.error('Failed to send response:', errorData)
        alert(`Failed to send response: ${errorData.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error sending admin response:', error)
      alert(`Error sending response: ${error.message}`)
    }
  }

  // Chat functions
  const fetchChatUsers = async () => {
    try {
      const response = await fetch('/api/admin/chat-users', {
        headers: {
          'Authorization': 'Bearer admin-token'
        }
      })
      if (response.ok) {
        const data = await response.json()
        setChatUsers(data.users || [])
      }
    } catch (error) {
      console.error('Error fetching chat users:', error)
    }
  }

  const fetchChatMessages = async (userId: string) => {
    try {
      const response = await fetch(`/api/admin/chat-messages?userId=${userId}`, {
        headers: {
          'Authorization': 'Bearer admin-token'
        }
      })
      if (response.ok) {
        const data = await response.json()
        setChatMessages(data.messages || [])
      }
    } catch (error) {
      console.error('Error fetching chat messages:', error)
    }
  }

  const handleAdminTyping = (value: string) => {
    setChatInput(value)
    
    // Send typing indicator to user
    if (socket.connected && selectedChatUser) {
      const isTyping = value.trim().length > 0
      socket.sendAdminTyping(selectedChatUser._id, isTyping)
    }
  }

  const sendChatMessage = async () => {
    if (!chatInput.trim() || !selectedChatUser) return
    
    // Add message to local state immediately for better UX
    const newMessage = {
      _id: Date.now().toString(),
      adminMessage: chatInput,
      type: 'admin_response',
      messageDate: new Date(),
      createdAt: new Date()
    }
    setChatMessages(prev => [...prev, newMessage])
    
    const messageToSend = chatInput
    setChatInput('')
    
    try {
      // Send message via WebSocket for real-time delivery
      if (socket.connected) {
        socket.sendAdminMessage(selectedChatUser._id, messageToSend)
        console.log('Admin message sent via WebSocket:', { userId: selectedChatUser._id, message: messageToSend })
      } else {
        // Fallback to HTTP API if WebSocket is not connected
        const response = await fetch('/api/admin/send-chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer admin-token'
          },
          body: JSON.stringify({
            userId: selectedChatUser._id,
            message: messageToSend
          })
        })
        
        if (response.ok) {
          console.log('Admin message sent successfully via HTTP')
        } else {
          console.error('Failed to send admin message via HTTP')
        }
      }
    } catch (error) {
      console.error('Error sending admin chat message:', error)
    }
  }

  const handleDeposit = async () => {
    if (!depositSelectedUser || !depositAmount || parseFloat(depositAmount) <= 0) {
      alert('Please select a user and enter a valid amount')
      return
    }

    setDepositLoading(true)
    try {
      const response = await fetch('/api/admin/deposits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer admin-token'
        },
        body: JSON.stringify({
          userId: depositSelectedUser.firebaseUid || depositSelectedUser._id,
          amount: parseFloat(depositAmount),
          description: `Admin deposit of XAF ${depositAmount}`,
          method: 'admin'
        })
      })

      if (response.ok) {
        const data = await response.json()
        console.log('Deposit processed:', data)
        alert(`Successfully deposited XAF ${depositAmount} to ${data.user.fullName}`)
        
        // Reset form
        setDepositSelectedUser(null)
        setDepositAmount('')
        
        // Refresh user data to show updated balance
        fetchDashboardData()
      } else {
        const error = await response.json()
        alert(`Failed to process deposit: ${error.error}`)
      }
    } catch (error) {
      console.error('Error processing deposit:', error)
      alert('Failed to process deposit. Please try again.')
    } finally {
      setDepositLoading(false)
    }
  }

  const handleWithdrawalAction = async (withdrawalId: string, action: 'approve' | 'reject') => {
    if (!confirm(`Are you sure you want to ${action} this withdrawal request?`)) {
      return
    }

    setWithdrawalLoading(true)
    try {
      const response = await fetch('/api/admin/withdrawals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer admin-token'
        },
        body: JSON.stringify({
          withdrawalId,
          action,
          adminNote: adminNote.trim() || undefined
        })
      })

      if (response.ok) {
        const data = await response.json()
        alert(`Withdrawal ${action}d successfully!`)
        
        // Refresh withdrawals
        await fetchWithdrawals()
        
        // Refresh dashboard data to update user balances if needed
        await fetchDashboardData()
        
        // Reset form
        setSelectedWithdrawal(null)
        setAdminNote('')
      } else {
        const errorData = await response.json()
        alert(`Failed to ${action} withdrawal: ${errorData.error}`)
      }
    } catch (error) {
      console.error(`Error ${action}ing withdrawal:`, error)
      alert(`Failed to ${action} withdrawal. Please try again.`)
    } finally {
      setWithdrawalLoading(false)
    }
  }

  const handleDeleteWithdrawal = async (withdrawalId: string) => {
    if (!confirm('Are you sure you want to delete this withdrawal record? This action cannot be undone.')) {
      return
    }

    setWithdrawalLoading(true)
    try {
      const response = await fetch('/api/admin/withdrawals', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer admin-token'
        },
        body: JSON.stringify({
          withdrawalId
        })
      })

      if (response.ok) {
        const data = await response.json()
        alert('Withdrawal deleted successfully!')
        
        // Refresh withdrawals
        await fetchWithdrawals()
        
        // Reset form
        setSelectedWithdrawal(null)
        setAdminNote('')
      } else {
        const errorData = await response.json()
        alert(`Failed to delete withdrawal: ${errorData.error}`)
      }
    } catch (error) {
      console.error('Error deleting withdrawal:', error)
      alert('Failed to delete withdrawal. Please try again.')
    } finally {
      setWithdrawalLoading(false)
    }
  }

  const handleCleanupChat = async () => {
    if (!confirm('Are you sure you want to delete all chat messages older than 24 hours? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch('/api/admin/cleanup-chat', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer admin-token'
        }
      })

      if (response.ok) {
        const data = await response.json()
        alert(`Chat cleanup completed! Deleted ${data.deletedCount} old messages.`)
        
        // Refresh chat data if chat tab is active
        if (activeTab === 'chat') {
          await fetchChatUsers()
          if (selectedChatUser) {
            await fetchChatMessages(selectedChatUser._id)
          }
        }
      } else {
        const errorData = await response.json()
        alert(`Failed to cleanup chat: ${errorData.error}`)
      }
    } catch (error) {
      console.error('Error cleaning up chat:', error)
      alert('Failed to cleanup chat. Please try again.')
    }
  }

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('adminAuthenticated')
      sessionStorage.removeItem('adminUsername')
    }
    router.push('/system/portal-2024/login')
  }

  const filteredUsers = users.filter(user => 
    (user.fullName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (user.email?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (user.username?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  )

  // Filter messages based on date filter and search
  const filteredMessages = messages.filter(message => {
    // Apply date filter
    if (messageDateFilter === 'all') {
      // No date filter, continue
    } else {
      const messageDate = new Date(message.createdAt)
      const today = new Date()
      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)
      
      // Reset time to compare only dates
      const messageDateOnly = new Date(messageDate.getFullYear(), messageDate.getMonth(), messageDate.getDate())
      const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate())
      const yesterdayOnly = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate())
      
      if (messageDateFilter === 'today') {
        if (messageDateOnly.getTime() !== todayOnly.getTime()) return false
      } else if (messageDateFilter === 'yesterday') {
        if (messageDateOnly.getTime() !== yesterdayOnly.getTime()) return false
      } else if (messageDateFilter === 'custom') {
        if (!customStartDate || !customEndDate) return true
        const startDate = new Date(customStartDate)
        const endDate = new Date(customEndDate)
        if (messageDate < startDate || messageDate > endDate) return false
      }
    }
    
    // Apply search filter
    return (
      (message.subject?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (message.email?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (message.message?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    )
  })

  const StatCard = ({ title, value, change, icon: Icon, color }: any) => (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20"
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        {change && (
          <span className={`text-sm font-medium ${
            change > 0 ? 'text-green-400' : 'text-red-400'
          }`}>
            {change > 0 ? '+' : ''}{change}%
          </span>
        )}
      </div>
      <h3 className="text-2xl font-bold text-white mb-1">{value}</h3>
      <p className="text-gray-400 text-sm">{title}</p>
    </motion.div>
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-2xl">Loading dashboard...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      {/* Header */}
      <header className="bg-black/20 backdrop-blur-lg border-b border-white/10 relative z-[100]">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
              aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
              title={sidebarOpen ? "Close sidebar" : "Open sidebar"}
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-2xl font-bold">ProfitWave Admin</h1>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors relative"
                aria-label="Toggle notifications"
                title="Toggle notifications"
              >
                <Bell className="w-5 h-5" />
                {notifications.filter(n => !n.read).length > 0 && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
                )}
              </button>
            </div>
            
            {/* Export Actions */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleExportData('users', 'csv')}
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                title="Export Users"
                aria-label="Export users data as CSV"
              >
                <Download className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleExportData('messages', 'csv')}
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                title="Export Messages"
                aria-label="Export messages data as CSV"
              >
                <FileText className="w-4 h-4" />
              </button>
            </div>
            
            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors relative"
                aria-label="Notifications"
                title="Notifications"
              >
                <Bell className="w-5 h-5" />
                {notificationCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {notificationCount}
                  </span>
                )}
              </button>
              
              {showNotifications && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-black/95 backdrop-blur-lg border border-white/20 rounded-lg shadow-xl z-[9999]">
                  <div className="p-4 border-b border-white/10">
                    <h3 className="font-semibold">Notifications</h3>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-gray-400">
                        No notifications
                      </div>
                    ) : (
                      notifications.map((notification) => (
                        <div
                          key={notification._id}
                          onClick={() => handleNotificationClick(notification)}
                          className={`p-4 border-b border-white/10 cursor-pointer transition-colors hover:bg-white/5 ${
                            !notification.read ? 'bg-purple-500/10' : ''
                          }`}
                        >
                          <div className="flex items-start space-x-3">
                            <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                              notification.priority === 'critical' ? 'bg-red-500' :
                              notification.priority === 'high' ? 'bg-orange-500' :
                              notification.priority === 'medium' ? 'bg-yellow-500' :
                              'bg-gray-500'
                            }`}></div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">{notification.message}</p>
                              <p className="text-xs text-gray-400 mt-1">
                                {new Date(notification.createdAt).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              <Shield className="w-5 h-5 text-purple-400" />
              <span className="text-sm">{adminUsername}</span>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 transition-colors flex items-center space-x-2"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className={`${sidebarOpen ? 'w-64' : 'w-0'} transition-all duration-300 bg-black/20 backdrop-blur-lg border-r border-white/10 overflow-hidden`}>
          <nav className="p-4 space-y-2">
            {[
              { id: 'overview', label: 'Overview', icon: Home },
              { id: 'users', label: 'Users', icon: Users },
              { id: 'messages', label: 'Messages', icon: MessageSquare },
              { id: 'deposit', label: 'Deposit', icon: DollarSign },
              { id: 'deposit-verification', label: 'Deposit Verification', icon: CheckCircle },
              { id: 'withdrawals', label: 'Withdrawals', icon: ArrowUpLeft },
              { id: 'investment-news', label: 'Investment News', icon: FileText },
              { id: 'chat', label: 'Live Chat', icon: MessageCircle },
              { id: 'analytics', label: 'Analytics', icon: BarChart3 },
              { id: 'settings', label: 'Settings', icon: Settings }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                  activeTab === tab.id
                    ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                    : 'hover:bg-white/10 text-gray-300'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          {/* Search Bar */}
          <div className="mb-6">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <h2 className="text-3xl font-bold mb-6">Dashboard Overview</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                  title="Total Users"
                  value={stats.totalUsers}
                  change={stats.growthRate}
                  icon={Users}
                  color="bg-blue-500/20"
                />
                <StatCard
                  title="Active Users"
                  value={stats.activeUsers}
                  change={8.2}
                  icon={Activity}
                  color="bg-green-500/20"
                />
                <StatCard
                  title="Messages"
                  value={stats.totalMessages}
                  change={-2.1}
                  icon={MessageSquare}
                  color="bg-purple-500/20"
                />
                <StatCard
                  title="Cash Deposits (FCFA)"
                  value={`${stats.totalInvestments.toLocaleString()} FCFA`}
                  change={stats.growthRate}
                  icon={DollarSign}
                  color="bg-yellow-500/20"
                />
              </div>

              {/* Recent Activity */}
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
                <h3 className="text-xl font-semibold mb-4">Recent Activity</h3>
                <div className="space-y-3">
                  {messages.slice(0, 5).map((message) => (
                    <div key={message._id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="font-medium">{message.subject}</p>
                          <p className="text-sm text-gray-400">{message.email}</p>
                        </div>
                      </div>
                      <span className="text-xs text-gray-400">
                        {new Date(message.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* Users Tab */}
          {activeTab === 'users' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold">User Management</h2>
                <div className="flex space-x-2">
                  <button 
                    onClick={testClick}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
                  >
                    Test Click
                  </button>
                  <button className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors">
                    Add User
                  </button>
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-white/5">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">User</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Unique ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Email</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Joined</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                      {filteredUsers.slice(0, 10).map((user) => (
                        <tr key={user._id} className="hover:bg-white/5 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center space-x-3">
                              {user.isOnline && (
                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                              )}
                              <div>
                                <div className="font-medium">{user.fullName}</div>
                                <div className="text-sm text-gray-400">@{user.username}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="bg-purple-500/20 text-purple-400 px-2 py-1 rounded text-sm font-mono">
                              {user.uniqueId || 'N/A'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                            {user.email}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center space-x-2">
                              {user.isOnline && (
                                <span className="px-2 py-1 text-xs bg-green-500/20 text-green-400 rounded-full">Online</span>
                              )}
                              <span className={`px-3 py-1 rounded-full text-sm ${
                                user.status === 'active' ? 'bg-green-500/20 text-green-400' :
                                user.status === 'inactive' ? 'bg-gray-500/20 text-gray-400' :
                                user.status === 'banned' ? 'bg-red-500/20 text-red-400' :
                                'bg-yellow-500/20 text-yellow-400'
                              }`}>
                                {user.status}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                            {new Date(user.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <button
                              onClick={() => setSelectedUser(user)}
                              className="text-purple-400 hover:text-purple-300 p-1"
                              aria-label={`View user details for ${user.fullName}`}
                              title={`View user details for ${user.fullName}`}
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            
                            {user.status === 'banned' ? (
                              <button
                                onClick={() => handleUserAction(user._id, 'unban')}
                                className="text-green-400 hover:text-green-300 p-1"
                                aria-label={`Unban ${user.fullName}`}
                                title={`Unban ${user.fullName}`}
                              >
                                <UserCheck className="w-4 h-4" />
                              </button>
                            ) : (
                              <button
                                onClick={() => handleUserAction(user._id, 'ban', 999)}
                                className="text-red-400 hover:text-red-300 p-1"
                                aria-label={`Ban ${user.fullName}`}
                                title={`Ban ${user.fullName}`}
                              >
                                <Ban className="w-4 h-4" />
                              </button>
                            )}
                            
                            <button
                              onClick={() => handleDeleteUser(user._id)}
                              className="text-red-400 hover:text-red-300 p-1"
                              aria-label={`Delete ${user.fullName}`}
                              title={`Delete ${user.fullName}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {/* Deposit Tab */}
          {activeTab === 'deposit' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold">Deposit Funds</h2>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* User Selection */}
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
                  <h3 className="text-xl font-semibold mb-4">Select User</h3>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {users.map((user) => (
                      <div
                        key={user._id}
                        onClick={() => setDepositSelectedUser(user)}
                        className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                          depositSelectedUser?._id === user._id
                            ? 'bg-purple-500/20 border-purple-500/50'
                            : 'bg-white/5 border-white/10 hover:bg-white/10'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="flex items-center space-x-2">
                              <div className="font-medium">{user.fullName}</div>
                              <div className="bg-purple-500/20 text-purple-400 px-2 py-1 rounded text-xs font-mono">
                                {user.uniqueId || 'N/A'}
                              </div>
                            </div>
                            <div className="text-sm text-gray-400">{user.email}</div>
                            <div className="text-sm text-gray-400">@{user.username}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium">${user.balance?.toFixed(2) || '0.00'}</div>
                            <div className="text-xs text-gray-400">Current Balance</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Deposit Form */}
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
                  <h3 className="text-xl font-semibold mb-4">Deposit Amount</h3>
                  
                  {depositSelectedUser ? (
                    <div className="space-y-4">
                      <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                        <div className="font-medium text-purple-300">{depositSelectedUser.fullName}</div>
                        <div className="text-sm text-gray-400">{depositSelectedUser.email}</div>
                        <div className="text-sm text-gray-400">Current Balance: XAF {depositSelectedUser.balance?.toFixed(2) || '0.00'}</div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Amount (XAF)</label>
                        <input
                          type="number"
                          value={depositAmount}
                          onChange={(e) => setDepositAmount(e.target.value)}
                          placeholder="Enter amount"
                          min="0.01"
                          step="0.01"
                          className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                        />
                      </div>

                      <div>
                        <div className="text-sm text-gray-400 mb-2">New Balance:</div>
                        <div className="text-2xl font-bold text-green-400">
                          XAF {((depositSelectedUser.balance || 0) + (parseFloat(depositAmount) || 0)).toFixed(2)}
                        </div>
                      </div>

                      <button
                        onClick={handleDeposit}
                        disabled={depositLoading || !depositAmount || parseFloat(depositAmount) <= 0}
                        className="w-full px-4 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg transition-colors text-white font-medium"
                      >
                        {depositLoading ? 'Processing...' : `Deposit XAF ${depositAmount || '0.00'}`}
                      </button>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="text-gray-400">Please select a user to deposit funds</div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* Deposit Verification Tab */}
          {activeTab === 'deposit-verification' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold">Deposit Verification</h2>
                <div className="text-sm text-gray-400">
                  {pendingDeposits.length} pending deposits
                </div>
              </div>

              {pendingDeposits.length === 0 ? (
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-12 border border-white/20 text-center">
                  <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No Pending Deposits</h3>
                  <p className="text-gray-400">All deposits have been processed.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Pending Deposits List */}
                  <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
                    <h3 className="text-xl font-semibold mb-4">Pending Deposits</h3>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {pendingDeposits.map((deposit) => (
                        <div
                          key={deposit._id}
                          onClick={() => setSelectedDeposit(deposit)}
                          className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                            selectedDeposit?._id === deposit._id
                              ? 'bg-purple-500/20 border-purple-500/50'
                              : 'bg-white/5 border-white/10 hover:bg-white/10'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-3">
                              <div className="font-medium">XAF {deposit.amount.toLocaleString()}</div>
                              <div className="bg-purple-500/20 text-purple-400 px-2 py-1 rounded text-xs font-mono">
                                {deposit.userInfo?.uniqueId || 'N/A'}
                              </div>
                            </div>
                            <div className="text-xs text-gray-400">
                              {new Date(deposit.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                          <div className="text-sm text-gray-300">
                            {deposit.userInfo?.fullName || 'Unknown User'} • {deposit.method}
                          </div>
                          <div className="text-xs text-gray-400 mt-1">
                            Payment ID: {deposit.paymentId}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Deposit Details */}
                  <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
                    <h3 className="text-xl font-semibold mb-4">Deposit Details</h3>
                    {selectedDeposit ? (
                      <div className="space-y-4">
                        {/* User Information */}
                        <div>
                          <h4 className="text-sm font-medium text-gray-400 mb-2">User Information</h4>
                          <div className="bg-white/5 rounded-lg p-3">
                            <div className="flex items-center justify-between mb-2">
                              <div className="font-medium">{selectedDeposit.userInfo?.fullName || 'Unknown'}</div>
                              <div className="bg-purple-500/20 text-purple-400 px-2 py-1 rounded text-sm font-mono">
                                {selectedDeposit.userInfo?.uniqueId || 'N/A'}
                              </div>
                            </div>
                            <div className="text-sm text-gray-300">{selectedDeposit.userInfo?.email}</div>
                            <div className="text-sm text-gray-400">@{selectedDeposit.userInfo?.username}</div>
                          </div>
                        </div>

                        {/* Deposit Information */}
                        <div>
                          <h4 className="text-sm font-medium text-gray-400 mb-2">Deposit Information</h4>
                          <div className="bg-white/5 rounded-lg p-3 space-y-2">
                            <div className="flex justify-between">
                              <span className="text-gray-300">Amount:</span>
                              <span className="font-medium">XAF {selectedDeposit.amount.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-300">Method:</span>
                              <span className="font-medium">{selectedDeposit.method}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-300">Payment ID:</span>
                              <span className="font-medium text-sm">{selectedDeposit.paymentId}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-300">Date:</span>
                              <span className="font-medium">
                                {new Date(selectedDeposit.createdAt).toLocaleString()}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Screenshot Preview */}
                        <div>
                          <h4 className="text-sm font-medium text-gray-400 mb-2">Payment Screenshot</h4>
                          <div className="bg-white/5 rounded-lg p-3">
                            {selectedDeposit.screenshot ? (
                              <img
                                src={`data:${selectedDeposit.screenshot.contentType};base64,${selectedDeposit.screenshot.data}`}
                                alt="Payment Screenshot"
                                className="max-w-full rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                                onClick={() => {
                                  const newWindow = window.open('', '_blank')
                                  newWindow.document.write(`
                                    <html>
                                      <body style="margin:0;padding:20px;background:#1a1a1a;">
                                        <img src="data:${selectedDeposit.screenshot.contentType};base64,${selectedDeposit.screenshot.data}" 
                                             style="max-width:100%;height:auto;" />
                                      </body>
                                    </html>
                                  `)
                                }}
                              />
                            ) : (
                              <div className="text-center text-gray-400 py-8">
                                <FileText className="w-12 h-12 mx-auto mb-2" />
                                <p>No screenshot available</p>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex space-x-3 pt-4">
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleDepositAction(selectedDeposit._id, 'approve')}
                            className="flex-1 py-3 px-4 bg-green-600 hover:bg-green-700 rounded-lg font-semibold transition-colors flex items-center justify-center space-x-2"
                          >
                            <CheckCircle className="w-5 h-5" />
                            <span>Approve</span>
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleDepositAction(selectedDeposit._id, 'reject')}
                            className="flex-1 py-3 px-4 bg-red-600 hover:bg-red-700 rounded-lg font-semibold transition-colors flex items-center justify-center space-x-2"
                          >
                            <X className="w-5 h-5" />
                            <span>Reject</span>
                          </motion.button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center text-gray-400 py-12">
                        <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
                        <p>Select a deposit to view details</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* Messages Tab */}
          {activeTab === 'messages' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold">Contact Messages</h2>
              </div>

              {/* Date Filter */}
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-400">Filter by date:</span>
                  </div>
                  
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setMessageDateFilter('all')}
                      className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                        messageDateFilter === 'all' 
                          ? 'bg-purple-600 text-white' 
                          : 'bg-white/10 text-gray-400 hover:bg-white/20'
                      }`}
                    >
                      All
                    </button>
                    <button
                      onClick={() => setMessageDateFilter('today')}
                      className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                        messageDateFilter === 'today' 
                          ? 'bg-purple-600 text-white' 
                          : 'bg-white/10 text-gray-400 hover:bg-white/20'
                      }`}
                    >
                      Today
                    </button>
                    <button
                      onClick={() => setMessageDateFilter('yesterday')}
                      className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                        messageDateFilter === 'yesterday' 
                          ? 'bg-purple-600 text-white' 
                          : 'bg-white/10 text-gray-400 hover:bg-white/20'
                      }`}
                    >
                      Yesterday
                    </button>
                    <button
                      onClick={() => setMessageDateFilter('custom')}
                      className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                        messageDateFilter === 'custom' 
                          ? 'bg-purple-600 text-white' 
                          : 'bg-white/10 text-gray-400 hover:bg-white/20'
                      }`}
                    >
                      Custom
                    </button>
                  </div>

                  {messageDateFilter === 'custom' && (
                    <div className="flex items-center space-x-2">
                      <input
                        type="date"
                        value={customStartDate}
                        onChange={(e) => setCustomStartDate(e.target.value)}
                        className="px-3 py-1 bg-white/10 border border-white/20 rounded-lg text-sm text-white focus:outline-none focus:border-purple-500"
                        placeholder="Start date"
                      />
                      <span className="text-gray-400">to</span>
                      <input
                        type="date"
                        value={customEndDate}
                        onChange={(e) => setCustomEndDate(e.target.value)}
                        className="px-3 py-1 bg-white/10 border border-white/20 rounded-lg text-sm text-white focus:outline-none focus:border-purple-500"
                        placeholder="End date"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="grid gap-4">
                {filteredMessages.map((message) => (
                  <motion.div
                    key={message._id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-xl font-semibold">{message.subject}</h3>
                          {message.userId && (
                            <div className="bg-purple-500/20 text-purple-400 px-2 py-1 rounded text-xs font-mono">
                              User ID: {message.userId}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center space-x-4 text-gray-400">
                          <p>{message.email}</p>
                          {message.userName && (
                            <p className="text-sm">From: {message.userName}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-3 py-1 rounded-full text-sm ${
                          message.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                          message.status === 'in-progress' ? 'bg-blue-500/20 text-blue-400' :
                          'bg-green-500/20 text-green-400'
                        }`}>
                          {message.status}
                        </span>
                        <button
                          onClick={() => setSelectedMessage(message)}
                          className="p-2 bg-purple-500/20 hover:bg-purple-500/30 rounded-lg transition-colors"
                          aria-label={`View message details for ${message.subject}`}
                          title={`View message details for ${message.subject}`}
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    
                    {/* Status Update Buttons */}
                    <div className="flex space-x-2 mb-4">
                      {message.status !== 'pending' && (
                        <button
                          onClick={() => handleMessageStatusUpdate(message._id, 'pending')}
                          className="px-3 py-1 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 rounded-lg text-sm transition-colors flex items-center space-x-1"
                        >
                          <Clock className="w-3 h-3" />
                          <span>Mark as Pending</span>
                        </button>
                      )}
                      {message.status !== 'in-progress' && (
                        <button
                          onClick={() => handleMessageStatusUpdate(message._id, 'in-progress')}
                          className="px-3 py-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg text-sm transition-colors flex items-center space-x-1"
                        >
                          <AlertCircle className="w-3 h-3" />
                          <span>Mark as In Progress</span>
                        </button>
                      )}
                      {message.status !== 'resolved' && (
                        <button
                          onClick={() => handleMessageStatusUpdate(message._id, 'resolved')}
                          className="px-3 py-1 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg text-sm transition-colors flex items-center space-x-1"
                        >
                          <CheckCircle className="w-3 h-3" />
                          <span>Mark as Resolved</span>
                        </button>
                      )}
                    </div>
                    <div className="bg-black/20 rounded-lg p-4 mb-4">
                      <p className="text-gray-300 whitespace-pre-wrap">{message.message}</p>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-gray-500">
                        Received: {new Date(message.createdAt).toLocaleString()}
                      </p>
                      {message.adminResponseDate && (
                        <p className="text-sm text-gray-500">
                          Responded: {new Date(message.adminResponseDate).toLocaleString()}
                        </p>
                      )}
                    </div>
                    
                    {/* Admin Response Display (View Only) */}
                    {message.adminResponse && (
                      <div className="border-t border-white/10 pt-4 mt-4">
                        <div className="bg-purple-500/10 rounded-lg p-4">
                          <div className="flex items-center space-x-2 mb-2">
                            <Shield className="w-4 h-4 text-purple-400" />
                            <span className="text-sm font-medium text-purple-400">Admin Response</span>
                          </div>
                          <p className="text-gray-300">{message.adminResponse}</p>
                        </div>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Withdrawals Tab */}
          {activeTab === 'withdrawals' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold">Withdrawal Management</h2>
                <div className="text-sm text-gray-400">
                  {withdrawals.filter(w => w.status === 'pending').length} pending withdrawals
                </div>
              </div>

              {withdrawals.length === 0 ? (
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-12 border border-white/20 text-center">
                  <ArrowUpLeft className="w-16 h-16 text-blue-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No Withdrawal Requests</h3>
                  <p className="text-gray-400">No withdrawal requests have been made yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Withdrawals List */}
                  <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
                    <h3 className="text-xl font-semibold mb-4">All Withdrawals</h3>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {withdrawals.map((withdrawal) => (
                        <div
                          key={withdrawal._id}
                          onClick={() => setSelectedWithdrawal(withdrawal)}
                          className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                            selectedWithdrawal?._id === withdrawal._id
                              ? 'bg-purple-500/20 border-purple-500/50'
                              : 'bg-white/5 border-white/10 hover:bg-white/10'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-3">
                              <div className="font-medium">XAF {withdrawal.amount.toLocaleString()}</div>
                              <div className={`px-2 py-1 rounded text-xs font-mono ${
                                withdrawal.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                                withdrawal.status === 'approved' ? 'bg-green-500/20 text-green-400' :
                                'bg-red-500/20 text-red-400'
                              }`}>
                                {withdrawal.status}
                              </div>
                            </div>
                            <div className="text-xs text-gray-400">
                              {new Date(withdrawal.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                          <div className="text-sm text-gray-300">
                            {withdrawal.userInfo?.fullName || 'Unknown User'} • {withdrawal.method}
                          </div>
                          <div className="text-xs text-gray-400 mt-1">
                            Ref: {withdrawal.referenceId}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Withdrawal Details */}
                  {selectedWithdrawal && (
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20"
                    >
                      <h3 className="text-xl font-semibold mb-4">Withdrawal Details</h3>
                      
                      <div className="space-y-4">
                        <div>
                          <p className="text-sm text-gray-400">Reference ID</p>
                          <p className="font-medium font-mono">{selectedWithdrawal.referenceId}</p>
                        </div>
                        
                        <div>
                          <p className="text-sm text-gray-400">Amount</p>
                          <p className="text-2xl font-bold text-blue-400">XAF {selectedWithdrawal.amount.toLocaleString()}</p>
                        </div>
                        
                        <div>
                          <p className="text-sm text-gray-400">User</p>
                          <p className="font-medium">{selectedWithdrawal.userInfo?.fullName || 'Unknown User'}</p>
                          <p className="text-sm text-gray-400">{selectedWithdrawal.userInfo?.email || 'N/A'}</p>
                          <p className="text-xs text-gray-500">ID: {selectedWithdrawal.userInfo?.uniqueId || 'N/A'}</p>
                        </div>
                        
                        <div>
                          <p className="text-sm text-gray-400">Payment Method</p>
                          <p className="font-medium">{selectedWithdrawal.method}</p>
                        </div>
                        
                        <div>
                          <p className="text-sm text-gray-400">Account Details</p>
                          <p className="font-medium">{selectedWithdrawal.accountName}</p>
                          <p className="text-sm text-gray-400">{selectedWithdrawal.phoneNumber}</p>
                          <p className="text-sm text-gray-400">Provider: {selectedWithdrawal.provider}</p>
                        </div>
                        
                        <div>
                          <p className="text-sm text-gray-400">Status</p>
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                            selectedWithdrawal.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                            selectedWithdrawal.status === 'approved' ? 'bg-green-500/20 text-green-400' :
                            'bg-red-500/20 text-red-400'
                          }`}>
                            {selectedWithdrawal.status}
                          </span>
                        </div>
                        
                        <div>
                          <p className="text-sm text-gray-400">Requested</p>
                          <p className="font-medium">{new Date(selectedWithdrawal.createdAt).toLocaleString()}</p>
                        </div>
                        
                        {selectedWithdrawal.processedAt && (
                          <div>
                            <p className="text-sm text-gray-400">Processed</p>
                            <p className="font-medium">{new Date(selectedWithdrawal.processedAt).toLocaleString()}</p>
                          </div>
                        )}

                        {selectedWithdrawal.status === 'pending' && (
                          <>
                            <div>
                              <p className="text-sm text-gray-400 mb-2">Admin Note (optional)</p>
                              <textarea
                                value={adminNote}
                                onChange={(e) => setAdminNote(e.target.value)}
                                placeholder="Add a note for the user..."
                                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none resize-none"
                                rows={3}
                              />
                            </div>
                            
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleWithdrawalAction(selectedWithdrawal._id, 'approve')}
                                disabled={withdrawalLoading}
                                className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-800/50 disabled:cursor-not-allowed rounded-lg transition-colors flex items-center justify-center space-x-2"
                              >
                                <CheckCircle className="w-4 h-4" />
                                <span>Approve</span>
                              </button>
                              <button
                                onClick={() => handleWithdrawalAction(selectedWithdrawal._id, 'reject')}
                                disabled={withdrawalLoading}
                                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-800/50 disabled:cursor-not-allowed rounded-lg transition-colors flex items-center justify-center space-x-2"
                              >
                                <X className="w-4 h-4" />
                                <span>Reject</span>
                              </button>
                            </div>
                          </>
                        )}

                        {/* Delete button for all withdrawal statuses */}
                        <div className="pt-4 border-t border-white/10">
                          <button
                            onClick={() => handleDeleteWithdrawal(selectedWithdrawal._id)}
                            disabled={withdrawalLoading}
                            className="w-full px-4 py-2 bg-red-600/20 hover:bg-red-600/30 disabled:bg-red-800/20 disabled:cursor-not-allowed border border-red-600/50 hover:border-red-600/70 rounded-lg transition-colors flex items-center justify-center space-x-2 text-red-400"
                          >
                            <Trash2 className="w-4 h-4" />
                            <span>Delete Withdrawal Record</span>
                          </button>
                        </div>
                        
                        {selectedWithdrawal.adminNote && (
                          <div>
                            <p className="text-sm text-gray-400">Admin Note</p>
                            <p className="text-sm text-gray-300">{selectedWithdrawal.adminNote}</p>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </div>
              )}
            </motion.div>
          )}

          {/* Chat Tab */}
          {activeTab === 'chat' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold">Live Chat</h2>
                <div className="flex items-center space-x-4">
                  <div className="text-sm text-gray-400">
                    {chatUsers.filter(u => u.isOnline).length} users online
                  </div>
                  <button
                    onClick={handleCleanupChat}
                    className="px-4 py-2 bg-red-600/20 hover:bg-red-600/30 border border-red-600/50 hover:border-red-600/70 rounded-lg transition-colors flex items-center space-x-2 text-red-400"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Cleanup Old Messages</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Chat Users List */}
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
                  <h3 className="text-xl font-semibold mb-4">Chat Users</h3>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {chatUsers.length === 0 ? (
                      <div className="text-center text-gray-400 py-8">
                        <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>No active chats</p>
                      </div>
                    ) : (
                      chatUsers.map((user) => (
                        <div
                          key={user._id}
                          onClick={() => {
                            setSelectedChatUser(user)
                            fetchChatMessages(user._id)
                          }}
                          className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                            selectedChatUser?._id === user._id
                              ? 'bg-purple-500/20 border-purple-500/50'
                              : 'bg-white/5 border-white/10 hover:bg-white/10'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className={`w-2 h-2 rounded-full ${
                                user.isOnline ? 'bg-green-400' : 'bg-gray-400'
                              }`}></div>
                              <div>
                                <p className="font-medium">{user.fullName || 'Unknown User'}</p>
                                <p className="text-sm text-gray-400">{user.email || 'N/A'}</p>
                              </div>
                            </div>
                            {user.unreadCount && user.unreadCount > 0 && (
                              <div className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                                {user.unreadCount}
                              </div>
                            )}
                          </div>
                          {user.lastMessage && (
                            <p className="text-xs text-gray-400 mt-1">
                              Last: {new Date(user.lastMessage).toLocaleString()}
                            </p>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Chat Messages */}
                <div className="lg:col-span-2 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 flex flex-col h-[600px]">
                  {selectedChatUser ? (
                    <>
                      {/* Chat Header */}
                      <div className="p-4 border-b border-white/10">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className={`w-2 h-2 rounded-full ${
                              userTyping[selectedChatUser._id] ? 'bg-yellow-400 animate-pulse' :
                              selectedChatUser.isOnline ? 'bg-green-400' : 'bg-gray-400'
                            }`}></div>
                            <div>
                              <p className="font-medium">{selectedChatUser.fullName || 'Unknown User'}</p>
                              <p className="text-sm text-gray-400">
                                {userTyping[selectedChatUser._id] ? 'Typing...' :
                                 selectedChatUser.isOnline ? 'Online' : 'Offline'}
                              </p>
                            </div>
                          </div>
                          <div className="text-xs text-gray-400">
                            Messages auto-delete after 24 hours
                          </div>
                        </div>
                      </div>

                      {/* Messages Area */}
                      <div className="flex-1 p-4 overflow-y-auto space-y-3">
                        {chatMessages.length === 0 ? (
                          <div className="text-center text-gray-400 py-8">
                            <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                            <p>No messages yet. Start a conversation!</p>
                          </div>
                        ) : (
                          chatMessages.map((message) => (
                            <div
                              key={message._id}
                              className={`flex ${
                                message.type === 'user_message' ? 'justify-start' : 'justify-end'
                              }`}
                            >
                              <div className={`max-w-xs px-4 py-2 rounded-lg ${
                                message.type === 'user_message'
                                  ? 'bg-white/10 text-white'
                                  : 'bg-purple-500/20 text-purple-100'
                              }`}>
                                <p className="text-sm">{message.userMessage || message.adminMessage}</p>
                                <p className="text-xs text-gray-400 mt-1">
                                  {new Date(message.messageDate || message.createdAt).toLocaleTimeString()}
                                </p>
                              </div>
                            </div>
                          ))
                        )}
                      </div>

                      {/* Message Input */}
                      <div className="p-4 border-t border-white/10">
                        <div className="flex space-x-2">
                          <input
                            type="text"
                            value={chatInput}
                            onChange={(e) => handleAdminTyping(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && sendChatMessage()}
                            placeholder="Type your message..."
                            className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none"
                          />
                          <button
                            onClick={sendChatMessage}
                            disabled={!chatInput.trim()}
                            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800/50 disabled:cursor-not-allowed rounded-lg transition-colors"
                            title="Send message"
                            aria-label="Send message"
                          >
                            <Send className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="flex-1 flex items-center justify-center text-gray-400">
                      <div className="text-center">
                        <MessageCircle className="w-16 h-16 mx-auto mb-4 opacity-50" />
                        <p>Select a user to start chatting</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* Analytics Tab */}
          {activeTab === 'analytics' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <h2 className="text-3xl font-bold">Analytics & Reports</h2>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
                  <h3 className="text-xl font-semibold mb-4">User Growth</h3>
                  <div className="h-64 flex items-center justify-center text-gray-400">
                    <BarChart3 className="w-16 h-16" />
                  </div>
                </div>
                
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
                  <h3 className="text-xl font-semibold mb-4">Revenue Trends</h3>
                  <div className="h-64 flex items-center justify-center text-gray-400">
                    <TrendingUp className="w-16 h-16" />
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <h2 className="text-3xl font-bold">System Settings</h2>
              
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
                <h3 className="text-xl font-semibold mb-4">General Settings</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Email Notifications</p>
                      <p className="text-sm text-gray-400">Send email notifications to users</p>
                    </div>
                    <button 
                      className="w-12 h-6 bg-purple-600 rounded-full relative"
                      aria-label="Toggle email notifications"
                      title="Toggle email notifications"
                    >
                      <div className="w-5 h-5 bg-white rounded-full absolute right-0.5 top-0.5"></div>
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Maintenance Mode</p>
                      <p className="text-sm text-gray-400">Put site in maintenance mode</p>
                    </div>
                    <button 
                      className="w-12 h-6 bg-gray-600 rounded-full relative"
                      aria-label="Toggle maintenance mode"
                      title="Toggle maintenance mode"
                    >
                      <div className="w-5 h-5 bg-white rounded-full absolute left-0.5 top-0.5"></div>
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Investment News Tab */}
          {activeTab === 'investment-news' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold">Investment News Management</h2>
                <button
                  onClick={() => {
                    setEditingNews(null)
                    setNewsForm({ title: '', content: '', category: 'general', importance: 'normal' })
                    setShowNewsForm(true)
                  }}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors flex items-center space-x-2"
                >
                  <FileText className="w-4 h-4" />
                  <span>Create News</span>
                </button>
              </div>

              {/* News Form Modal */}
              {showNewsForm && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
                  onClick={() => setShowNewsForm(false)}
                >
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-white/10 backdrop-blur-md rounded-2xl p-6 max-w-2xl w-full border border-white/20"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-bold">
                        {editingNews ? 'Edit News Article' : 'Create News Article'}
                      </h3>
                      <button
                        onClick={() => setShowNewsForm(false)}
                        className="p-2 rounded-lg bg-white/10 hover:bg-white/20"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Title</label>
                        <input
                          type="text"
                          value={newsForm.title}
                          onChange={(e) => setNewsForm({ ...newsForm, title: e.target.value })}
                          className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:border-purple-400 text-white"
                          placeholder="Enter news title"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">Content</label>
                        <textarea
                          value={newsForm.content}
                          onChange={(e) => setNewsForm({ ...newsForm, content: e.target.value })}
                          className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:border-purple-400 text-white h-32 resize-none"
                          placeholder="Enter news content"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-2">Category</label>
                          <select
                            value={newsForm.category}
                            onChange={(e) => setNewsForm({ ...newsForm, category: e.target.value })}
                            className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:border-purple-400 text-white"
                          >
                            <option value="general">General</option>
                            <option value="markets">Markets</option>
                            <option value="opportunities">Opportunities</option>
                            <option value="analysis">Analysis</option>
                            <option value="alerts">Alerts</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-2">Importance</label>
                          <select
                            value={newsForm.importance}
                            onChange={(e) => setNewsForm({ ...newsForm, importance: e.target.value })}
                            className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:border-purple-400 text-white"
                          >
                            <option value="low">Low</option>
                            <option value="normal">Normal</option>
                            <option value="high">High</option>
                          </select>
                        </div>
                      </div>

                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => setShowNewsForm(false)}
                          className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={editingNews ? handleUpdateNews : handleCreateNews}
                          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
                        >
                          {editingNews ? 'Update' : 'Create'}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              )}

              {/* News List */}
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
                <h3 className="text-xl font-semibold mb-4">Published News Articles</h3>
                <div className="space-y-4">
                  {investmentNews.length === 0 ? (
                    <div className="text-center text-gray-400 py-8">
                      <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>No news articles found</p>
                    </div>
                  ) : (
                    investmentNews.map((article) => (
                      <motion.div
                        key={article._id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="bg-white/5 rounded-lg p-4 border border-white/10"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <h4 className="font-semibold text-white">{article.title}</h4>
                              <span className={`px-2 py-1 rounded-full text-xs ${
                                article.importance === 'high' ? 'bg-red-500/20 text-red-400' :
                                article.importance === 'normal' ? 'bg-blue-500/20 text-blue-400' :
                                'bg-gray-500/20 text-gray-400'
                              }`}>
                                {article.importance}
                              </span>
                              <span className="px-2 py-1 rounded-full text-xs bg-purple-500/20 text-purple-400">
                                {article.category}
                              </span>
                            </div>
                            <p className="text-gray-300 text-sm mb-2 line-clamp-2">{article.content}</p>
                            <p className="text-xs text-gray-400">
                              Created: {new Date(article.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex space-x-2 ml-4">
                            <button
                              onClick={() => handleEditNews(article)}
                              className="p-2 bg-blue-600/20 hover:bg-blue-600/30 rounded-lg transition-colors"
                              title="Edit news"
                            >
                              <FileText className="w-4 h-4 text-blue-400" />
                            </button>
                            <button
                              onClick={() => handleDeleteNews(article._id)}
                              className="p-2 bg-red-600/20 hover:bg-red-600/30 rounded-lg transition-colors"
                              title="Delete news"
                            >
                              <Trash2 className="w-4 h-4 text-red-400" />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </main>
      </div>

      {/* User Detail Modal */}
      {selectedUser && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedUser(null)}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white/10 backdrop-blur-md rounded-2xl p-6 max-w-md w-full border border-white/20"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">User Details</h3>
              <button
                onClick={() => setSelectedUser(null)}
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20"
                aria-label="Close user details"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-400">Name</p>
                <p className="font-medium">{selectedUser.fullName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Email</p>
                <p className="font-medium">{selectedUser.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Username</p>
                <p className="font-medium">@{selectedUser.username}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Status</p>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  selectedUser.status === 'active' ? 'bg-green-500/20 text-green-400' :
                  selectedUser.status === 'inactive' ? 'bg-gray-500/20 text-gray-400' :
                  'bg-red-500/20 text-red-400'
                }`}>
                  {selectedUser.status}
                </span>
              </div>
              <div>
                <p className="text-sm text-gray-400">Joined</p>
                <p className="font-medium">{new Date(selectedUser.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Message Detail Modal */}
      {selectedMessage && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedMessage(null)}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white/10 backdrop-blur-md rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto border border-white/20"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">{selectedMessage.subject}</h3>
              <button
                onClick={() => setSelectedMessage(null)}
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20"
                aria-label="Close message details"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="space-y-4 mb-6">
              <div>
                <p className="text-sm text-gray-400">From</p>
                <p className="font-medium">{selectedMessage.email}</p>
                {selectedMessage.userName && (
                  <p className="text-sm text-gray-500">{selectedMessage.userName}</p>
                )}
              </div>
              <div>
                <p className="text-sm text-gray-400">Status</p>
                <span className={`px-3 py-1 rounded-full text-sm ${
                  selectedMessage.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                  selectedMessage.status === 'in-progress' ? 'bg-blue-500/20 text-blue-400' :
                  'bg-green-500/20 text-green-400'
                }`}>
                  {selectedMessage.status}
                </span>
              </div>
              <div>
                <p className="text-sm text-gray-400">Message</p>
                <p className="text-white/90 whitespace-pre-wrap">{selectedMessage.message}</p>
              </div>
            </div>
            
            <div className="flex space-x-2">
              <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors">
                Mark In Progress
              </button>
              <button className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors">
                Mark Resolved
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  )
}
