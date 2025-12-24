import React from 'react'
import { motion } from 'framer-motion'
import { Users, MessageCircle, Star, Calendar, ArrowRight, Trophy, Heart } from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

export default function CommunityPage() {
  const stats = [
    { number: "10K+", label: "Active Members" },
    { number: "500+", label: "Daily Posts" },
    { number: "50+", label: "Expert Contributors" },
    { number: "24/7", label: "Community Support" }
  ]

  const discussions = [
    {
      title: "Best strategies for volatile markets?",
      author: "John D.",
      replies: 45,
      likes: 120,
      category: "Trading Strategies",
      time: "2 hours ago"
    },
    {
      title: "API authentication issues resolved",
      author: "Sarah M.",
      replies: 23,
      likes: 89,
      category: "API Support",
      time: "5 hours ago"
    },
    {
      title: "Portfolio rebalancing strategies",
      author: "Mike R.",
      replies: 67,
      likes: 234,
      category: "Portfolio Management",
      time: "1 day ago"
    }
  ]

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
                Community
              </span>
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Connect, learn, and grow with fellow investors
            </p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.2 + index * 0.1 }}
                className="text-center"
              >
                <div className="text-4xl font-bold text-white mb-2">{stat.number}</div>
                <div className="text-gray-400">{stat.label}</div>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mb-16"
          >
            <h2 className="text-3xl font-bold text-white mb-8 text-center">Join the Discussion</h2>
            <div className="space-y-6">
              {discussions.map((discussion, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.5 + index * 0.1 }}
                  whileHover={{ y: -5 }}
                  className="glass rounded-2xl p-6 hover:bg-white/10 transition-all duration-300"
                >
                  <div className="flex items-center justify-between mb-4">
                    <span className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded-full text-sm">
                      {discussion.category}
                    </span>
                    <span className="text-gray-400 text-sm">{discussion.time}</span>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2 hover:text-purple-400 transition-colors cursor-pointer">
                    {discussion.title}
                  </h3>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-gray-400">
                      <Users className="w-4 h-4 mr-2" />
                      <span className="text-sm">{discussion.author}</span>
                    </div>
                    <div className="flex items-center gap-4 text-gray-400">
                      <span className="flex items-center text-sm">
                        <MessageCircle className="w-4 h-4 mr-1" />
                        {discussion.replies}
                      </span>
                      <span className="flex items-center text-sm">
                        <Heart className="w-4 h-4 mr-1" />
                        {discussion.likes}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>
      
      <Footer />
    </div>
  )
}
