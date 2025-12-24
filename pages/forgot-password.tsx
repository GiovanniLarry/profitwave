import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, Mail, CheckCircle, AlertCircle, ArrowRight, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/router'

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<string[]>([])
  const [success, setSuccess] = useState(false)

  const validateEmail = () => {
    const newErrors: string[] = []

    if (!email) newErrors.push('Email is required')
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.push('Please enter a valid email')

    setErrors(newErrors)
    return newErrors.length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateEmail()) return

    setIsLoading(true)
    setErrors([])

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(true)
        console.log('Password reset email sent successfully')
      } else {
        setErrors([data.error || 'Failed to send password reset email'])
      }
    } catch (error: any) {
      console.error('Password reset error:', error)
      setErrors(['Network error. Please try again.'])
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
                Reset Password
              </span>
            </h1>
            <p className="text-lg text-gray-300 max-w-sm mx-auto">
              Enter your email address and we'll send you a link to reset your password
            </p>
          </motion.div>

          <div className="max-w-md mx-auto">
            {!success ? (
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
              >
                <div className="glass rounded-2xl p-6">
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <h3 className="text-xl font-bold text-white mb-6 text-center">Forgot Password</h3>
                    
                    <div>
                      <label className="block text-gray-300 mb-1 text-sm">Email Address</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full pl-10 pr-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none transition-colors text-sm"
                          placeholder="Enter your email address"
                          required
                        />
                      </div>
                    </div>

                    {errors.length > 0 && (
                      <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-3">
                        {errors.map((error, index) => (
                          <div key={index} className="flex items-center text-red-300 text-xs mb-1">
                            <AlertCircle className="w-3 h-3 mr-1 flex-shrink-0" />
                            <span className="break-words">{error}</span>
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
                          Send Reset Link
                          <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </>
                      )}
                    </motion.button>

                    <div className="text-center pt-4 border-t border-white/10">
                      <p className="text-gray-400 text-sm">
                        Remember your password?{' '}
                        <Link href="/get-started" className="text-purple-400 hover:text-purple-300 font-semibold transition-colors">
                          Sign in
                        </Link>
                      </p>
                    </div>
                  </form>
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
              >
                <div className="glass rounded-2xl p-6 text-center">
                  <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-green-400" />
                  </div>
                  
                  <h3 className="text-xl font-bold text-white mb-2">Reset Link Sent!</h3>
                  <p className="text-gray-300 text-sm mb-4">
                    We've sent a password reset link to your email address. 
                    Please check your inbox and follow the instructions to reset your password.
                  </p>
                  <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-lg p-3 mb-4">
                    <p className="text-yellow-300 text-xs">
                      <strong>Important:</strong> If you don't see the email in your inbox, please check your spam or junk folder. 
                      Sometimes password reset emails may be filtered incorrectly.
                    </p>
                  </div>
                  
                  <div className="space-y-3">
                    <button
                      onClick={() => setSuccess(false)}
                      className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-full font-semibold hover:from-purple-600 hover:to-pink-600 transition-all duration-200"
                    >
                      Send Another Link
                    </button>
                    
                    <Link href="/get-started">
                      <button className="w-full bg-white/10 text-white px-6 py-3 rounded-full font-semibold hover:bg-white/20 transition-all duration-200 border border-white/20">
                        Back to Sign In
                      </button>
                    </Link>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
