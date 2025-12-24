import React from 'react'
import { motion } from 'framer-motion'
import { Shield, Lock, Eye, CheckCircle, AlertTriangle, Server, Key, Fingerprint, Award } from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

export default function SecurityPage() {
  const securityFeatures = [
    {
      icon: Shield,
      title: "Bank-Level Encryption",
      description: "All data is encrypted using AES-256 encryption, the same standard used by banks and financial institutions worldwide.",
      details: ["256-bit AES encryption", "TLS 1.3 for all communications", "End-to-end encryption"]
    },
    {
      icon: Fingerprint,
      title: "Multi-Factor Authentication",
      description: "Protect your account with multiple layers of security including biometric authentication and hardware tokens.",
      details: ["Biometric authentication", "Hardware token support", "Time-based OTP"]
    },
    {
      icon: Server,
      title: "Secure Infrastructure",
      description: "Our infrastructure is hosted in SOC 2 compliant data centers with 24/7 monitoring and intrusion detection.",
      details: ["SOC 2 Type II certified", "24/7 security monitoring", "DDoS protection"]
    },
    {
      icon: Key,
      title: "API Security",
      description: "All API endpoints are secured with OAuth 2.0, rate limiting, and comprehensive access controls.",
      details: ["OAuth 2.0 authentication", "Rate limiting", "IP whitelisting"]
    }
  ]

  const compliance = [
    { name: "SOC 2 Type II", status: "certified", icon: Award },
    { name: "GDPR", status: "compliant", icon: CheckCircle },
    { name: "CCPA", status: "compliant", icon: CheckCircle },
    { name: "PCI DSS", status: "certified", icon: Award }
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
                Security First
              </span>
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Your financial data is protected with enterprise-grade security measures
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
            {securityFeatures.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                whileHover={{ y: -10 }}
                className="group"
              >
                <div className="h-full glass rounded-2xl p-8 hover:bg-white/10 transition-all duration-300">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                    <feature.icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-4">{feature.title}</h3>
                  <p className="text-gray-300 mb-6 leading-relaxed">{feature.description}</p>
                  <ul className="space-y-2">
                    {feature.details.map((detail, i) => (
                      <li key={i} className="flex items-center text-gray-400">
                        <CheckCircle className="w-4 h-4 text-green-400 mr-2" />
                        {detail}
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
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mb-16"
          >
            <div className="glass rounded-3xl p-12">
              <h2 className="text-3xl font-bold text-white mb-8 text-center">
                Compliance & Certifications
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {compliance.map((item, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6, delay: 0.5 + index * 0.1 }}
                    className="text-center"
                  >
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 ${
                      item.status === 'certified' 
                        ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                        : 'bg-gradient-to-r from-blue-500 to-cyan-500'
                    }`}>
                      <item.icon className="w-8 h-8 text-white" />
                    </div>
                    <div className="font-semibold text-white mb-1">{item.name}</div>
                    <div className={`text-sm ${
                      item.status === 'certified' ? 'text-green-400' : 'text-blue-400'
                    }`}>
                      {item.status === 'certified' ? 'Certified' : 'Compliant'}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="mb-16"
          >
            <div className="glass rounded-3xl p-12">
              <h2 className="text-3xl font-bold text-white mb-6 text-center">
                Security Best Practices
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="text-center">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Eye className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">Regular Audits</h3>
                  <p className="text-gray-400">Quarterly security audits by independent third-party firms</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertTriangle className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">Bug Bounty Program</h3>
                  <p className="text-gray-400">Continuous testing by security researchers worldwide</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Lock className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">Zero-Knowledge Architecture</h3>
                  <p className="text-gray-400">We can't access your financial data even if we wanted to</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
      
      <Footer />
    </div>
  )
}
