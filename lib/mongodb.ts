import { MongoClient, Db } from 'mongodb'

if (!process.env.MONGODB_URI) {
  throw new Error('Please add your MongoDB URI to .env.local')
}

const uri = process.env.MONGODB_URI
const options = {}

let client: MongoClient
let clientPromise: Promise<MongoClient>

if (process.env.NODE_ENV === 'development') {
  // In development mode, use a global variable so that the value
  // is preserved across module reloads caused by HMR (Hot Module Replacement).
  let globalWithMongo = global as typeof global & {
    _mongoClientPromise?: Promise<MongoClient>
  }

  if (!globalWithMongo._mongoClientPromise) {
    client = new MongoClient(uri, options)
    globalWithMongo._mongoClientPromise = client.connect()
  }
  clientPromise = globalWithMongo._mongoClientPromise
} else {
  // In production mode, it's best to not use a global variable.
  client = new MongoClient(uri, options)
  clientPromise = client.connect()
}

export default clientPromise

// Database helper functions
export async function getDatabase(): Promise<Db> {
  const client = await clientPromise
  return client.db('profitwave')
}

export async function getUsersCollection() {
  const db = await getDatabase()
  return db.collection('users')
}

// User schema interface
export interface User {
  _id?: any // MongoDB ObjectId
  email: string
  firebaseUid: string
  fullName: string
  dateOfBirth: Date
  age: number
  gender: string
  nationality: string
  authProvider: 'email' | 'google' | 'apple'
  emailVerified: boolean
  createdAt: Date
  updatedAt: Date
  lastLoginAt?: Date
  profileCompleted: boolean
}

// User CRUD operations
export async function createUser(userData: Omit<User, '_id' | 'createdAt' | 'updatedAt'>) {
  const users = await getUsersCollection()
  const now = new Date()
  
  const user: Omit<User, '_id'> = {
    ...userData,
    createdAt: now,
    updatedAt: now
  }
  
  const result = await users.insertOne(user)
  return result
}

export async function getUserByEmail(email: string) {
  const users = await getUsersCollection()
  return await users.findOne({ email })
}

export async function getUserByFirebaseUid(firebaseUid: string) {
  const users = await getUsersCollection()
  return await users.findOne({ firebaseUid })
}

export async function updateUserLastLogin(firebaseUid: string) {
  const users = await getUsersCollection()
  return await users.updateOne(
    { firebaseUid },
    { 
      $set: { 
        lastLoginAt: new Date(),
        updatedAt: new Date()
      } 
    }
  )
}

export async function updateUserProfile(firebaseUid: string, profileData: Partial<User>) {
  const users = await getUsersCollection()
  return await users.updateOne(
    { firebaseUid },
    { 
      $set: { 
        ...profileData,
        updatedAt: new Date()
      } 
    }
  )
}
