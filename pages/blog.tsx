import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Calendar, User, ArrowRight, TrendingUp, Brain, Shield, Globe } from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

export default function BlogPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [userMessage, setUserMessage] = useState('')
  const [sentMessage, setSentMessage] = useState('')
  const posts = [
    {
      id: 1,
      title: "The Future of AI in Trading: 2024 Predictions",
      excerpt: "Explore how artificial intelligence is revolutionizing trading strategies and what to expect in the coming year.",
      author: "Sarah Chen",
      date: "Dec 15, 2024",
      readTime: "5 min read",
      category: "AI & Trading",
      image: Brain,
      featured: true
    },
    {
      id: 2,
      title: "Security Best Practices for Online Trading",
      excerpt: "Essential security measures every trader should implement to protect their investments and personal data.",
      author: "David Kim",
      date: "Dec 12, 2024",
      readTime: "7 min read",
      category: "Security",
      image: Shield,
      featured: false
    },
    {
      id: 3,
      title: "Global Market Trends: Q4 2024 Analysis",
      excerpt: "Comprehensive analysis of global market trends and opportunities for investors in the final quarter.",
      author: "Emma Thompson",
      date: "Dec 10, 2024",
      readTime: "10 min read",
      category: "Market Analysis",
      image: Globe,
      featured: false
    },
    {
      id: 4,
      title: "Building a Diversified Portfolio in 2024",
      excerpt: "Learn how to create a balanced investment portfolio that can weather market volatility.",
      author: "Michael Rodriguez",
      date: "Dec 8, 2024",
      readTime: "6 min read",
      category: "Portfolio Strategy",
      image: TrendingUp,
      featured: false
    },
    {
      id: 5,
      title: "Understanding Cryptocurrency Regulations",
      excerpt: "A comprehensive guide to crypto regulations across different jurisdictions and their impact on trading.",
      author: "Sarah Chen",
      date: "Dec 5, 2024",
      readTime: "8 min read",
      category: "Regulations",
      image: Shield,
      featured: false
    },
    {
      id: 6,
      title: "The Rise of Sustainable Investing",
      excerpt: "How ESG factors are changing investment strategies and creating new opportunities.",
      author: "Emma Thompson",
      date: "Dec 3, 2024",
      readTime: "7 min read",
      category: "ESG Investing",
      image: Globe,
      featured: false
    }
  ]

  const categories = ["All", "AI & Trading", "Security", "Market Analysis", "Portfolio Strategy", "Regulations", "ESG Investing"]

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
                ProfitWave Blog
              </span>
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Insights, trends, and strategies from our team of experts
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="flex flex-wrap justify-center gap-2 mb-12"
          >
            {categories.map((category, index) => (
              <button
                key={index}
                className={`px-4 py-2 rounded-full font-medium transition-all duration-200 ${
                  category === "All"
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                    : 'bg-white/10 text-gray-300 hover:bg-white/20'
                }`}
              >
                {category}
              </button>
            ))}
          </motion.div>

          <div className="space-y-8">
            {posts.map((post, index) => (
              <motion.article
                key={post.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 + index * 0.1 }}
                whileHover={{ y: -5 }}
                className={`glass rounded-2xl p-8 hover:bg-white/10 transition-all duration-300 ${
                  post.featured ? 'border-purple-500/50' : ''
                }`}
              >
                <div className="flex flex-col md:flex-row gap-8">
                  <div className="flex-shrink-0">
                    <div className={`w-24 h-24 bg-gradient-to-r ${
                      post.featured ? 'from-purple-500 to-pink-500' : 'from-blue-500 to-cyan-500'
                    } rounded-2xl flex items-center justify-center`}>
                      <post.image className="w-12 h-12 text-white" />
                    </div>
                  </div>
                  
                  <div className="flex-grow">
                    {post.featured && (
                      <span className="inline-block px-3 py-1 bg-purple-500/20 text-purple-400 rounded-full text-sm font-semibold mb-4">
                        Featured
                      </span>
                    )}
                    
                    <div className="flex items-center gap-4 text-sm text-gray-400 mb-4">
                      <span className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        {post.date}
                      </span>
                      <span className="flex items-center">
                        <User className="w-4 h-4 mr-1" />
                        {post.author}
                      </span>
                      <span>{post.readTime}</span>
                      <span className="px-2 py-1 bg-white/10 rounded-full text-xs">
                        {post.category}
                      </span>
                    </div>
                    
                    <h2 className="text-2xl font-bold text-white mb-4 hover:text-purple-400 transition-colors cursor-pointer">
                      {post.title}
                    </h2>
                    
                    <p className="text-gray-300 mb-6 leading-relaxed">
                      {post.excerpt}
                    </p>
                    
                    <motion.button
                      className="flex items-center text-purple-400 hover:text-purple-300 transition-colors font-medium"
                      whileHover={{ x: 5 }}
                    >
                      Read More
                      <ArrowRight className="ml-2 w-4 h-4" />
                    </motion.button>
                  </div>
                </div>
              </motion.article>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="text-center mt-16"
          >
            <div className="glass rounded-3xl p-12">
              <h2 className="text-3xl font-bold text-white mb-6">
                Stay Updated
              </h2>
              <p className="text-gray-300 mb-8 max-w-2xl mx-auto">
                Get the latest insights and trading strategies delivered to your inbox weekly.
              </p>
              <div className="space-y-4 max-w-md mx-auto">
                <input
                  type="text"
                  placeholder="Enter your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-full text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 transition-colors"
                />
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-full text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 transition-colors"
                />
                <textarea
                  placeholder="Enter your message"
                  value={userMessage}
                  onChange={(e) => setUserMessage(e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 transition-colors resize-none"
                  rows={4}
                />
                <motion.button
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-full font-semibold hover:from-purple-600 hover:to-pink-600 transition-all duration-200"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    if (name && email && userMessage) {
                      setSentMessage('sent')
                      setName('')
                      setEmail('')
                      setUserMessage('')
                    }
                  }}
                >
                  Send
                </motion.button>
              </div>
              {sentMessage === 'sent' && (
                <div className="mt-4 text-green-400 text-sm">
                  sent
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </section>
      
      <Footer />
    </div>
  )
}
