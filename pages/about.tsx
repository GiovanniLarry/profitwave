import React from 'react'
import { motion } from 'framer-motion'
import { Users, Target, Award, Globe, TrendingUp, Heart, ArrowRight, CheckCircle } from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

export default function AboutPage() {
  const values = [
    {
      icon: Target,
      title: "Mission",
      description: "To democratize access to sophisticated investment tools and make professional trading accessible to everyone."
    },
    {
      icon: Heart,
      title: "Values",
      description: "We believe in transparency, innovation, and putting our users' success first in everything we do."
    },
    {
      icon: Award,
      title: "Excellence",
      description: "We strive for excellence in our technology, security, and customer service to exceed expectations."
    }
  ]

  const stats = [
    { number: "50K+", label: "Active Users" },
    { number: "150+", label: "Countries" },
    { number: "94%", label: "Success Rate" },
    { number: "24/7", label: "Support" }
  ]

  const team = [
    {
      name: "Sarah Chen",
      role: "CEO & Co-Founder",
      bio: "Former VP of Engineering at leading fintech company with 15+ years in AI and trading systems.",
      image: "SC"
    },
    {
      name: "Michael Rodriguez",
      role: "CTO & Co-Founder",
      bio: "Ex-Google senior engineer specializing in machine learning and distributed systems.",
      image: "MR"
    },
    {
      name: "Emma Thompson",
      role: "Head of Product",
      bio: "Product leader with experience building trading platforms used by millions worldwide.",
      image: "ET"
    },
    {
      name: "David Kim",
      role: "Head of Security",
      bio: "Cybersecurity expert with background in protecting financial systems for major banks.",
      image: "DK"
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
                About ProfitWave
              </span>
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Empowering investors worldwide with AI-driven trading solutions since 2020
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="glass rounded-3xl p-12 mb-16"
          >
            <h2 className="text-3xl font-bold text-white mb-6 text-center">Our Story</h2>
            <p className="text-gray-300 leading-relaxed text-lg max-w-4xl mx-auto">
              ProfitWave was founded with a simple mission: to level the playing field in financial markets. 
              We saw how institutional investors had access to sophisticated AI tools while retail investors 
              were left behind. Our team of engineers, traders, and data scientists came together to build 
              a platform that brings institutional-grade analytics to everyone.
            </p>
            <p className="text-gray-300 leading-relaxed text-lg max-w-4xl mx-auto mt-4">
              Today, we're proud to serve over 50,000 investors across 150+ countries, helping them make 
              smarter decisions with our AI-powered insights and intuitive trading platform.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            {values.map((value, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 + index * 0.1 }}
                className="text-center"
              >
                <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <value.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">{value.title}</h3>
                <p className="text-gray-300 leading-relaxed">{value.description}</p>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="mb-16"
          >
            <h2 className="text-3xl font-bold text-white mb-8 text-center">Our Impact</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map((stat, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.6, delay: 0.7 + index * 0.1 }}
                  className="text-center"
                >
                  <div className="text-4xl font-bold text-white mb-2">{stat.number}</div>
                  <div className="text-gray-400">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="mb-16"
          >
            <h2 className="text-3xl font-bold text-white mb-8 text-center">Leadership Team</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {team.map((member, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.9 + index * 0.1 }}
                  whileHover={{ y: -10 }}
                  className="text-center group"
                >
                  <div className="mb-4">
                    <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto group-hover:scale-110 transition-transform duration-300">
                      {member.image}
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-1">{member.name}</h3>
                  <div className="text-purple-400 font-medium mb-3">{member.role}</div>
                  <p className="text-gray-400 text-sm leading-relaxed">{member.bio}</p>
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
