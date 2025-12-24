import { useEffect, useRef, useState } from 'react'
import { io, Socket } from 'socket.io-client'

interface UseSocketOptions {
  autoConnect?: boolean
}

export const useSocket = (options: UseSocketOptions = {}) => {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [connected, setConnected] = useState(false)
  const [typing, setTyping] = useState(false)
  const socketRef = useRef<Socket | null>(null)

  useEffect(() => {
    // Initialize socket connection
    const newSocket = io({
      path: '/api/socket',
      transports: ['websocket', 'polling']
    })

    newSocket.on('connect', () => {
      console.log('Socket connected:', newSocket.id)
      setConnected(true)
      setSocket(newSocket)
      socketRef.current = newSocket
    })

    newSocket.on('disconnect', () => {
      console.log('Socket disconnected')
      setConnected(false)
      setSocket(null)
      socketRef.current = null
    })

    newSocket.on('typing', (data: { isTyping: boolean }) => {
      setTyping(data.isTyping)
    })

    if (options.autoConnect !== false) {
      newSocket.connect()
    }

    return () => {
      newSocket.disconnect()
    }
  }, [])

  const joinUserRoom = (userId: string) => {
    if (socketRef.current) {
      socketRef.current.emit('join-user-room', userId)
    }
  }

  const joinAdminRoom = () => {
    if (socketRef.current) {
      socketRef.current.emit('join-admin-room')
    }
  }

  const sendUserMessage = (userId: string, message: string) => {
    if (socketRef.current) {
      socketRef.current.emit('user-message', { userId, message })
    }
  }

  const sendAdminMessage = (userId: string, message: string) => {
    if (socketRef.current) {
      socketRef.current.emit('admin-message', { userId, message })
    }
  }

  const sendTyping = (userId: string, isTyping: boolean) => {
    if (socketRef.current) {
      socketRef.current.emit('typing', { userId, isTyping })
    }
  }

  const sendAdminTyping = (userId: string, isTyping: boolean) => {
    if (socketRef.current) {
      socketRef.current.emit('admin-typing', { userId, isTyping })
    }
  }

  const onNewUserMessage = (callback: (data: any) => void) => {
    if (socketRef.current) {
      socketRef.current.on('new-user-message', callback)
    }
  }

  const onNewAdminMessage = (callback: (data: any) => void) => {
    if (socketRef.current) {
      socketRef.current.on('new-admin-message', callback)
    }
  }

  const onUserTyping = (callback: (data: any) => void) => {
    if (socketRef.current) {
      socketRef.current.on('user-typing', callback)
    }
  }

  const onAdminTyping = (callback: (data: any) => void) => {
    if (socketRef.current) {
      socketRef.current.on('admin-typing', callback)
    }
  }

  const onOnlineUsers = (callback: (users: any[]) => void) => {
    if (socketRef.current) {
      socketRef.current.on('online-users', callback)
    }
  }

  const onMessageSent = (callback: (data: any) => void) => {
    if (socketRef.current) {
      socketRef.current.on('message-sent', callback)
    }
  }

  return {
    socket: socketRef.current,
    connected,
    typing,
    joinUserRoom,
    joinAdminRoom,
    sendUserMessage,
    sendAdminMessage,
    sendTyping,
    sendAdminTyping,
    onNewUserMessage,
    onNewAdminMessage,
    onUserTyping,
    onAdminTyping,
    onOnlineUsers,
    onMessageSent
  }
}
