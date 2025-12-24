import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { MessageCircle, Mail, Phone, Search, Book, Users, Clock, CheckCircle, Send, HelpCircle, Zap, Shield } from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

export default function SupportPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')

  const faqCategories = ['All', 'Account', 'API', 'Trading', 'Security', 'Billing']

  const faqs = [
    {
      question: "How do I get started with ProfitWave?",
      answer: "Getting started is easy! Sign up for a free account, complete the verification process, and you can start trading immediately. We also offer a 14-day free trial for our premium features.",
      category: "Account"
    },
    {
      question: "What are the API rate limits?",
      answer: "API rate limits vary by plan: Starter (100 requests/minute), Professional (1000 requests/minute), Enterprise (unlimited). WebSocket connections have separate limits.",
      category: "API"
    },
    {
      question: "How secure is my data?",
      answer: "We use bank-level 256-bit encryption, multi-factor authentication, and are SOC 2 Type II certified. Your data is never shared with third parties without your consent.",
      category: "Security"
    },
    {
      question: "Can I use ProfitWave outside the US?",
      answer: "Yes! ProfitWave is available in 150+ countries worldwide. Some features may vary by region due to local regulations.",
      category: "Account"
    },
    {
      question: "How do I cancel my subscription?",
      answer: "You can cancel your subscription anytime from your account settings. No cancellation fees, and you'll continue to have access until the end of your billing period.",
      category: "Billing"
    },
    {
      question: "What trading pairs are available?",
      answer: "We support thousands of trading pairs including stocks, cryptocurrencies, forex, and commodities. Availability varies by region.",
      category: "Trading"
    }
  ]

  const supportOptions = [
    {
      title: "24/7 Live Chat",
      description: "Get instant help from our support team",
      icon: MessageCircle,
      action: "Start Chat",
      available: "Always available"
    },
    {
      title: "Email Support",
      description: "Send us detailed questions",
      icon: Mail,
      action: "Send Email",
      available: "Response within 24 hours"
    },
    {
      title: "Phone Support",
      description: "Speak with a support specialist",
      icon: Phone,
      action: "Call Now",
      available: "Mon-Fri, 9AM-6PM EST"
    },
    {
      title: "Community Forum",
      description: "Get help from other users",
      icon: Users,
      action: "Visit Forum",
      available: "Always available"
    }
  ]

  const filteredFAQs = faqs.filter(faq => 
    (selectedCategory === 'All' || faq.category === selectedCategory) &&
    (faq.question.toLowerCase().includes(searchTerm.toLowerCase()) || 
     faq.answer.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <Navbar />
      
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Support Center
              </span>
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              We're here to help you succeed with ProfitWave
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {supportOptions.map((option, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 + index * 0.1 }}
                whileHover={{ y: -10 }}
                className="glass rounded-2xl p-6 hover:bg-white/10 transition-all duration-300 text-center"
              >
                <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <option.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{option.title}</h3>
                <p className="text-gray-300 mb-4 text-sm">{option.description}</p>
                <div className="text-gray-400 text-xs mb-4">{option.available}</div>
                <motion.button
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-2 rounded-xl font-semibold hover:from-purple-600 hover:to-pink-600 transition-all duration-200"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {option.action}
                </motion.button>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mb-16"
          >
            <h2 className="text-3xl font-bold text-white mb-8 text-center">Frequently Asked Questions</h2>
            
            <div className="max-w-2xl mx-auto mb-8">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search FAQs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-white/10 border border-white/20 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 transition-colors"
                />
              </div>
            </div>

            <div className="flex flex-wrap justify-center gap-2 mb-8">
              {faqCategories.map((category, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-full font-medium transition-all duration-200 ${
                    selectedCategory === category
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                      : 'bg-white/10 text-gray-300 hover:bg-white/20'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>

            <div className="space-y-4 max-w-4xl mx-auto">
              {filteredFAQs.map((faq, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.5 + index * 0.1 }}
                  className="glass rounded-2xl p-6"
                >
                  <div className="flex items-start">
                    <HelpCircle className="w-6 h-6 text-purple-400 mr-3 mt-1 flex-shrink-0" />
                    <div className="flex-grow">
                      <h3 className="text-lg font-semibold text-white mb-2">{faq.question}</h3>
                      <p className="text-gray-300">{faq.answer}</p>
                      <span className="inline-block mt-3 px-3 py-1 bg-purple-500/20 text-purple-400 rounded-full text-sm">
                        {faq.category}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="mb-16"
          >
            <h2 className="text-3xl font-bold text-white mb-8 text-center">Quick Links</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {[
                {
                  title: "Documentation",
                  description: "Comprehensive API and platform documentation",
                  icon: Book,
                  link: "/documentation"
                },
                {
                  title: "Community",
                  description: "Connect with other ProfitWave users",
                  icon: Users,
                  link: "/community"
                }
              ].map((link, index) => (
                <motion.a
                  key={index}
                  href={link.link}
                  className="glass rounded-2xl p-6 hover:bg-white/10 transition-all duration-300 block"
                  whileHover={{ y: -5 }}
                >
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center mr-4">
                      <link.icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-white">{link.title}</h3>
                  </div>
                  <p className="text-gray-300">{link.description}</p>
                </motion.a>
              ))}
            </div>
          </motion.div>
        </div>
      </section>
      
      <Footer />
    </div>
  )
}
