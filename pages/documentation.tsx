import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Search, Code, Book, Terminal, Database, Network, Shield, Zap, Globe, ChevronRight, Copy, CheckCircle } from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

export default function DocumentationPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [copiedCode, setCopiedCode] = useState('')

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(''), 2000)
  }

  const sections = [
    {
      title: "Getting Started",
      icon: Book,
      items: [
        { title: "Quick Start", description: "Get up and running in minutes" },
        { title: "Authentication", description: "Learn about API keys and security" },
        { title: "Rate Limits", description: "Understanding API rate limits" },
        { title: "Error Handling", description: "Common errors and how to handle them" }
      ]
    },
    {
      title: "API Reference",
      icon: Code,
      items: [
        { title: "Markets", description: "Get market data and trading pairs" },
        { title: "Orders", description: "Place and manage orders" },
        { title: "Portfolio", description: "Access portfolio information" },
        { title: "Analytics", description: "Get AI-powered insights" }
      ]
    },
    {
      title: "SDKs & Libraries",
      icon: Terminal,
      items: [
        { title: "JavaScript SDK", description: "Node.js and browser support" },
        { title: "Python SDK", description: "Python library and examples" },
        { title: "REST API", description: "Direct API integration" },
        { title: "WebSocket", description: "Real-time data streams" }
      ]
    },
    {
      title: "Advanced Topics",
      icon: Database,
      items: [
        { title: "Webhooks", description: "Real-time event notifications" },
        { title: "Algorithmic Trading", description: "Build automated strategies" },
        { title: "Risk Management", description: "Portfolio risk tools" },
        { title: "Performance", description: "Optimize your integration" }
      ]
    }
  ]

  const codeExamples = [
    {
      title: "Authentication",
      language: "JavaScript",
      code: `const ProfitWave = require('profitwave-sdk');
const client = new ProfitWave({
  apiKey: 'your_api_key',
  secret: 'your_secret'
});`
    },
    {
      title: "Place Order",
      language: "Python",
      code: `import profitwave

client = profitwave.Client('your_api_key')
order = client.place_order(
    symbol='BTCUSD',
    side='buy',
    amount=0.01,
    price=50000
)`
    },
    {
      title: "Get Portfolio",
      language: "cURL",
      code: `curl https://api.profitwave.com/v1/portfolio \\
  -H "Authorization: Bearer your_api_key" \\
  -H "Content-Type: application/json"`
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
                Documentation
              </span>
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Everything you need to integrate with ProfitWave API
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mb-12"
          >
            <div className="relative max-w-2xl mx-auto">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search documentation..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-white/10 border border-white/20 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 transition-colors"
              />
            </div>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mb-16">
            <div className="lg:col-span-1">
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.3 }}
                className="lg:sticky lg:top-32"
              >
                <h2 className="text-2xl font-bold text-white mb-6">Navigation</h2>
                <div className="space-y-6">
                  {sections.map((section, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -30 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.6, delay: 0.4 + index * 0.1 }}
                    >
                      <div className="flex items-center mb-3">
                        <section.icon className="w-5 h-5 text-purple-400 mr-2" />
                        <h3 className="text-white font-semibold">{section.title}</h3>
                      </div>
                      <ul className="space-y-2 ml-7">
                        {section.items.map((item, i) => (
                          <li key={i}>
                            <a
                              href="#"
                              className="text-gray-400 hover:text-purple-400 transition-colors flex items-center"
                            >
                              <ChevronRight className="w-3 h-3 mr-1" />
                              {item.title}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </div>

            <div className="lg:col-span-3">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="space-y-12"
              >
                <section>
                  <h2 className="text-3xl font-bold text-white mb-6">Quick Start</h2>
                  <div className="glass rounded-2xl p-8">
                    <h3 className="text-xl font-semibold text-white mb-4">Get Your API Key</h3>
                    <p className="text-gray-300 mb-6">
                      Start by signing up for a ProfitWave account and generating your API key from the dashboard.
                    </p>
                    <div className="bg-black/50 rounded-lg p-4 mb-6">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-gray-400 text-sm">API Key:</span>
                        <button
                          onClick={() => handleCopy('your_api_key_here')}
                          className="p-1 hover:bg-white/10 rounded transition-colors"
                        >
                          {copiedCode === 'your_api_key_here' ? (
                            <CheckCircle className="w-4 h-4 text-green-400" />
                          ) : (
                            <Copy className="w-4 h-4 text-gray-400" />
                          )}
                        </button>
                      </div>
                      <code className="text-purple-400">your_api_key_here</code>
                    </div>
                  </div>
                </section>

                <section>
                  <h2 className="text-3xl font-bold text-white mb-6">Code Examples</h2>
                  <div className="space-y-6">
                    {codeExamples.map((example, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.5 + index * 0.1 }}
                        className="glass rounded-2xl p-6"
                      >
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-xl font-semibold text-white">{example.title}</h3>
                          <span className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded-full text-sm">
                            {example.language}
                          </span>
                        </div>
                        <div className="relative">
                          <pre className="bg-black/50 rounded-lg p-4 text-sm text-gray-300 overflow-x-auto">
                            <code>{example.code}</code>
                          </pre>
                          <button
                            onClick={() => handleCopy(example.code)}
                            className="absolute top-2 right-2 p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
                          >
                            {copiedCode === example.code ? (
                              <CheckCircle className="w-4 h-4 text-green-400" />
                            ) : (
                              <Copy className="w-4 h-4 text-gray-400" />
                            )}
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </section>

                <section>
                  <h2 className="text-3xl font-bold text-white mb-6">API Endpoints</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[
                      { method: "GET", endpoint: "/v1/markets", description: "List available markets" },
                      { method: "POST", endpoint: "/v1/orders", description: "Place new order" },
                      { method: "GET", endpoint: "/v1/portfolio", description: "Get portfolio data" },
                      { method: "GET", endpoint: "/v1/analytics", description: "AI-powered insights" }
                    ].map((endpoint, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.6 + index * 0.1 }}
                        className="glass rounded-xl p-4"
                      >
                        <div className="flex items-center mb-2">
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${
                            endpoint.method === 'GET' 
                              ? 'bg-green-500/20 text-green-400'
                              : 'bg-blue-500/20 text-blue-400'
                          }`}>
                            {endpoint.method}
                          </span>
                          <code className="text-purple-400 ml-3">{endpoint.endpoint}</code>
                        </div>
                        <p className="text-gray-400 text-sm">{endpoint.description}</p>
                      </motion.div>
                    ))}
                  </div>
                </section>
              </motion.div>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="text-center"
          >
            <div className="glass rounded-3xl p-12">
              <h2 className="text-3xl font-bold text-white mb-6">
                Need Help?
              </h2>
              <p className="text-gray-300 mb-8 max-w-2xl mx-auto">
                Our support team is here to help you integrate with our API successfully.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <motion.button
                  className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-8 py-4 rounded-full font-semibold text-lg hover:from-purple-600 hover:to-pink-600 transition-all duration-200"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Contact Support
                </motion.button>
                <motion.button
                  className="glass text-white px-8 py-4 rounded-full font-semibold text-lg hover:bg-white/20 transition-all duration-200"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Join Community
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
