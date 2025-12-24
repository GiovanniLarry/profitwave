import React from 'react'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { Code, Zap, Shield, Globe, CheckCircle, Copy, Terminal, Database, Network } from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

export default function APIPage() {
  const [copiedCode, setCopiedCode] = useState('')

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(''), 2000)
  }

  const features = [
    {
      icon: Zap,
      title: "Lightning Fast",
      description: "Sub-100ms response times with global edge locations"
    },
    {
      icon: Shield,
      title: "Secure",
      description: "OAuth 2.0 authentication and enterprise-grade security"
    },
    {
      icon: Globe,
      title: "Global Coverage",
      description: "Access markets and data from 150+ countries"
    }
  ]

  const endpoints = [
    {
      method: "GET",
      path: "/api/v1/markets",
      description: "Get available markets and trading pairs",
      example: `curl https://api.profitwave.com/v1/markets \\
  -H "Authorization: Bearer YOUR_API_KEY"`
    },
    {
      method: "POST",
      path: "/api/v1/orders",
      description: "Place a new order",
      example: `curl https://api.profitwave.com/v1/orders \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"symbol": "BTCUSD", "side": "buy", "amount": 0.01}'`
    },
    {
      method: "GET",
      path: "/api/v1/portfolio",
      description: "Get portfolio information",
      example: `curl https://api.profitwave.com/v1/portfolio \\
  -H "Authorization: Bearer YOUR_API_KEY"`
    }
  ]

  const sdkExamples = [
    {
      language: "JavaScript",
      code: `const ProfitWave = require('profitwave-sdk');
const client = new ProfitWave('YOUR_API_KEY');

// Get market data
const markets = await client.getMarkets();

// Place an order
const order = await client.placeOrder({
  symbol: 'BTCUSD',
  side: 'buy',
  amount: 0.01
});`
    },
    {
      language: "Python",
      code: `import profitwave

client = profitwave.Client('YOUR_API_KEY')

# Get market data
markets = client.get_markets()

# Place an order
order = client.place_order(
    symbol='BTCUSD',
    side='buy',
    amount=0.01
)`
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
                Powerful API
              </span>
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Build custom trading solutions with our comprehensive REST API
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="text-center"
              >
                <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <feature.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-gray-400">{feature.description}</p>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mb-16"
          >
            <h2 className="text-3xl font-bold text-white mb-8 text-center">API Endpoints</h2>
            <div className="space-y-6">
              {endpoints.map((endpoint, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.5 + index * 0.1 }}
                  className="glass rounded-2xl p-6"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-4">
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                        endpoint.method === 'GET' 
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-blue-500/20 text-blue-400'
                      }`}>
                        {endpoint.method}
                      </span>
                      <code className="text-purple-400 font-mono">{endpoint.path}</code>
                    </div>
                  </div>
                  <p className="text-gray-300 mb-4">{endpoint.description}</p>
                  <div className="relative">
                    <pre className="bg-black/50 rounded-lg p-4 text-sm text-gray-300 overflow-x-auto">
                      <code>{endpoint.example}</code>
                    </pre>
                    <button
                      onClick={() => handleCopy(endpoint.example)}
                      className="absolute top-2 right-2 p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
                      aria-label="Copy code to clipboard"
                    >
                      <Copy className="w-4 h-4 text-gray-400" />
                    </button>
                    {copiedCode === endpoint.example && (
                      <div className="absolute top-2 right-2 p-2 bg-green-500 rounded-lg">
                        <CheckCircle className="w-4 h-4 text-white" />
                      </div>
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
            className="mb-16"
          >
            <h2 className="text-3xl font-bold text-white mb-8 text-center">SDK Examples</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {sdkExamples.map((sdk, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.7 + index * 0.1 }}
                  className="glass rounded-2xl p-6"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold text-white">{sdk.language}</h3>
                    <button
                      onClick={() => handleCopy(sdk.code)}
                      className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
                      aria-label="Copy SDK code to clipboard"
                    >
                      <Copy className="w-4 h-4 text-gray-400" />
                    </button>
                  </div>
                  <pre className="bg-black/50 rounded-lg p-4 text-sm text-gray-300 overflow-x-auto">
                    <code>{sdk.code}</code>
                  </pre>
                </motion.div>
              ))}
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
                Ready to Build?
              </h2>
              <p className="text-gray-300 mb-8 max-w-2xl mx-auto">
                Get your API key and start building powerful trading applications today.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <motion.button
                  className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-8 py-4 rounded-full font-semibold text-lg hover:from-purple-600 hover:to-pink-600 transition-all duration-200"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Get API Key
                </motion.button>
                <motion.button
                  className="glass text-white px-8 py-4 rounded-full font-semibold text-lg hover:bg-white/20 transition-all duration-200"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  View Documentation
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
      
      <Footer />
    </div>
  )
}
