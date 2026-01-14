import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, User, Calendar, Globe, CheckCircle, AlertCircle, ArrowRight, TrendingUp, Mail, Shield } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { getAuth, sendEmailVerification } from 'firebase/auth'
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

// Initialize Firebase app
let app
try {
  app = initializeApp(firebaseConfig)
} catch (error) {
  console.log('Firebase app already initialized')
}

export default function CompleteProfilePage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    username: '',
    fullName: '',
    dateOfBirth: '',
    gender: '',
    nationality: '',
    password: '',
    agreeTerms: false
  })
  const [errors, setErrors] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [calculatedAge, setCalculatedAge] = useState<number | null>(null)
  const [showSuccess, setShowSuccess] = useState(false)
  const [verificationChecked, setVerificationChecked] = useState(false)
  const [showVerificationPopup, setShowVerificationPopup] = useState(false)
  const [userEmail, setUserEmail] = useState('')
  const [passwordStrength, setPasswordStrength] = useState(0)
  const [showPassword, setShowPassword] = useState(false)

  // Calculate password strength
  const calculatePasswordStrength = (password: string) => {
    let strength = 0
    if (password.length >= 8) strength++
    if (password.length >= 12) strength++
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++
    if (/\d/.test(password)) strength++
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength++
    return Math.min(strength, 5) // Max strength of 5
  }

  // Check if username is unique
  const checkUsernameUnique = async (username: string): Promise<boolean> => {
    try {
      console.log('Checking username uniqueness for:', username)
      const response = await fetch(`/api/users?checkUsername=true&username=${username}`)
      console.log('Username check response status:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log('Username check response data:', data)
        return !data.exists
      }
      console.log('Username check failed, returning false')
      return false
    } catch (error) {
      console.error('Error checking username:', error)
      return false
    }
  }

  // Check email verification status on page load
  useEffect(() => {
    const checkEmailVerification = async () => {
      try {
        const auth = getAuth()
        const currentUser = auth.currentUser
        
        if (!currentUser) {
          router.push('/signup')
          return
        }

        setUserEmail(currentUser.email || '')

        if (!currentUser.emailVerified) {
          // Show verification popup instead of immediate redirect
          setShowVerificationPopup(true)
          setVerificationChecked(true)
          return
        }

        // User is verified, allow access
        setVerificationChecked(true)
      } catch (error) {
        console.error('Error checking email verification:', error)
        router.push('/get-started')
      }
    }

    checkEmailVerification()
  }, [router])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    const isCheckbox = e.target instanceof HTMLInputElement && type === 'checkbox'
    const checked = isCheckbox ? (e.target as HTMLInputElement).checked : undefined
    
    setFormData(prev => ({
      ...prev,
      [name]: isCheckbox ? checked : value
    }))

    // Calculate age when date of birth changes
    if (name === 'dateOfBirth' && value) {
      calculateAge(value)
    }

    // Calculate password strength when password changes
    if (name === 'password') {
      setPasswordStrength(calculatePasswordStrength(value))
    }
  }

  const calculateAge = (dateOfBirth: string) => {
    const today = new Date()
    const birthDate = new Date(dateOfBirth)
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    
    setCalculatedAge(age)
  }

  const validateForm = async () => {
    const newErrors: string[] = []

    if (!formData.username) newErrors.push('Username is required')
    else if (formData.username.length < 3) newErrors.push('Username must be at least 3 characters')
    else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) newErrors.push('Username can only contain letters, numbers, and underscores')
    else {
      // Check username uniqueness
      const isUnique = await checkUsernameUnique(formData.username)
      if (!isUnique) newErrors.push('Username is already taken. Please choose another one')
    }

    if (!formData.fullName) newErrors.push('Full name is required')
    else if (formData.fullName.length < 2) newErrors.push('Full name must be at least 2 characters')

    if (!formData.dateOfBirth) newErrors.push('Date of birth is required')
    else {
      const birthDate = new Date(formData.dateOfBirth)
      const today = new Date()
      if (birthDate >= today) newErrors.push('Date of birth must be in the past')
      if (calculatedAge && calculatedAge < 16) newErrors.push('You must be at least 16 years old')
      if (calculatedAge && calculatedAge > 120) newErrors.push('Please enter a valid date of birth')
    }

    if (!formData.gender) newErrors.push('Gender is required')
    if (!formData.nationality) newErrors.push('Nationality is required')

    if (!formData.password) newErrors.push('Password is required')
    else if (formData.password.length < 8) newErrors.push('Password must be at least 8 characters')
    else if (passwordStrength < 3) newErrors.push('Password is too weak. Please include uppercase, lowercase, numbers, and special characters')

    if (!formData.agreeTerms) newErrors.push('You must agree to the terms and conditions')

    setErrors(newErrors)
    return newErrors.length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!(await validateForm())) return

    setIsLoading(true)
    setErrors([])

    try {
      const auth = getAuth()
      const currentUser = auth.currentUser
      
      if (!currentUser) {
        throw new Error('No authenticated user found')
      }

      if (!currentUser.emailVerified) {
        setShowVerificationPopup(true)
        setIsLoading(false)
        return
      }

      const userData = {
        email: currentUser.email || '',
        firebaseUid: currentUser.uid,
        username: formData.username,
        fullName: formData.fullName,
        dateOfBirth: new Date(formData.dateOfBirth),
        age: calculatedAge || 0,
        gender: formData.gender,
        nationality: formData.nationality,
        password: formData.password,
        authProvider: currentUser.providerData[0]?.providerId === 'password' ? 'email' : 
                      currentUser.providerData[0]?.providerId === 'google.com' ? 'google' : 'apple',
        emailVerified: currentUser.emailVerified || false,
        profileCompleted: true
      }

      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        if (errorData.error && errorData.error.includes('username')) {
          setErrors([errorData.error])
          return
        }
        throw new Error('Failed to save profile')
      }

      setShowSuccess(true)
      setTimeout(() => {
        router.push('/dashboard')
      }, 2000)
    } catch (error: any) {
      console.error('Error saving profile:', error)
      setErrors(['An error occurred while saving your profile. Please try again.'])
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendVerification = async () => {
    try {
      const auth = getAuth()
      const currentUser = auth.currentUser
      
      if (currentUser) {
        await sendEmailVerification(currentUser)
        setErrors(['Verification email sent! Please check your inbox.'])
      }
    } catch (error) {
      console.error('Error resending verification:', error)
      setErrors(['Failed to resend verification email. Please try again.'])
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <div className="fixed top-0 w-full z-50 bg-black/20 backdrop-blur-lg border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center space-x-2">
              <TrendingUp className="h-8 w-8 text-purple-400" />
              <span className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                ProfitWave
              </span>
            </Link>
            <Link href="/signup" className="text-gray-400 hover:text-white transition-colors">
              <ArrowLeft className="w-5 h-5 mr-2 inline" />
              Back to Sign Up
            </Link>
          </div>
        </div>
      </div>
      
      <section className="pt-32 pb-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto">
          {!verificationChecked ? (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center"
            >
              <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <h2 className="text-xl font-semibold text-white mb-2">Verifying Your Email</h2>
              <p className="text-gray-300">Please wait while we check your email verification status...</p>
            </motion.div>
          ) : (
            <>
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="text-center mb-8"
              >
                <h1 className="text-4xl md:text-5xl font-bold mb-4">
                  <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                    Complete Your Profile
                  </span>
                </h1>
                <p className="text-lg text-gray-300 max-w-sm mx-auto">
                  Tell us a bit about yourself to get started
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
              >
                <div className="glass rounded-2xl p-6">
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label htmlFor="username" className="block text-gray-300 mb-1 text-sm">Username</label>
                      <input
                        id="username"
                        type="text"
                        name="username"
                        value={formData.username}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none transition-colors text-sm"
                        placeholder="Choose a username"
                        required
                        aria-label="Username"
                      />
                    </div>

                    <div>
                      <label htmlFor="fullName" className="block text-gray-300 mb-1 text-sm">Full Name</label>
                      <input
                        id="fullName"
                        type="text"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none transition-colors text-sm"
                        placeholder="Enter your full name"
                        required
                        aria-label="Full name"
                      />
                    </div>

                    <div>
                      <label htmlFor="dateOfBirth" className="block text-gray-300 mb-1 text-sm">Date of Birth</label>
                      <input
                        id="dateOfBirth"
                        type="date"
                        name="dateOfBirth"
                        value={formData.dateOfBirth}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none transition-colors text-sm"
                        required
                        max={new Date().toISOString().split('T')[0]}
                        aria-label="Date of birth"
                      />
                      {calculatedAge && (
                        <p className="text-purple-400 text-xs mt-1">Age: {calculatedAge} years</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="gender" className="block text-gray-300 mb-1 text-sm">Gender</label>
                      <select
                        id="gender"
                        name="gender"
                        value={formData.gender}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:border-purple-500 focus:outline-none transition-colors text-sm"
                        required
                        aria-label="Select gender"
                      >
                        <option value="" className="bg-gray-800">Select gender</option>
                        <option value="male" className="bg-gray-800">Male</option>
                        <option value="female" className="bg-gray-800">Female</option>
                        <option value="other" className="bg-gray-800">Other</option>
                        <option value="prefer-not-to-say" className="bg-gray-800">Prefer not to say</option>
                      </select>
                    </div>

                    <div>
                      <label htmlFor="nationality" className="block text-gray-300 mb-1 text-sm">Nationality</label>
                      <select
                        id="nationality"
                        name="nationality"
                        value={formData.nationality}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:border-purple-500 focus:outline-none transition-colors text-sm"
                        required
                        aria-label="Select nationality"
                      >
                        <option value="" className="bg-gray-800">Select nationality</option>
                        <option value="cameroon" className="bg-gray-800">Cameroon</option>
                        <option value="nigeria" className="bg-gray-800">Nigeria</option>
                        <option value="ghana" className="bg-gray-800">Ghana</option>
                        <option value="kenya" className="bg-gray-800">Kenya</option>
                        <option value="south-africa" className="bg-gray-800">South Africa</option>
                        <option value="usa" className="bg-gray-800">United States</option>
                        <option value="uk" className="bg-gray-800">United Kingdom</option>
                        <option value="france" className="bg-gray-800">France</option>
                        <option value="germany" className="bg-gray-800">Germany</option>
                        <option value="canada" className="bg-gray-800">Canada</option>
                        <option value="australia" className="bg-gray-800">Australia</option>
                        <option value="other" className="bg-gray-800">Other</option>
                      </select>
                    </div>

                    <div>
                      <label htmlFor="password" className="block text-gray-300 mb-1 text-sm">Password</label>
                      <div className="relative">
                        <input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          name="password"
                          value={formData.password}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none transition-colors text-sm pr-10"
                          placeholder="Create a password"
                          required
                          aria-label="Password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                          aria-label={showPassword ? "Hide password" : "Show password"}
                        >
                          {showPassword ? (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                            </svg>
                          ) : (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          )}
                        </button>
                      </div>
                      
                      {/* Password Strength Indicator */}
                      {formData.password && (
                        <div className="mt-2">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-gray-400">Password Strength</span>
                            <span className={`text-xs font-medium ${
                              passwordStrength === 0 ? 'text-red-400' :
                              passwordStrength === 1 ? 'text-orange-400' :
                              passwordStrength === 2 ? 'text-yellow-400' :
                              passwordStrength === 3 ? 'text-green-400' :
                              passwordStrength === 4 ? 'text-emerald-400' :
                              'text-teal-400'
                            }`}>
                              {passwordStrength === 0 ? 'Very Weak' :
                               passwordStrength === 1 ? 'Weak' :
                               passwordStrength === 2 ? 'Fair' :
                               passwordStrength === 3 ? 'Good' :
                               passwordStrength === 4 ? 'Strong' :
                               'Very Strong'}
                            </span>
                          </div>
                          <div className="w-full bg-gray-700 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full transition-all duration-300 ${
                                passwordStrength === 0 ? 'bg-red-500 w-1/5' :
                                passwordStrength === 1 ? 'bg-orange-500 w-2/5' :
                                passwordStrength === 2 ? 'bg-yellow-500 w-3/5' :
                                passwordStrength === 3 ? 'bg-green-500 w-4/5' :
                                passwordStrength === 4 ? 'bg-emerald-500 w-full' :
                                'bg-teal-500 w-full'
                              }`}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex items-start">
                      <input
                        type="checkbox"
                        id="agreeTerms"
                        name="agreeTerms"
                        checked={formData.agreeTerms}
                        onChange={handleInputChange}
                        className="mt-0.5 w-4 h-4 bg-white/10 border border-white/20 rounded text-purple-500 focus:ring-purple-500 focus:outline-none"
                        required
                      />
                      <label htmlFor="agreeTerms" className="ml-2 text-gray-300 text-xs cursor-pointer">
                        I agree to the Terms of Service and Privacy Policy
                      </label>
                    </div>

                    {errors.length > 0 && (
                      <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-3 mt-4">
                        {errors.map((error, index) => (
                          <div key={index} className="flex items-center text-red-300 text-xs mb-1">
                            <AlertCircle className="w-3 h-3 mr-1" />
                            {error}
                          </div>
                        ))}
                      </div>
                    )}

                    <motion.button
                      type="submit"
                      className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-full font-semibold hover:from-purple-600 hover:to-pink-600 transition-all duration-200 flex items-center justify-center group mt-6"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <>
                          Complete Profile
                          <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </>
                      )}
                    </motion.button>

                    <div className="text-center pt-4 border-t border-white/10 mt-6">
                      <p className="text-gray-400 text-sm">
                        Already have an account?{' '}
                        <Link href="/get-started" className="text-purple-400 hover:text-purple-300 font-semibold transition-colors">
                          Sign in
                        </Link>
                      </p>
                    </div>
                  </form>
                </div>
              </motion.div>
            </>
          )}
        </div>
      </section>

      {/* Email Verification Popup */}
      {showVerificationPopup && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="bg-gradient-to-br from-slate-800 to-slate-900 p-8 rounded-3xl shadow-2xl text-center max-w-md mx-4 border border-white/10"
          >
            <div className="w-20 h-20 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-purple-500/30">
              <Mail className="w-10 h-10 text-purple-400" />
            </div>
            
            <h3 className="text-2xl font-bold text-white mb-3">Verify Your Account</h3>
            
            <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-xl p-4 mb-6">
              <div className="flex items-start space-x-3">
                <Shield className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
                <div className="text-left">
                  <p className="text-yellow-300 text-sm font-medium mb-1">Email Verification Required</p>
                  <p className="text-yellow-200/80 text-xs">
                    We've sent a verification link to <span className="font-medium">{userEmail}</span>. 
                    Please check your inbox and click the link to verify your account before completing your profile.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3 mb-6">
              <button
                onClick={handleResendVerification}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-full font-semibold hover:from-purple-600 hover:to-pink-600 transition-all duration-200 flex items-center justify-center group"
              >
                <Mail className="w-4 h-4 mr-2" />
                Resend Verification Email
              </button>
              
              <button
                onClick={() => router.push('/get-started')}
                className="w-full bg-white/10 text-white px-6 py-3 rounded-full font-semibold hover:bg-white/20 transition-all duration-200 border border-white/20"
              >
                Back to Login
              </button>
            </div>

            <div className="text-center">
              <p className="text-gray-400 text-xs mb-2">Didn't receive the email?</p>
              <ul className="text-gray-500 text-xs space-y-1">
                <li>• Check your spam or junk folder</li>
                <li>• Make sure the email address is correct</li>
                <li>• Wait a few minutes for delivery</li>
              </ul>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Success Popup */}
      {showSuccess && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
        >
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            className="bg-gradient-to-br from-purple-600 to-pink-600 p-8 rounded-2xl shadow-2xl text-center max-w-sm mx-4"
          >
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">Profile Created!</h3>
            <p className="text-white/90 mb-4">
              Welcome to ProfitWave! Your profile has been successfully created.
            </p>
            <div className="w-full bg-white/20 rounded-full h-2 overflow-hidden">
              <motion.div
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: 2, ease: "linear" }}
                className="h-full bg-white/60"
              />
            </div>
            <p className="text-white/70 text-sm mt-2">Redirecting to dashboard...</p>
          </motion.div>
        </motion.div>
      )}
    </div>
  )
}
