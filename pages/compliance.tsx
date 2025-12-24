import React from 'react'
import { motion } from 'framer-motion'
import { Shield, CheckCircle, Award, FileText, Globe, Lock, ArrowRight } from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

export default function CompliancePage() {
  const certifications = [
    {
      name: "SOC 2 Type II",
      description: "Certified for security, availability, processing integrity, confidentiality, and privacy",
      status: "certified",
      date: "2024"
    },
    {
      name: "ISO 27001",
      description: "International standard for information security management",
      status: "certified",
      date: "2024"
    },
    {
      name: "GDPR Compliant",
      description: "General Data Protection Regulation compliance for EU users",
      status: "compliant",
      date: "Ongoing"
    },
    {
      name: "CCPA Compliant",
      description: "California Consumer Privacy Act compliance",
      status: "compliant",
      date: "Ongoing"
    }
  ]

  const regulations = [
    {
      region: "United States",
      regulations: ["SEC Regulations", "FINRA Rules", "AML/KYC Requirements", "State Securities Laws"],
      status: "Fully Compliant"
    },
    {
      region: "European Union",
      regulations: ["MiFID II", "GDPR", "AML Directives", "EMIR"],
      status: "Fully Compliant"
    },
    {
      region: "Asia Pacific",
      regulations: ["ASIC Regulations", "MAS Rules", "SFC Requirements", "Local AML Laws"],
      status: "Fully Compliant"
    },
    {
      region: "United Kingdom",
      regulations: ["FCA Regulations", "UK GDPR", "MLR 2017", "SMCR"],
      status: "Fully Compliant"
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
                Compliance & Security
              </span>
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Our commitment to regulatory compliance and the highest security standards
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mb-16"
          >
            <h2 className="text-3xl font-bold text-white mb-8 text-center">Certifications & Standards</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {certifications.map((cert, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.6, delay: 0.3 + index * 0.1 }}
                  whileHover={{ scale: 1.05 }}
                  className="glass rounded-2xl p-6"
                >
                  <div className="flex items-center mb-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center mr-4 ${
                      cert.status === 'certified' 
                        ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                        : 'bg-gradient-to-r from-blue-500 to-cyan-500'
                    }`}>
                      {cert.status === 'certified' ? (
                        <Award className="w-6 h-6 text-white" />
                      ) : (
                        <CheckCircle className="w-6 h-6 text-white" />
                      )}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">{cert.name}</h3>
                      <span className={`text-sm ${
                        cert.status === 'certified' ? 'text-green-400' : 'text-blue-400'
                      }`}>
                        {cert.status === 'certified' ? 'Certified' : 'Compliant'} • {cert.date}
                      </span>
                    </div>
                  </div>
                  <p className="text-gray-300">{cert.description}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mb-16"
          >
            <h2 className="text-3xl font-bold text-white mb-8 text-center">Global Regulatory Compliance</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {regulations.map((region, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.5 + index * 0.1 }}
                  className="glass rounded-2xl p-6"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-white flex items-center">
                      <Globe className="w-5 h-5 text-purple-400 mr-2" />
                      {region.region}
                    </h3>
                    <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm">
                      {region.status}
                    </span>
                  </div>
                  <ul className="space-y-2">
                    {region.regulations.map((reg, i) => (
                      <li key={i} className="flex items-center text-gray-300">
                        <CheckCircle className="w-4 h-4 text-green-400 mr-2" />
                        {reg}
                      </li>
                    ))}
                  </ul>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="glass rounded-3xl p-12 mb-16"
          >
            <h2 className="text-3xl font-bold text-white mb-6 text-center">Security Measures</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Lock className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Data Encryption</h3>
                <p className="text-gray-400">256-bit AES encryption for all data at rest and in transit</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Regular Audits</h3>
                <p className="text-gray-400">Quarterly security audits and penetration testing</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Documentation</h3>
                <p className="text-gray-400">Comprehensive compliance documentation and reporting</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="text-center"
          >
            <div className="glass rounded-3xl p-12">
              <h2 className="text-3xl font-bold text-white mb-6">
                Compliance Documentation
              </h2>
              <p className="text-gray-300 mb-8 max-w-2xl mx-auto">
                Access our compliance documentation and certificates for due diligence purposes.
              </p>
              <motion.button
                className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-8 py-4 rounded-full font-semibold text-lg hover:from-purple-600 hover:to-pink-600 transition-all duration-200 flex items-center justify-center group mx-auto"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Request Documentation
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </motion.button>
            </div>
          </motion.div>
        </div>
      </section>
      
      <Footer />
    </div>
  )
}
