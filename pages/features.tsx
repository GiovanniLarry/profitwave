import React from 'react'
import { motion } from 'framer-motion'
import { Brain, Shield, Zap, Globe, Users, Lock, BarChart3, TrendingUp, Target, ArrowRight, CheckCircle } from 'lucide-react'
import Link from 'next/link'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

export default function FeaturesPage() {
  const features = [
    {
      icon: Brain,
      title: "AI-Powered Analytics",
      description: "Advanced machine learning algorithms analyze market trends and predict optimal investment opportunities in real-time.",
      benefits: ["Real-time market analysis", "Predictive insights", "Automated recommendations"],
      gradient: "from-purple-500 to-pink-500"
    },
    {
      icon: Shield,
      title: "Bank-Level Security",
      description: "Your investments are protected with military-grade encryption and multi-factor authentication.",
      benefits: ["256-bit encryption", "Two-factor authentication", "Regular security audits"],
      gradient: "from-blue-500 to-cyan-500"
    },
    {
      icon: Zap,
      title: "Lightning Fast Trades",
      description: "Execute trades in milliseconds with our optimized infrastructure and global server network.",
      benefits: ["Sub-second execution", "Global server network", "Low latency"],
      gradient: "from-yellow-500 to-orange-500"
    },
    {
      icon: Globe,
      title: "Global Markets",
      description: "Access thousands of stocks, cryptocurrencies, and commodities from markets worldwide.",
      benefits: ["150+ countries", "24/7 trading", "Multiple asset classes"],
      gradient: "from-green-500 to-emerald-500"
    },
    {
      icon: Users,
      title: "Expert Community",
      description: "Connect with seasoned investors and share strategies in our exclusive trading community.",
      benefits: ["Expert insights", "Strategy sharing", "Networking opportunities"],
      gradient: "from-indigo-500 to-purple-500"
    },
    {
      icon: Lock,
      title: "Risk Management",
      description: "Automated risk assessment tools help you maintain a balanced and secure portfolio.",
      benefits: ["Risk scoring", "Portfolio balancing", "Stop-loss automation"],
      gradient: "from-red-500 to-pink-500"
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
                Powerful Features
              </span>
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Everything you need to succeed in the modern investment landscape
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                whileHover={{ y: -10 }}
                className="group"
              >
                <div className="h-full glass rounded-2xl p-8 hover:bg-white/10 transition-all duration-300 hover:border-purple-500/50">
                  <motion.div
                    className={`w-16 h-16 bg-gradient-to-r ${feature.gradient} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}
                  >
                    <feature.icon className="w-8 h-8 text-white" />
                  </motion.div>
                  <h3 className="text-2xl font-bold text-white mb-4">{feature.title}</h3>
                  <p className="text-gray-300 mb-6 leading-relaxed">{feature.description}</p>
                  <ul className="space-y-2">
                    {feature.benefits.map((benefit, i) => (
                      <li key={i} className="flex items-center text-gray-400">
                        <CheckCircle className="w-4 h-4 text-green-400 mr-2" />
                        {benefit}
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="text-center"
          >
            <div className="glass rounded-3xl p-12">
              <h2 className="text-3xl font-bold text-white mb-6">
                Ready to experience these features?
              </h2>
              <p className="text-gray-300 mb-8 max-w-2xl mx-auto">
                Start your free trial today and see how ProfitWave can transform your investment strategy.
              </p>
              <Link href="/get-started">
                <motion.button
                  className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-8 py-4 rounded-full font-semibold text-lg hover:from-purple-600 hover:to-pink-600 transition-all duration-200 flex items-center justify-center group mx-auto"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Start Now
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </motion.button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
      
      <Footer />
    </div>
  )
}
