import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, Mail, MessageSquare, Clock, CheckCircle, AlertCircle, X } from 'lucide-react'
import Link from 'next/link'

interface ContactMessage {
  id: string
  email: string
  subject: string
  message: string
  messagePreview: string
  status: 'pending' | 'in-progress' | 'resolved'
  createdAt: string
  updatedAt: string
  userId?: string
  userName?: string
}

export default function ContactMessagesPage() {
  const [messages, setMessages] = useState<ContactMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null)
  const [filter, setFilter] = useState<'all' | 'pending' | 'in-progress' | 'resolved'>('all')
  const [updating, setUpdating] = useState<string | null>(null)

  useEffect(() => {
    fetchMessages()
  }, [filter])

  const fetchMessages = async () => {
    try {
      setLoading(true)
      const queryParams = filter !== 'all' ? `?status=${filter}` : ''
      const response = await fetch(`/api/contact${queryParams}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch messages')
      }
      
      const data = await response.json()
      setMessages(data.messages || [])
    } catch (error) {
      console.error('Error fetching messages:', error)
      setError('Failed to load messages')
    } finally {
      setLoading(false)
    }
  }

  const updateMessageStatus = async (messageId: string, newStatus: 'pending' | 'in-progress' | 'resolved') => {
    try {
      setUpdating(messageId)
      const response = await fetch('/api/contact', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messageId,
          status: newStatus
        })
      })
      
      if (!response.ok) {
        throw new Error('Failed to update message status')
      }
      
      await fetchMessages()
      
      if (selectedMessage && selectedMessage.id === messageId) {
        setSelectedMessage({
          ...selectedMessage,
          status: newStatus,
          updatedAt: new Date().toISOString()
        })
      }
    } catch (error) {
      console.error('Error updating message:', error)
      alert('Failed to update message status')
    } finally {
      setUpdating(null)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50'
      case 'in-progress':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/50'
      case 'resolved':
        return 'bg-green-500/20 text-green-400 border-green-500/50'
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/50'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4" />
      case 'in-progress':
        return <AlertCircle className="w-4 h-4" />
      case 'resolved':
        return <CheckCircle className="w-4 h-4" />
      default:
        return <Mail className="w-4 h-4" />
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-2xl">Loading messages...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-xl text-center">
          <p className="mb-4">{error}</p>
          <button 
            onClick={fetchMessages}
            className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white p-4">
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex items-center justify-between mb-6">
          <Link href="/dashboard">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors flex items-center space-x-2"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Dashboard</span>
            </motion.button>
          </Link>
          <h1 className="text-3xl font-bold">Contact Messages</h1>
          <div className="text-white/60">
            {messages.length} message{messages.length !== 1 ? 's' : ''}
          </div>
        </div>

        <div className="flex space-x-2 mb-6">
          {(['all', 'pending', 'in-progress', 'resolved'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filter === status
                  ? 'bg-purple-600 text-white'
                  : 'bg-white/10 text-white/70 hover:bg-white/20'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ')}
              {status !== 'all' && (
                <span className="ml-2 bg-white/20 px-2 py-1 rounded-full text-xs">
                  {messages.filter(m => m.status === status).length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto">
        {messages.length === 0 ? (
          <div className="text-center py-12">
            <Mail className="w-16 h-16 text-white/30 mx-auto mb-4" />
            <p className="text-white/60 text-lg">No messages found</p>
            <p className="text-white/40">
              {filter === 'all' 
                ? 'No contact messages have been received yet.' 
                : `No messages with status "${filter}" found.`
              }
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <Mail className="w-5 h-5 text-white/60" />
                      <span className="font-medium">{message.email}</span>
                      {message.userName && (
                        <span className="text-white/60">({message.userName})</span>
                      )}
                    </div>
                    <h3 className="text-xl font-semibold mb-2">{message.subject}</h3>
                    <p className="text-white/80 line-clamp-2">{message.messagePreview}</p>
                  </div>
                  
                  <div className="flex flex-col items-end space-y-2 ml-4">
                    <div className={`px-3 py-1 rounded-full border flex items-center space-x-1 ${getStatusColor(message.status)}`}>
                      {getStatusIcon(message.status)}
                      <span className="text-sm font-medium">
                        {message.status.replace('-', ' ')}
                      </span>
                    </div>
                    <button
                      onClick={() => setSelectedMessage(message)}
                      className="text-purple-400 hover:text-purple-300 text-sm"
                    >
                      View Details
                    </button>
                  </div>
                </div>
                
                <div className="flex items-center justify-between text-sm text-white/60">
                  <span>Received: {formatDate(message.createdAt)}</span>
                  {message.updatedAt !== message.createdAt && (
                    <span>Updated: {formatDate(message.updatedAt)}</span>
                  )}
                </div>

                <div className="flex space-x-2 mt-4 pt-4 border-t border-white/10">
                  {message.status === 'pending' && (
                    <button
                      onClick={() => updateMessageStatus(message.id, 'in-progress')}
                      disabled={updating === message.id}
                      className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm disabled:opacity-50"
                    >
                      {updating === message.id ? 'Updating...' : 'Mark In Progress'}
                    </button>
                  )}
                  {message.status === 'in-progress' && (
                    <button
                      onClick={() => updateMessageStatus(message.id, 'resolved')}
                      disabled={updating === message.id}
                      className="px-3 py-1 bg-green-600 hover:bg-green-700 rounded-lg text-sm disabled:opacity-50"
                    >
                      {updating === message.id ? 'Updating...' : 'Mark Resolved'}
                    </button>
                  )}
                  {message.status === 'resolved' && (
                    <button
                      onClick={() => updateMessageStatus(message.id, 'pending')}
                      disabled={updating === message.id}
                      className="px-3 py-1 bg-yellow-600 hover:bg-yellow-700 rounded-lg text-sm disabled:opacity-50"
                    >
                      {updating === message.id ? 'Updating...' : 'Reopen'}
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

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
              <h2 className="text-2xl font-bold">{selectedMessage.subject}</h2>
              <button
                onClick={() => setSelectedMessage(null)}
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                aria-label="Close message details"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 mb-6">
              <div className="flex items-center space-x-3">
                <Mail className="w-5 h-5 text-white/60" />
                <span>{selectedMessage.email}</span>
                {selectedMessage.userName && (
                  <span className="text-white/60">({selectedMessage.userName})</span>
                )}
              </div>
              
              <div className="flex items-center space-x-3">
                <Clock className="w-5 h-5 text-white/60" />
                <span className="text-white/60">
                  Received: {formatDate(selectedMessage.createdAt)}
                </span>
              </div>

              <div className={`px-3 py-1 rounded-full border inline-flex items-center space-x-1 ${getStatusColor(selectedMessage.status)}`}>
                {getStatusIcon(selectedMessage.status)}
                <span className="text-sm font-medium">
                  {selectedMessage.status.replace('-', ' ')}
                </span>
              </div>
            </div>

            <div className="bg-white/5 rounded-lg p-4 mb-6">
              <h3 className="font-semibold mb-2">Message:</h3>
              <p className="text-white/90 whitespace-pre-wrap">{selectedMessage.message}</p>
            </div>

            <div className="flex space-x-2">
              {selectedMessage.status === 'pending' && (
                <button
                  onClick={() => updateMessageStatus(selectedMessage.id, 'in-progress')}
                  disabled={updating === selectedMessage.id}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50"
                >
                  {updating === selectedMessage.id ? 'Updating...' : 'Mark In Progress'}
                </button>
              )}
              {selectedMessage.status === 'in-progress' && (
                <button
                  onClick={() => updateMessageStatus(selectedMessage.id, 'resolved')}
                  disabled={updating === selectedMessage.id}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg disabled:opacity-50"
                >
                  {updating === selectedMessage.id ? 'Updating...' : 'Mark Resolved'}
                </button>
              )}
              {selectedMessage.status === 'resolved' && (
                <button
                  onClick={() => updateMessageStatus(selectedMessage.id, 'pending')}
                  disabled={updating === selectedMessage.id}
                  className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 rounded-lg disabled:opacity-50"
                >
                  {updating === selectedMessage.id ? 'Updating...' : 'Reopen'}
                </button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  )
}
