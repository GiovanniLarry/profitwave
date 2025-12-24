import React from 'react'
import { motion } from 'framer-motion'
import { FileText, Shield, AlertTriangle, ArrowRight } from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

export default function TermsPage() {
  const sections = [
    {
      title: "Acceptance of Terms",
      content: "By accessing and using ProfitWave, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service."
    },
    {
      title: "Use License",
      content: "Permission is granted to temporarily download one copy of ProfitWave for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not modify or copy the materials."
    },
    {
      title: "Disclaimer",
      content: "The materials on ProfitWave are provided on an 'as is' basis. ProfitWave makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights."
    },
    {
      title: "Limitations",
      content: "In no event shall ProfitWave or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on ProfitWave."
    },
    {
      title: "Accuracy of Materials",
      content: "The materials appearing on ProfitWave could include technical, typographical, or photographic errors. ProfitWave does not warrant that any of the materials on its website are accurate, complete, or current."
    },
    {
      title: "Links",
      content: "ProfitWave has not reviewed all of the sites linked to our Internet site and is not responsible for the contents of any such linked site. The inclusion of any link does not imply endorsement by ProfitWave of the site."
    },
    {
      title: "Modifications",
      content: "ProfitWave may revise these terms of service for its website at any time without notice. By using this web site, you are agreeing to be bound by the then current version of these terms of service."
    },
    {
      title: "Governing Law",
      content: "These terms and conditions are governed by and construed in accordance with the laws of New York, United States and you irrevocably submit to the exclusive jurisdiction of the courts in that State or location."
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
                Terms of Service
              </span>
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Please read these terms of service carefully before using our service.
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
            <div className="flex items-center justify-center mb-6">
              <AlertTriangle className="w-8 h-8 text-yellow-400 mr-3" />
              <h2 className="text-3xl font-bold text-white">Important Notice</h2>
            </div>
            <p className="text-gray-300 text-center leading-relaxed">
              Trading financial instruments involves high risk and may not be suitable for all investors. 
              Before deciding to trade, you should carefully consider your investment objectives, level of experience, and risk appetite.
            </p>
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
              Download Terms of Service
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </motion.button>
          </motion.div>
        </div>
      </section>
      
      <Footer />
    </div>
  )
}
