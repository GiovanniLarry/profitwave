import React from 'react'
import { motion } from 'framer-motion'
import { Cookie, Settings, Eye, Shield, ArrowRight } from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

export default function CookiePolicyPage() {
  const cookieTypes = [
    {
      name: "Essential Cookies",
      description: "These cookies are necessary for the website to function and cannot be switched off in our systems.",
      examples: "Authentication, security, load balancing",
      required: true
    },
    {
      name: "Performance Cookies",
      description: "These cookies allow us to count visits and traffic sources so we can measure and improve the performance of our site.",
      examples: "Google Analytics, site analytics",
      required: false
    },
    {
      name: "Functional Cookies",
      description: "These cookies enable the website to provide enhanced functionality and personalization.",
      examples: "Language preferences, user preferences",
      required: false
    },
    {
      name: "Targeting Cookies",
      description: "These cookies may be set through our site by our advertising partners to build a profile of your interests.",
      examples: "Advertising networks, retargeting",
      required: false
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <Navbar />
      
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Cookie Policy
              </span>
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              This Cookie Policy explains how ProfitWave uses cookies and similar technologies.
            </p>
            <p className="text-gray-400 mt-4">Last updated: December 21, 2024</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="glass rounded-3xl p-12 mb-16"
          >
            <h2 className="text-3xl font-bold text-white mb-6">What Are Cookies?</h2>
            <p className="text-gray-300 leading-relaxed">
              Cookies are small text files that are stored on your device when you visit a website. 
              They help the website remember information about your visit, which can make it easier to 
              visit again and make the site more useful to you.
            </p>
          </motion.div>

          <div className="space-y-6 mb-16">
            {cookieTypes.map((cookie, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 + index * 0.1 }}
                className="glass rounded-2xl p-8"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-white">{cookie.name}</h3>
                  {cookie.required && (
                    <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm">
                      Required
                    </span>
                  )}
                </div>
                <p className="text-gray-300 mb-3">{cookie.description}</p>
                <div className="text-sm text-gray-400">
                  <strong>Examples:</strong> {cookie.examples}
                </div>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="glass rounded-3xl p-12 mb-16"
          >
            <h2 className="text-3xl font-bold text-white mb-6">Managing Your Preferences</h2>
            <p className="text-gray-300 mb-6">
              You can control and/or delete cookies as you wish. You can delete all cookies that are 
              already on your device and you can set most browsers to prevent them from being placed.
            </p>
            <div className="space-y-4">
              <div className="flex items-center">
                <Settings className="w-5 h-5 text-purple-400 mr-3" />
                <span className="text-gray-300">Browser settings to block or delete cookies</span>
              </div>
              <div className="flex items-center">
                <Eye className="w-5 h-5 text-purple-400 mr-3" />
                <span className="text-gray-300">Cookie consent banner on our website</span>
              </div>
              <div className="flex items-center">
                <Shield className="w-5 h-5 text-purple-400 mr-3" />
                <span className="text-gray-300">Privacy settings in your account</span>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="text-center"
          >
            <motion.button
              className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-8 py-4 rounded-full font-semibold text-lg hover:from-purple-600 hover:to-pink-600 transition-all duration-200 flex items-center justify-center group mx-auto"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Manage Cookie Preferences
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </motion.button>
          </motion.div>
        </div>
      </section>
      
      <Footer />
    </div>
  )
}
