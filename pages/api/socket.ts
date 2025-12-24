import { NextApiRequest, NextApiResponse } from 'next'
import { MongoClient, ObjectId } from 'mongodb'
import { Server as NetServer } from 'http'
import { Server as SocketIOServer, Socket } from 'socket.io'

// Check if MongoDB URI is available
const hasMongoDB = !!process.env.MONGODB_URI && !process.env.MONGODB_URI.includes('username:password')

const uri = process.env.MONGODB_URI
const options = {}

let client: MongoClient
let clientPromise: Promise<MongoClient>

if (hasMongoDB) {
  client = new MongoClient(uri!, options)
  clientPromise = client.connect()
}

async function getChatCollection() {
  if (!hasMongoDB) return null
  
  const client = await clientPromise
  const db = client.db('profitwave')
  return db.collection('chats')
}

// Socket.IO server instance
let io: SocketIOServer

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!(res.socket as any).server.io) {
    console.log('Setting up Socket.IO server...')
    
    const httpServer: NetServer = (res.socket as any).server
    io = new SocketIOServer(httpServer, {
      path: '/api/socket',
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      }
    })

    // Store connected users
    const connectedUsers = new Map<string, string>() // userId -> socketId
    const connectedAdmins = new Set<string>()

    io.on('connection', (socket: Socket) => {
      console.log('User connected:', socket.id)

      // User joins their personal room
      socket.on('join-user-room', (userId: string) => {
        console.log('User joining room:', userId)
        socket.join(`user-${userId}`)
        connectedUsers.set(userId, socket.id)
        
        // Notify admins that user is online
        io.emit('user-online', { userId, socketId: socket.id })
      })

      // Admin joins admin room
      socket.on('join-admin-room', () => {
        console.log('Admin joining room')
        socket.join('admin-room')
        connectedAdmins.add(socket.id)
        
        // Send list of online users to admin
        const onlineUsers = Array.from(connectedUsers.entries()).map(([userId, socketId]) => ({
          userId,
          socketId
        }))
        socket.emit('online-users', onlineUsers)
      })

      // Handle user messages
      socket.on('user-message', async (data) => {
        const { userId, message } = data
        console.log('User message received:', { userId, message })

        try {
          // Save to database
          if (hasMongoDB) {
            const chatCollection = await getChatCollection()
            if (chatCollection) {
              await chatCollection.insertOne({
                userId: userId,
                userMessage: message,
                messageDate: new Date(),
                read: false,
                type: 'user_message',
                createdAt: new Date()
              })
            }
          }

          // Send to all admins
          io.to('admin-room').emit('new-user-message', {
            userId,
            message,
            timestamp: new Date(),
            type: 'user_message'
          })

          // Confirm to user
          socket.emit('message-sent', { success: true })
        } catch (error) {
          console.error('Error handling user message:', error)
          socket.emit('message-sent', { success: false, error: (error as Error).message })
        }
      })

      // Handle admin messages
      socket.on('admin-message', async (data) => {
        const { userId, message } = data
        console.log('Admin message received:', { userId, message })

        try {
          // Save to database
          if (hasMongoDB) {
            const chatCollection = await getChatCollection()
            if (chatCollection) {
              await chatCollection.insertOne({
                userId: userId,
                adminMessage: message,
                messageDate: new Date(),
                read: false,
                type: 'admin_response',
                createdAt: new Date()
              })
            }
          }

          // Send to specific user
          io.to(`user-${userId}`).emit('new-admin-message', {
            message,
            timestamp: new Date(),
            type: 'admin_response'
          })

          // Confirm to admin
          socket.emit('message-sent', { success: true })
        } catch (error) {
          console.error('Error handling admin message:', error)
          socket.emit('message-sent', { success: false, error: (error as Error).message })
        }
      })

      // Handle typing indicators
      socket.on('typing', (data) => {
        const { userId, isTyping } = data
        
        if (isTyping) {
          // Notify admins that user is typing
          io.to('admin-room').emit('user-typing', { userId, isTyping: true })
        } else {
          io.to('admin-room').emit('user-typing', { userId, isTyping: false })
        }
      })

      socket.on('admin-typing', (data) => {
        const { userId, isTyping } = data
        
        if (isTyping) {
          // Notify user that admin is typing
          io.to(`user-${userId}`).emit('admin-typing', { isTyping: true })
        } else {
          io.to(`user-${userId}`).emit('admin-typing', { isTyping: false })
        }
      })

      // Handle disconnection
      socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id)
        
        // Remove from connected users
        for (const [userId, socketId] of Array.from(connectedUsers.entries())) {
          if (socketId === socket.id) {
            connectedUsers.delete(userId)
            io.emit('user-offline', { userId })
            break
          }
        }
        
        // Remove from admins
        connectedAdmins.delete(socket.id)
      })
    })

    ;(res.socket as any).server.io = io
  }

  res.end()
}
