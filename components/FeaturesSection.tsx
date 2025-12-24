import React from 'react'
import { motion } from 'framer-motion'
import { Shield, Globe, Users, Zap, Lock, Brain, TrendingUp, Target } from 'lucide-react'

export default function FeaturesSection() {
  const features = [
    {
      icon: Brain,
      title: "AI-Powered Analytics",
      description: "Advanced machine learning algorithms analyze market trends and predict optimal investment opportunities in real-time.",
      gradient: "from-purple-500 to-pink-500"
    },
    {
      icon: Shield,
      title: "Bank-Level Security",
      description: "Your investments are protected with military-grade encryption and multi-factor authentication.",
      gradient: "from-blue-500 to-cyan-500"
    },
    {
      icon: Zap,
      title: "Lightning Fast Trades",
      description: "Execute trades in milliseconds with our optimized infrastructure and global server network.",
      gradient: "from-yellow-500 to-orange-500"
    },
    {
      icon: Globe,
      title: "Global Markets",
      description: "Access thousands of stocks, cryptocurrencies, and commodities from markets worldwide.",
      gradient: "from-green-500 to-emerald-500"
    },
    {
      icon: Users,
      title: "Expert Community",
      description: "Connect with seasoned investors and share strategies in our exclusive trading community.",
      gradient: "from-indigo-500 to-purple-500"
    },
    {
      icon: Lock,
      title: "Risk Management",
      description: "Automated risk assessment tools help you maintain a balanced and secure portfolio.",
      gradient: "from-red-500 to-pink-500"
    }
  ]

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Powerful Features
            </span>
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Everything you need to succeed in the modern investment landscape
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              whileHover={{ y: -10 }}
              className="group"
            >
              <div className="h-full bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-8 hover:bg-white/10 transition-all duration-300 hover:border-purple-500/50">
                <motion.div
                  className={`w-16 h-16 bg-gradient-to-r ${feature.gradient} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}
                >
                  <feature.icon className="w-8 h-8 text-white" />
                </motion.div>
                <h3 className="text-2xl font-bold text-white mb-4">{feature.title}</h3>
                <p className="text-gray-300 leading-relaxed">{feature.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
