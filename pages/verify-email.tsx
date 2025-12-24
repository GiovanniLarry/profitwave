import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle, AlertCircle, RefreshCw } from 'lucide-react'
import Link from 'next/link'
import { getAuth, applyActionCode } from 'firebase/auth'
import { initializeApp, getApps } from 'firebase/app'

// Firebase initialization
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

export default function VerifyEmailPage() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')
  const [isVerifying, setIsVerifying] = useState(false)

  useEffect(() => {
    const verifyEmail = async () => {
      const auth = getAuth()
      const urlParams = new URLSearchParams(window.location.search)
      const mode = urlParams.get('mode')
      const oobCode = urlParams.get('oobCode')

      if (mode === 'verifyEmail' && oobCode) {
        try {
          setIsVerifying(true)
          await applyActionCode(auth, oobCode)
          setStatus('success')
          setMessage('Your email has been successfully verified! Redirecting to complete your profile...')
          
          // Set verification flag in localStorage
          localStorage.setItem('emailVerified', 'true')
          localStorage.setItem('verificationTime', Date.now().toString())
          
          // Auto-redirect after 2 seconds
          setTimeout(() => {
            window.location.href = '/complete-profile'
          }, 2000)
        } catch (error: any) {
          console.error('Email verification error:', error)
          setStatus('error')
          setMessage('Failed to verify email. The link may have expired or is invalid.')
        } finally {
          setIsVerifying(false)
        }
      } else {
        setStatus('error')
        setMessage('Invalid verification link. Please request a new verification email.')
      }
    }

    verifyEmail()
  }, [])

  const handleResendVerification = async () => {
    const auth = getAuth()
    const user = auth.currentUser
    
    if (user && !user.emailVerified) {
      try {
        // Use the correct Firebase import for sendEmailVerification
        import('firebase/auth').then(firebaseAuth => {
          return firebaseAuth.sendEmailVerification(user)
        }).then(() => {
          setStatus('loading')
          setMessage('Verification email has been resent. Please check your inbox.')
        })
      } catch (error: any) {
        console.error('Resend verification error:', error)
        setStatus('error')
        setMessage('Failed to resend verification email. Please try again later.')
      }
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full"
      >
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
          {/* Header */}
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-white mb-2">Email Verification</h1>
            <p className="text-gray-300">Verify your email address to continue</p>
          </div>

          {/* Status Content */}
          <div className="text-center">
            {isVerifying ? (
              <div className="flex flex-col items-center space-y-4">
                <RefreshCw className="w-12 h-12 text-purple-400 animate-spin" />
                <p className="text-white">Verifying your email...</p>
              </div>
            ) : status === 'success' ? (
              <div className="flex flex-col items-center space-y-4">
                <CheckCircle className="w-16 h-16 text-green-400" />
                <div>
                  <p className="text-xl font-semibold text-green-400 mb-2">Email Verified Successfully!</p>
                  <p className="text-gray-300">{message}</p>
                </div>
                <Link
                  href="/complete-profile"
                  className="inline-flex items-center px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors"
                >
                  Continue to Profile
                </Link>
              </div>
            ) : status === 'error' ? (
              <div className="flex flex-col items-center space-y-4">
                <AlertCircle className="w-16 h-16 text-red-400" />
                <div>
                  <p className="text-xl font-semibold text-red-400 mb-2">Verification Failed</p>
                  <p className="text-gray-300">{message}</p>
                </div>
                <div className="space-y-3">
                  <button
                    onClick={handleResendVerification}
                    className="w-full px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors"
                  >
                    Resend Verification Email
                  </button>
                  <Link
                    href="/signup"
                    className="block text-center text-purple-400 hover:text-purple-300 transition-colors"
                  >
                    Back to Sign Up
                  </Link>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </motion.div>
    </div>
  )
}
