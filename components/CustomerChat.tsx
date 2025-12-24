import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageCircle, X, Send, User, Bot } from 'lucide-react'
import { getAuth } from 'firebase/auth'
import { useSocket } from '../hooks/useSocket'
import styles from './CustomerChat.module.css'

interface Message {
  id: string
  text: string
  sender: 'user' | 'support'
  timestamp: Date
  isUnread?: boolean
  messageId?: string
}

export default function CustomerChat() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [hasStartedChat, setHasStartedChat] = useState(false)
  const [adminTyping, setAdminTyping] = useState(false)
  
  const socket = useSocket()
  const [currentUserId, setCurrentUserId] = useState<string>('')

  // Join user room when socket connects and user is authenticated
  useEffect(() => {
    if (socket.connected && !currentUserId) {
      const auth = getAuth()
      const user = auth.currentUser
      if (user) {
        setCurrentUserId(user.uid)
        socket.joinUserRoom(user.uid)
        
        // Set up WebSocket event listeners
        socket.onNewAdminMessage((data) => {
          console.log('Received admin message via WebSocket:', data)
          const adminMessage: Message = {
            id: Date.now().toString(),
            text: data.message,
            sender: 'support',
            timestamp: new Date(data.timestamp)
          }
          setMessages(prev => [...prev, adminMessage])
        })

        socket.onAdminTyping((data) => {
          setAdminTyping(data.isTyping)
        })

        socket.onMessageSent((data) => {
          if (!data.success) {
            console.error('Failed to send message:', data.error)
          }
        })
      }
    }
  }, [socket.connected, currentUserId])

  // Remove automatic welcome message - will only show when user sends first message
  useEffect(() => {
    if (isOpen && !hasStartedChat) {
      setHasStartedChat(true)
      fetchChatMessages() // Fetch existing messages when chat opens
    }
  }, [isOpen, hasStartedChat])

  // Also fetch messages periodically to check for new admin responses
  useEffect(() => {
    if (!isOpen) return
    
    const interval = setInterval(() => {
      fetchChatMessages()
    }, 10000) // Check for new messages every 10 seconds when chat is open
    
    return () => clearInterval(interval)
  }, [isOpen])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSendMessage = async () => {
    if (inputMessage.trim() === '') return

    // Add welcome message if this is the first user message and no messages exist yet
    if (messages.length === 0) {
      const welcomeMessage: Message = {
        id: 'welcome-' + Date.now().toString(),
        text: 'Hello! Welcome to ProfitWave Customer Support. Thank you for reaching out to us. A support representative will be with you shortly to assist you with any questions or concerns you may have.',
        sender: 'support',
        timestamp: new Date()
      }
      setMessages([welcomeMessage])
    }

    const userMessage: Message = {
      id: 'temp-' + Date.now().toString(), // Use temp prefix to identify temporary messages
      text: inputMessage,
      sender: 'user',
      timestamp: new Date()
    }

    // Add message to local state immediately for better UX
    setMessages(prev => [...prev, userMessage])
    const messageToSend = inputMessage
    setInputMessage('')
    setIsTyping(true)

    try {
      // Send message via WebSocket for real-time delivery
      if (socket.connected && currentUserId) {
        socket.sendUserMessage(currentUserId, messageToSend)
        console.log('Message sent via WebSocket:', { userId: currentUserId, message: messageToSend })
      } else {
        // Fallback to HTTP API if WebSocket is not connected
        const auth = getAuth()
        const user = auth.currentUser
        if (!user) {
          console.error('No user found for sending message')
          return
        }

        console.log('Sending user message via HTTP API:', { userId: user.uid, message: messageToSend })

        const response = await fetch('/api/user/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            userId: user.uid,
            message: messageToSend
          })
        })

        if (response.ok) {
          console.log('User message sent successfully via HTTP')
          // Refresh messages to get the proper database ID
          setTimeout(() => {
            fetchChatMessages()
          }, 1000)
        } else {
          console.error('Failed to send user message via HTTP:', response.status)
        }
      }
    } catch (error) {
      console.error('Error sending user message:', error)
    } finally {
      setIsTyping(false)
    }
  }

  const handleTyping = (value: string) => {
    setInputMessage(value)
    
    // Send typing indicator to admin
    if (socket.connected && currentUserId) {
      const isTyping = value.trim().length > 0
      socket.sendTyping(currentUserId, isTyping)
    }
  }

  const fetchChatMessages = async () => {
    try {
      const auth = getAuth()
      const user = auth.currentUser
      if (!user) {
        console.log('No user found for fetching chat messages')
        return
      }
      
      console.log('Fetching chat messages for user:', user.uid)
      const response = await fetch(`/api/user/chat?userId=${user.uid}`)
      if (response.ok) {
        const data = await response.json()
        console.log('Chat messages fetched:', data)
        const chatMessages: Message[] = data.messages.map((msg: any) => ({
          id: msg._id,
          text: msg.adminMessage || msg.userMessage,
          sender: msg.type === 'admin_response' ? 'support' : 'user',
          timestamp: new Date(msg.messageDate),
          isUnread: !msg.read,
          messageId: msg._id
        }))
        
        console.log('Processed chat messages:', chatMessages)
        
        // Merge new messages with existing ones, avoiding duplicates
        setMessages(prev => {
          // Filter out any welcome messages that were added locally (they start with 'welcome-')
          const filteredPrev = prev.filter(msg => {
            // Remove temporary messages that match the content and timestamp of database messages
            if (msg.id.startsWith('temp-') && msg.sender === 'user') {
              // Check if there's a matching message in the database
              const matchingDbMessage = chatMessages.find(dbMsg => 
                dbMsg.sender === 'user' && 
                dbMsg.text === msg.text &&
                Math.abs(dbMsg.timestamp.getTime() - msg.timestamp.getTime()) < 5000 // Within 5 seconds
              )
              return !matchingDbMessage // Remove the temp message if there's a matching DB message
            }
            // Keep welcome messages only if there are no database messages yet (first time user)
            if (msg.id.startsWith('welcome-') && chatMessages.length > 0) {
              return false // Remove welcome message if there are actual database messages
            }
            return true // Keep all other messages
          })
          
          const existingIds = new Set(filteredPrev.map(m => m.id))
          const newMessages = chatMessages.filter(msg => !existingIds.has(msg.id))
          
          console.log('New messages to add:', newMessages)
          
          // Sort all messages by timestamp
          const allMessages = [...filteredPrev, ...newMessages].sort((a, b) => 
            a.timestamp.getTime() - b.timestamp.getTime()
          )
          
          console.log('All messages after merge:', allMessages)
          return allMessages
        })
        
        // Mark admin messages as read
        const unreadAdminMessages = chatMessages.filter(msg => msg.sender === 'support' && msg.isUnread)
        if (unreadAdminMessages.length > 0) {
          console.log('Marking messages as read:', unreadAdminMessages)
          markMessagesAsRead(unreadAdminMessages.map(msg => msg.messageId).filter(Boolean))
        }
      } else {
        console.error('Failed to fetch chat messages:', response.status)
      }
    } catch (error) {
      console.error('Error fetching chat messages:', error)
    }
  }

  const markMessagesAsRead = async (messageIds: string[]) => {
    try {
      const auth = getAuth()
      const user = auth.currentUser
      if (!user) return
      
      for (const messageId of messageIds) {
        await fetch('/api/user/chat', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            userId: user.uid,
            messageId
          })
        })
      }
      
      // Notify dashboard to refresh unread count
      window.dispatchEvent(new CustomEvent('messagesRead'))
    } catch (error) {
      console.error('Error marking messages as read:', error)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <>
      {/* Chat Button */}
      <motion.button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-purple-500 hover:bg-purple-600 text-white rounded-full shadow-lg flex items-center justify-center z-40"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        data-chat-trigger="true"
      >
        <MessageCircle className="w-6 h-6" />
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-24 right-6 w-96 h-[500px] bg-white rounded-2xl shadow-2xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-4 rounded-t-2xl flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <Bot className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold">Customer Support</h3>
                  <p className="text-xs opacity-90">We typically reply within minutes</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
                title="Close chat"
                aria-label="Close chat"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
              {messages.length === 0 && (
                <div className="flex items-center justify-center h-full text-gray-400">
                  <p>Start a conversation with our support team</p>
                </div>
              )}
              
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex items-start space-x-2 max-w-[80%] ${message.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      message.sender === 'user' ? 'bg-purple-500' : 'bg-gray-300'
                    }`}>
                      {message.sender === 'user' ? (
                        <User className="w-5 h-5 text-white" />
                      ) : (
                        <Bot className="w-5 h-5 text-gray-600" />
                      )}
                    </div>
                    <div className={`rounded-2xl px-4 py-2 ${
                      message.sender === 'user' 
                        ? 'bg-purple-500 text-white' 
                        : 'bg-white text-gray-800 border border-gray-200'
                    }`}>
                      <p className="text-sm">{message.text}</p>
                      <p className={`text-xs mt-1 ${
                        message.sender === 'user' ? 'text-purple-100' : 'text-gray-500'
                      }`}>
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}

              {adminTyping && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-start"
                >
                  <div className="flex items-start space-x-2">
                    <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center">
                      <Bot className="w-5 h-5 text-white" />
                    </div>
                    <div className="bg-purple-500 text-white rounded-2xl px-4 py-2">
                      <div className={styles.typingDots}>
                        <div className={`${styles.typingDot} ${styles.typingDot1}`}></div>
                        <div className={`${styles.typingDot} ${styles.typingDot2}`}></div>
                        <div className={`${styles.typingDot} ${styles.typingDot3}`}></div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {isTyping && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-start"
                >
                  <div className="flex items-start space-x-2">
                    <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
                      <Bot className="w-5 h-5 text-gray-600" />
                    </div>
                    <div className="bg-white text-gray-800 border border-gray-200 rounded-2xl px-4 py-2">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className={`w-2 h-2 bg-gray-400 rounded-full animate-bounce ${styles.animateDelay100}`}></div>
                        <div className={`w-2 h-2 bg-gray-400 rounded-full animate-bounce ${styles.animateDelay200}`}></div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 bg-white border-t border-gray-200 rounded-b-2xl">
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => handleTyping(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:border-purple-500 text-sm"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={inputMessage.trim() === ''}
                  className="w-10 h-10 bg-purple-500 hover:bg-purple-600 disabled:bg-gray-300 text-white rounded-full flex items-center justify-center transition-colors"
                  title="Send message"
                  aria-label="Send message"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
