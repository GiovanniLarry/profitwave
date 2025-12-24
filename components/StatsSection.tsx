import React from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, Users, DollarSign, Award, Globe, Clock } from 'lucide-react'

export default function StatsSection() {
  const stats = [
    { icon: DollarSign, value: "$3M", label: "Assets Under Management", color: "from-green-400 to-emerald-400" },
    { icon: Users, value: "50K+", label: "Active Investors", color: "from-blue-400 to-cyan-400" },
    { icon: TrendingUp, value: "94%", label: "Success Rate", color: "from-purple-400 to-pink-400" },
    { icon: Globe, value: "150+", label: "Countries Served", color: "from-yellow-400 to-orange-400" },
    { icon: Award, value: "25+", label: "Industry Awards", color: "from-red-400 to-pink-400" },
    { icon: Clock, value: "24/7", label: "Trading Support", color: "from-indigo-400 to-purple-400" }
  ]

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-purple-900/20 to-pink-900/20">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              Trusted by Thousands
            </span>
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Join a global community of successful investors
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              whileHover={{ scale: 1.05 }}
              className="text-center group"
            >
              <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-8 hover:bg-white/10 transition-all duration-300 hover:border-white/20">
                <motion.div
                  className={`w-16 h-16 bg-gradient-to-r ${stat.color} rounded-full flex items-center justify-center mx-auto mb-6 group-hover:rotate-12 transition-transform duration-300`}
                >
                  <stat.icon className="w-8 h-8 text-white" />
                </motion.div>
                <motion.div
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 1, delay: index * 0.1 + 0.3 }}
                  className="text-4xl font-bold text-white mb-2"
                >
                  {stat.value}
                </motion.div>
                <div className="text-gray-300">{stat.label}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
