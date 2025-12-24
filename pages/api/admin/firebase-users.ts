import { NextApiRequest, NextApiResponse } from 'next'
import { getAuth } from 'firebase/auth'
import { initializeApp } from 'firebase/app'

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

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET'])
    return res.status(405).end(`Method ${req.method} Not Allowed`)
  }

  try {
    const auth = getAuth()
    
    // Note: listUsers and deleteUser are not available in client-side Firebase Auth SDK
    // These functions require Firebase Admin SDK which needs server-side setup
    // For now, we'll provide guidance on manual Firebase user management
    
    res.status(200).json({
      message: 'Firebase user management info',
      note: 'Client-side Firebase Auth SDK does not support user management functions',
      recommendations: [
        'To clear Firebase users, go to Firebase Console manually:',
        '1. Visit https://console.firebase.google.com',
        '2. Select project: profitwave-7fea2',
        '3. Go to Authentication → Users tab',
        '4. Delete users individually or use the bulk delete option',
        'Alternatively, set up Firebase Admin SDK for server-side user management'
      ],
      firebaseConfig: {
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
        configured: !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY
      }
    })
    
  } catch (error: any) {
    console.error('Firebase user management error:', error)
    res.status(500).json({
      error: 'Firebase user management failed',
      details: error.message,
      code: error.code
    })
  }
}
