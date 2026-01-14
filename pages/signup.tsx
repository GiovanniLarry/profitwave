import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, Mail, Phone, Eye, EyeOff, CheckCircle, AlertCircle, ArrowRight, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import { signUpWithEmail, signUpWithGoogle, signUpWithFacebook, verifyOTP, getErrorMessage } from '../lib/firebase'
import { useRouter } from 'next/router'

export default function SignUpPage() {
  const router = useRouter()
  const [signUpMethod, setSignUpMethod] = useState<'email' | 'google' | 'facebook' | null>(null)
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreeTerms: false,
    otp: ''
  })
  const [errors, setErrors] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [passwordStrength, setPasswordStrength] = useState(0)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    const isCheckbox = e.target instanceof HTMLInputElement && type === 'checkbox'
    const checked = isCheckbox ? (e.target as HTMLInputElement).checked : undefined
    
    setFormData(prev => ({
      ...prev,
      [name]: isCheckbox ? checked : value
    }))

    // Calculate password strength when password changes
    if (name === 'password') {
      setPasswordStrength(calculatePasswordStrength(value))
    }
  }

  const validateForm = () => {
    const newErrors: string[] = []

    if (signUpMethod === 'email') {
      if (!formData.email) newErrors.push('Email is required')
      else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.push('Please enter a valid email')
    }

    if (!formData.password) newErrors.push('Password is required')
    else if (formData.password.length < 8) newErrors.push('Password must be at least 8 characters')
    else if (passwordStrength < 3) newErrors.push('Password is too weak. Please include uppercase, lowercase, numbers, and special characters')
    else if (formData.password !== formData.confirmPassword) newErrors.push('Passwords do not match')

    if (!formData.agreeTerms) newErrors.push('You must agree to the terms and conditions')

    setErrors(newErrors)
    return newErrors.length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

    setIsLoading(true)
    setErrors([])

    try {
      const user = await signUpWithEmail(formData.email, formData.password)
      console.log('Sign up successful:', user)
      
      // Save user email and password to database immediately after Firebase signup
      const userData = {
        email: formData.email,
        firebaseUid: user.uid,
        password: formData.password, // Save password for MongoDB-driven auth
        fullName: '', // Will be filled in complete-profile
        dateOfBirth: new Date(), // Temporary, will be updated in complete-profile
        age: 0, // Temporary, will be updated in complete-profile
        gender: '', // Will be filled in complete-profile
        nationality: '', // Will be filled in complete-profile
        authProvider: 'email',
        emailVerified: user.emailVerified || false,
        profileCompleted: false // Mark as incomplete until profile is completed
      }

      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      })

      if (!response.ok) {
        console.error('Failed to save user to database, but Firebase account was created')
        // Don't throw error here since Firebase account was created successfully
      } else {
        console.log('User email saved to database successfully')
      }

      alert('Account created! Please check your email for verification.')
      router.push('/complete-profile')
    } catch (error: any) {
      const errorMessage = getErrorMessage(error)
      setErrors([errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignUp = async () => {
    setIsLoading(true)
    setErrors([])

    try {
      const user = await signUpWithGoogle()
      console.log('Google sign up successful:', user)
      
      // Save user email to database immediately after Firebase signup
      const userData = {
        email: user.email || '',
        firebaseUid: user.uid,
        fullName: user.displayName || '',
        dateOfBirth: new Date(), // Temporary, will be updated in complete-profile
        age: 0, // Temporary, will be updated in complete-profile
        gender: '', // Will be filled in complete-profile
        nationality: '', // Will be filled in complete-profile
        authProvider: 'google',
        emailVerified: user.emailVerified || false,
        profileCompleted: false // Mark as incomplete until profile is completed
      }

      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      })

      if (!response.ok) {
        console.error('Failed to save user to database, but Firebase account was created')
        // Don't throw error here since Firebase account was created successfully
      } else {
        console.log('User email saved to database successfully')
      }

      alert('Account created successfully with Google!')
      router.push('/complete-profile')
    } catch (error: any) {
      const errorMessage = getErrorMessage(error)
      setErrors([errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleFacebookSignUp = async () => {
    setIsLoading(true)
    setErrors([])

    try {
      const user = await signUpWithFacebook()
      console.log('Facebook sign up successful:', user)
      
      // Save user email to database immediately after Firebase signup
      const userData = {
        email: user.email || '',
        firebaseUid: user.uid,
        fullName: user.displayName || '',
        dateOfBirth: new Date(), // Temporary, will be updated in complete-profile
        age: 0, // Temporary, will be updated in complete-profile
        gender: '', // Will be filled in complete-profile
        nationality: '', // Will be filled in complete-profile
        authProvider: 'facebook',
        emailVerified: user.emailVerified || false,
        profileCompleted: false // Mark as incomplete until profile is completed
      }

      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      })

      if (!response.ok) {
        console.error('Failed to save user to database, but Firebase account was created')
        // Don't throw error here since Firebase account was created successfully
      } else {
        console.log('User email saved to database successfully')
      }

      alert('Account created successfully with Facebook!')
      router.push('/complete-profile')
    } catch (error: any) {
      const errorMessage = getErrorMessage(error)
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
            <Link href="/get-started" className="text-gray-400 hover:text-white transition-colors">
              <ArrowLeft className="w-5 h-5 mr-2 inline" />
              Back to Sign In
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
                Sign Up
              </span>
            </h1>
            <p className="text-lg text-gray-300 max-w-sm mx-auto">
              Create your ProfitWave account
            </p>
          </motion.div>

          <div className="max-w-md mx-auto">
            {/* Sign Up Options */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <div className="glass rounded-2xl p-6">
                <h2 className="text-xl font-bold text-white mb-4">Choose Your Sign-Up Method</h2>
                
                <div className="space-y-3">
                  <motion.button
                    onClick={handleGoogleSignUp}
                    className={`w-full p-3 rounded-xl border-2 transition-all duration-200 flex items-center justify-center space-x-3 ${
                      signUpMethod === 'google' 
                        ? 'border-purple-500 bg-purple-500/20' 
                        : 'border-white/20 hover:border-purple-500/50 bg-white/5'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={isLoading}
                  >
                    <div className="w-4 h-4 bg-blue-500 rounded-sm flex items-center justify-center">
                      <span className="text-white text-xs font-bold">G</span>
                    </div>
                    <span className="text-white font-semibold">Continue with Google</span>
                  </motion.button>

                  <motion.button
                    onClick={handleFacebookSignUp}
                    className={`w-full p-3 rounded-xl border-2 transition-all duration-200 flex items-center justify-center space-x-3 ${
                      signUpMethod === 'facebook' 
                        ? 'border-purple-500 bg-purple-500/20' 
                        : 'border-white/20 hover:border-purple-500/50 bg-white/5'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={isLoading}
                  >
                    <div className="w-4 h-4 bg-blue-600 rounded-sm flex items-center justify-center">
                      <span className="text-white text-xs font-bold">f</span>
                    </div>
                    <span className="text-white font-semibold">Continue with Facebook</span>
                  </motion.button>

                  <motion.button
                    onClick={() => setSignUpMethod('email')}
                    className={`w-full p-3 rounded-xl border-2 transition-all duration-200 flex items-center justify-center space-x-3 ${
                      signUpMethod === 'email' 
                        ? 'border-purple-500 bg-purple-500/20' 
                        : 'border-white/20 hover:border-purple-500/50 bg-white/5'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Mail className="w-4 h-4 text-green-400" />
                    <span className="text-white font-semibold">Continue with Email</span>
                  </motion.button>
                </div>
              </div>
            </motion.div>

            {/* Sign Up Form - Only for Email */}
            {signUpMethod === 'email' && (
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.3 }}
                className="mt-8"
              >
                <div className="glass rounded-2xl p-6">
                  <form onSubmit={handleSubmit}>
                    <h3 className="text-xl font-bold text-white mb-4">Create Your Account</h3>
                    
                    <div>
                      <label className="block text-gray-300 mb-1 text-sm">Email Address</label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none transition-colors text-sm"
                        placeholder="Enter your email"
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
                          placeholder="Create a strong password"
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

                    <div>
                      <label className="block text-gray-300 mb-1 text-sm">Confirm Password</label>
                      <div className="relative">
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          name="confirmPassword"
                          value={formData.confirmPassword}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none transition-colors pr-10 text-sm"
                          placeholder="Confirm your password"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                        >
                          {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
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
                        aria-label="Agree to terms and conditions"
                      />
                      <label htmlFor="agreeTerms" className="ml-2 text-gray-300 text-xs cursor-pointer">
                        I agree to the Terms of Service and Privacy Policy
                      </label>
                    </div>

                    {errors.length > 0 && (
                      <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-3">
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
                      className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-full font-semibold hover:from-purple-600 hover:to-pink-600 transition-all duration-200 flex items-center justify-center group"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <>
                          Create Account
                          <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </>
                      )}
                    </motion.button>

                    <div className="text-center pt-4 border-t border-white/10">
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
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
