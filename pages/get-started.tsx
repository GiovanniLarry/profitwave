import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, TrendingUp, Mail, Lock, Eye, EyeOff, AlertCircle, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { getAuth, signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth'
import { auth } from '../lib/firebase'

// Firebase configuration is handled in lib/firebase.ts

export default function GetStartedPage() {
  const router = useRouter()
  const [signInMethod, setSignInMethod] = useState<'email' | 'phone' | 'google' | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    remember: false
  })
  const [errors, setErrors] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const validateForm = () => {
    const newErrors: string[] = []

    if (!formData.username) newErrors.push('Username is required')
    else if (formData.username.length < 3) newErrors.push('Username must be at least 3 characters')
    if (!formData.password) newErrors.push('Password is required')
    else if (formData.password.length < 6) newErrors.push('Password must be at least 6 characters')

    setErrors(newErrors)
    return newErrors.length === 0
  }

  const checkEmailExists = async (email: string): Promise<boolean> => {
    try {
      console.log('Checking if email exists:', email)
      const response = await fetch(`/api/users?checkEmail=true&email=${encodeURIComponent(email)}`)
      console.log('Email check response status:', response.status)
      
      if (response.status === 200) {
        const data = await response.json()
        console.log('Email exists:', data.exists)
        return data.exists
      } else if (response.status === 404) {
        console.log('Email does not exist')
        return false
      } else {
        console.error('Unexpected response from email check:', response.status)
        // If API fails, allow login attempt (fail open)
        return true
      }
    } catch (error) {
      console.error('Error checking email existence:', error)
      // If network fails, allow login attempt (fail open)
      return true
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

    setIsLoading(true)
    setErrors([])

    try {
      // Use MongoDB-driven authentication
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: formData.username,
          password: formData.password
        }),
      })

      const data = await response.json()

      if (response.ok) {
        console.log('MongoDB-driven login successful:', data)
        
        // Store user session in localStorage for persistence
        localStorage.setItem('userSession', JSON.stringify({
          authenticated: true,
          user: data.user,
          timestamp: Date.now()
        }))
        
        // Sign in with Firebase to set session
        try {
          const auth = getAuth()
          if (data.user.email) {
            await signInWithEmailAndPassword(auth, data.user.email, formData.password)
            console.log('Firebase session established')
          }
        } catch (firebaseError) {
          console.error('Firebase session error:', firebaseError)
          // Continue even if Firebase fails, as MongoDB auth succeeded
        }
        
        // Check if user has completed profile
        if (data.user.profileCompleted) {
          // User has completed profile, redirect to dashboard
          console.log('Profile completed, redirecting to dashboard')
          router.push('/dashboard')
        } else {
          // User needs to complete profile
          console.log('Profile not completed, redirecting to complete profile')
          router.push('/complete-profile')
        }
      } else {
        // Handle email verification requirement
        if (data.needsEmailVerification) {
          setErrors([`Please verify your email before signing in. Check your inbox for the verification link sent to ${data.email}.`])
        } else {
          setErrors([data.error || 'Login failed'])
        }
      }
    } catch (error: any) {
      console.error('Login error:', error)
      setErrors(['Network error. Please try again.'])
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setIsLoading(true)
    setErrors([])

    try {
      const auth = getAuth()
      const provider = new GoogleAuthProvider()
      const userCredential = await signInWithPopup(auth, provider)
      
      // Check if user has completed profile
      console.log('Google sign-in - Checking profile for Firebase UID:', userCredential.user.uid)
      const response = await fetch(`/api/users?firebaseUid=${userCredential.user.uid}`)
      console.log('Google sign-in - API response status:', response.status)
      if (response.ok) {
        const data = await response.json()
        console.log('Google sign-in - User data from API:', data)
        if (data.user && data.user.profileCompleted) {
          // User has completed profile, redirect to dashboard
          console.log('Google sign-in - Profile completed, redirecting to dashboard')
          router.push('/dashboard')
        } else {
          // User needs to complete profile
          console.log('Google sign-in - Profile not completed, redirecting to complete profile')
          router.push('/complete-profile')
        }
      } else {
        // User not found in database, redirect to profile completion
        console.log('Google sign-in - User not found, redirecting to complete profile')
        router.push('/complete-profile')
      }
    } catch (error: any) {
      console.error('Google sign-in error:', error)
      let errorMessage = 'Failed to sign in with Google. Please try again.'
      
      if (error.code === 'auth/popup-closed-by-user') {
        errorMessage = 'Sign-in popup was closed. Please try again.'
      } else if (error.code === 'auth/popup-blocked') {
        errorMessage = 'Sign-in popup was blocked. Please allow popups and try again.'
      }
      
      setErrors([errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Simple Header */}
      <div className="fixed top-0 w-full z-50 bg-black/20 backdrop-blur-lg border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center space-x-2">
              <TrendingUp className="h-8 w-8 text-purple-400" />
              <span className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                ProfitWave
              </span>
            </Link>
            <Link href="/" className="text-gray-400 hover:text-white transition-colors">
              <ArrowLeft className="w-5 h-5 mr-2 inline" />
              Back to Home
            </Link>
          </div>
        </div>
      </div>
      
      <section className="pt-32 pb-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-8"
          >
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Sign In
              </span>
            </h1>
            <p className="text-lg text-gray-300 max-w-sm mx-auto">
              Welcome back to ProfitWave
            </p>
          </motion.div>

          <div className="max-w-md mx-auto">
          {/* Login Form */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <div className="glass rounded-2xl p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <h3 className="text-xl font-bold text-white mb-6 text-center">Sign In to Your Account</h3>
                
                <div>
                  <label className="block text-gray-300 mb-1 text-sm">Username</label>
                  <input
                    type="text"
                    name="username"
                    value={formData.username || ''}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none transition-colors text-sm"
                    placeholder="Enter your username"
                    required
                  />
                </div>

                <div>
                  <label className="block text-gray-300 mb-1 text-sm">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none transition-colors pr-10 text-sm"
                      placeholder="Enter your password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="remember"
                      name="remember"
                      checked={formData.remember || false}
                      onChange={handleInputChange}
                      className="w-4 h-4 bg-white/10 border border-white/20 rounded text-purple-500 focus:ring-purple-500 focus:outline-none"
                    />
                    <label htmlFor="remember" className="ml-2 text-gray-300 text-xs cursor-pointer">
                      Remember me
                    </label>
                  </div>
                  <Link href="/forgot-password" className="text-purple-400 hover:text-purple-300 text-xs transition-colors">
                    Forgot password?
                  </Link>
                </div>

                {errors.length > 0 && (
                  <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-3">
                    {errors.map((error, index) => (
                      <div key={index} className="text-red-300 text-xs mb-1">
                        <div className="flex items-center">
                          <AlertCircle className="w-3 h-3 mr-1 flex-shrink-0" />
                          <span className="break-words">{error}</span>
                        </div>
                        {error.includes('not registered') && (
                          <div className="mt-2 ml-4">
                            <Link 
                              href="/signup" 
                              className="inline-flex items-center text-purple-400 hover:text-purple-300 font-semibold transition-colors text-xs"
                            >
                              Sign up now
                              <ArrowRight className="w-3 h-3 ml-1" />
                            </Link>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                <motion.button
                  type="submit"
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-full font-semibold hover:from-purple-600 hover:to-pink-600 transition-all duration-200 flex items-center justify-center group"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      Sign In
                      <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </motion.button>

                <div className="text-center pt-4 border-t border-white/10">
                  <p className="text-gray-400 text-sm">
                    Don't have an account?{' '}
                    <Link href="/signup" className="text-purple-400 hover:text-purple-300 font-semibold transition-colors">
                      Sign up
                    </Link>
                  </p>
                </div>

                <div className="text-center">
                  <p className="text-gray-400 text-xs mb-3">Or continue with</p>
                  <motion.button
                    onClick={handleGoogleSignIn}
                    className="inline-flex items-center justify-center w-10 h-10 bg-white/10 border border-white/20 rounded-lg hover:bg-white/20 transition-all duration-200"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    disabled={isLoading}
                  >
                    <div className="w-4 h-4 bg-blue-500 rounded-sm flex items-center justify-center">
                      <span className="text-white text-xs font-bold">G</span>
                    </div>
                  </motion.button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
        </div>
      </section>
    </div>
  )
}
