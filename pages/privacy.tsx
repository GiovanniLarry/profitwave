import React from 'react'
import { motion } from 'framer-motion'
import { Shield, Eye, Lock, Database, Mail, Phone, ArrowRight } from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

export default function PrivacyPage() {
  const sections = [
    {
      title: "Information We Collect",
      content: "We collect information you provide directly to us, such as when you create an account, use our services, or contact us. This includes personal identification information, financial information, and usage data."
    },
    {
      title: "How We Use Your Information",
      content: "We use the information we collect to provide, maintain, and improve our services, process transactions, send you technical notices and support messages, and communicate with you about products, services, and promotional offers."
    },
    {
      title: "Information Sharing",
      content: "We do not sell, trade, or otherwise transfer your personal information to third parties without your consent, except as described in this privacy policy. We may share information with service providers who perform services on our behalf."
    },
    {
      title: "Data Security",
      content: "We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. All data is encrypted using industry-standard protocols."
    },
    {
      title: "Your Rights",
      content: "You have the right to access, update, or delete your personal information. You can also object to processing of your personal information, request data portability, or withdraw consent where applicable."
    },
    {
      title: "Cookies and Tracking",
      content: "We use cookies and similar tracking technologies to track activity on our service and hold certain information. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent."
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
                Privacy Policy
              </span>
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Your privacy is important to us. This policy explains how we collect, use, and protect your information.
            </p>
            <p className="text-gray-400 mt-4">Last updated: December 21, 2024</p>
          </motion.div>

          <div className="space-y-8 mb-16">
            {sections.map((section, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 + index * 0.1 }}
                className="glass rounded-2xl p-8"
              >
                <h2 className="text-2xl font-bold text-white mb-4">{section.title}</h2>
                <p className="text-gray-300 leading-relaxed">{section.content}</p>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="glass rounded-3xl p-12 mb-16"
          >
            <h2 className="text-3xl font-bold text-white mb-6 text-center">Contact Us</h2>
            <p className="text-gray-300 text-center mb-8">
              If you have any questions about this Privacy Policy, please contact us:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-center">
                <Mail className="w-5 h-5 text-purple-400 mr-3" />
                <span className="text-gray-300">privacy@profitwave.com</span>
              </div>
              <div className="flex items-center">
                <Phone className="w-5 h-5 text-purple-400 mr-3" />
                <span className="text-gray-300">+1 (555) 123-4567</span>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.0 }}
            className="text-center"
          >
            <motion.button
              className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-8 py-4 rounded-full font-semibold text-lg hover:from-purple-600 hover:to-pink-600 transition-all duration-200 flex items-center justify-center group mx-auto"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Download Privacy Policy
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </motion.button>
          </motion.div>
        </div>
      </section>
      
      <Footer />
    </div>
  )
}
