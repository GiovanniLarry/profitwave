import React from 'react'
import { motion } from 'framer-motion'
import { Calendar, ExternalLink, Download, Award, TrendingUp, Globe, Users, ArrowRight } from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

export default function PressPage() {
  const pressReleases = [
    {
      date: "December 10, 2024",
      title: "ProfitWave Raises $50M Series B to Expand AI Trading Platform",
      excerpt: "Leading investment platform secures funding to enhance AI capabilities and expand global reach.",
      category: "Funding"
    },
    {
      date: "November 28, 2024",
      title: "ProfitWave Reaches 50,000 Active Users Worldwide",
      excerpt: "Rapid growth demonstrates strong demand for AI-powered investment tools.",
      category: "Milestone"
    },
    {
      date: "November 15, 2024",
      title: "New AI Features Deliver 40% Better Trading Performance",
      excerpt: "Latest machine learning models show significant improvement in prediction accuracy.",
      category: "Product"
    },
    {
      date: "October 30, 2024",
      title: "ProfitWave Launches in 25 New Countries",
      excerpt: "Expansion brings sophisticated trading tools to emerging markets.",
      category: "Expansion"
    }
  ]

  const mediaCoverage = [
    {
      outlet: "TechCrunch",
      title: "How ProfitWave is Democratizing AI Trading",
      date: "December 8, 2024",
      link: "#",
      category: "Technology"
    },
    {
      outlet: "Forbes",
      title: "The Future of Investing: AI-Powered Platforms",
      date: "December 5, 2024",
      link: "#",
      category: "Business"
    },
    {
      outlet: "Bloomberg",
      title: "Retail Trading Gets an AI Upgrade",
      date: "December 1, 2024",
      link: "#",
      category: "Finance"
    },
    {
      outlet: "Reuters",
      title: "Startup Raises $50M for AI Trading Platform",
      date: "November 28, 2024",
      link: "#",
      category: "News"
    }
  ]

  const awards = [
    {
      name: "Best FinTech Innovation 2024",
      organization: "Global Finance Awards",
      date: "November 2024"
    },
    {
      name: "AI Breakthrough Award",
      organization: "AI Technology Awards",
      date: "October 2024"
    },
    {
      name: "Top Startup to Watch",
      organization: "VentureBeat",
      date: "September 2024"
    }
  ]

  const pressKit = [
    {
      title: "Company Overview",
      description: "Complete company information and story",
      download: true
    },
    {
      title: "Product Screenshots",
      description: "High-resolution images of our platform",
      download: true
    },
    {
      title: "Executive Bios",
      description: "Leadership team profiles and headshots",
      download: true
    },
    {
      title: "Fact Sheet",
      description: "Key metrics and company statistics",
      download: true
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
                Press & Media
              </span>
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Latest news, announcements, and media resources about ProfitWave
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 mb-16">
            <div className="lg:col-span-2">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
              >
                <h2 className="text-3xl font-bold text-white mb-8">Press Releases</h2>
                <div className="space-y-6">
                  {pressReleases.map((release, index) => (
                    <motion.article
                      key={index}
                      initial={{ opacity: 0, x: -30 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.6, delay: 0.3 + index * 0.1 }}
                      whileHover={{ y: -5 }}
                      className="glass rounded-2xl p-6 hover:bg-white/10 transition-all duration-300"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm text-purple-400 font-semibold">{release.category}</span>
                        <span className="text-sm text-gray-400">{release.date}</span>
                      </div>
                      <h3 className="text-xl font-bold text-white mb-2 hover:text-purple-400 transition-colors cursor-pointer">
                        {release.title}
                      </h3>
                      <p className="text-gray-300 mb-4">{release.excerpt}</p>
                      <motion.button
                        className="flex items-center text-purple-400 hover:text-purple-300 transition-colors font-medium"
                        whileHover={{ x: 5 }}
                      >
                        Read Full Release
                        <ArrowRight className="ml-2 w-4 h-4" />
                      </motion.button>
                    </motion.article>
                  ))}
                </div>
              </motion.div>
            </div>

            <div>
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="mb-12"
              >
                <h2 className="text-2xl font-bold text-white mb-6">Press Kit</h2>
                <div className="space-y-4">
                  {pressKit.map((item, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: 30 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.6, delay: 0.5 + index * 0.1 }}
                      whileHover={{ x: -5 }}
                      className="glass rounded-xl p-4 hover:bg-white/10 transition-all duration-300 cursor-pointer"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-white font-semibold mb-1">{item.title}</h4>
                          <p className="text-gray-400 text-sm">{item.description}</p>
                        </div>
                        {item.download && (
                          <Download className="w-5 h-5 text-purple-400" />
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.6 }}
              >
                <h2 className="text-2xl font-bold text-white mb-6">Contact</h2>
                <div className="glass rounded-xl p-6">
                  <p className="text-gray-300 mb-4">
                    For media inquiries, please contact our press team:
                  </p>
                  <div className="space-y-2 text-gray-400">
                    <p>Email: press@profitwave.com</p>
                    <p>Phone: +1 (555) 123-4567</p>
                    <p>Response time: Within 24 hours</p>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.7 }}
            className="mb-16"
          >
            <h2 className="text-3xl font-bold text-white mb-8 text-center">Media Coverage</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {mediaCoverage.map((coverage, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.8 + index * 0.1 }}
                  whileHover={{ y: -5 }}
                  className="glass rounded-2xl p-6 hover:bg-white/10 transition-all duration-300"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-purple-400 font-semibold">{coverage.category}</span>
                    <span className="text-sm text-gray-400">{coverage.date}</span>
                  </div>
                  <h3 className="text-lg font-bold text-white mb-1">{coverage.outlet}</h3>
                  <p className="text-gray-300 mb-3">{coverage.title}</p>
                  <motion.a
                    href={coverage.link}
                    className="flex items-center text-purple-400 hover:text-purple-300 transition-colors font-medium"
                    whileHover={{ x: 5 }}
                  >
                    Read Article
                    <ExternalLink className="ml-2 w-4 h-4" />
                  </motion.a>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.9 }}
          >
            <h2 className="text-3xl font-bold text-white mb-8 text-center">Awards & Recognition</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {awards.map((award, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.6, delay: 1.0 + index * 0.1 }}
                  whileHover={{ scale: 1.05 }}
                  className="text-center"
                >
                  <div className="w-16 h-16 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Award className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">{award.name}</h3>
                  <p className="text-purple-400 font-medium mb-1">{award.organization}</p>
                  <p className="text-gray-400 text-sm">{award.date}</p>
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
