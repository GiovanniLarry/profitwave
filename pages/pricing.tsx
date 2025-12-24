import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Check, X, ArrowRight, Zap, Shield, Crown, Star } from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly')

  const plans = [
    {
      name: 'Starter',
      price: billingCycle === 'monthly' ? 29 : 290,
      description: 'Perfect for beginners',
      icon: Zap,
      features: [
        'Basic AI analytics',
        '100 trades per month',
        'Email support',
        'Basic portfolio tracking',
        'Market data access'
      ],
      notIncluded: [
        'Advanced AI predictions',
        'Priority support',
        'API access',
        'Custom strategies'
      ],
      gradient: 'from-blue-500 to-cyan-500',
      popular: false
    },
    {
      name: 'Professional',
      price: billingCycle === 'monthly' ? 99 : 990,
      description: 'For serious investors',
      icon: Shield,
      features: [
        'Advanced AI analytics',
        'Unlimited trades',
        'Priority support',
        'Advanced portfolio tracking',
        'Real-time market data',
        'Custom strategies',
        'API access'
      ],
      notIncluded: [
        'Dedicated account manager',
        'White-label solutions'
      ],
      gradient: 'from-purple-500 to-pink-500',
      popular: true
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      description: 'For large institutions',
      icon: Crown,
      features: [
        'Everything in Professional',
        'Dedicated account manager',
        'White-label solutions',
        'Custom integrations',
        'Advanced security features',
        'Compliance reporting',
        'On-premise deployment option'
      ],
      notIncluded: [],
      gradient: 'from-yellow-500 to-orange-500',
      popular: false
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
                Simple, Transparent Pricing
              </span>
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8">
              Choose the plan that fits your investment needs
            </p>
            
            <div className="flex items-center justify-center mb-12">
              <div className="glass rounded-full p-1 flex">
                <button
                  onClick={() => setBillingCycle('monthly')}
                  className={`px-6 py-2 rounded-full transition-all duration-200 ${
                    billingCycle === 'monthly'
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                      : 'text-gray-300 hover:text-white'
                  }`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setBillingCycle('annual')}
                  className={`px-6 py-2 rounded-full transition-all duration-200 ${
                    billingCycle === 'annual'
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                      : 'text-gray-300 hover:text-white'
                  }`}
                >
                  Annual (Save 20%)
                </button>
              </div>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            {plans.map((plan, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                whileHover={{ y: -10 }}
                className={`relative ${plan.popular ? 'scale-105' : ''}`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-1 rounded-full text-sm font-semibold flex items-center">
                      <Star className="w-4 h-4 mr-1" />
                      Most Popular
                    </span>
                  </div>
                )}
                <div className={`h-full glass rounded-2xl p-8 hover:bg-white/10 transition-all duration-300 ${
                  plan.popular ? 'border-purple-500/50' : ''
                }`}>
                  <div className="flex items-center justify-between mb-6">
                    <div className={`w-12 h-12 bg-gradient-to-r ${plan.gradient} rounded-xl flex items-center justify-center`}>
                      <plan.icon className="w-6 h-6 text-white" />
                    </div>
                    {plan.popular && (
                      <div className="text-purple-400 font-semibold">POPULAR</div>
                    )}
                  </div>
                  
                  <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                  <p className="text-gray-400 mb-6">{plan.description}</p>
                  
                  <div className="mb-6">
                    <div className="text-4xl font-bold text-white">
                      {typeof plan.price === 'number' ? `$${plan.price}` : plan.price}
                    </div>
                    {typeof plan.price === 'number' && (
                      <div className="text-gray-400">
                        per {billingCycle === 'monthly' ? 'month' : 'year'}
                      </div>
                    )}
                  </div>

                  <div className="space-y-3 mb-8">
                    {plan.features.map((feature, i) => (
                      <div key={i} className="flex items-center text-gray-300">
                        <Check className="w-5 h-5 text-green-400 mr-3" />
                        {feature}
                      </div>
                    ))}
                    {plan.notIncluded.map((feature, i) => (
                      <div key={i} className="flex items-center text-gray-500">
                        <X className="w-5 h-5 text-red-400 mr-3" />
                        {feature}
                      </div>
                    ))}
                  </div>

                  <motion.button
                    className={`w-full py-3 rounded-full font-semibold transition-all duration-200 ${
                      plan.popular
                        ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600'
                        : 'bg-white/10 text-white hover:bg-white/20'
                    }`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {plan.name === 'Enterprise' ? 'Contact Sales' : 'Get Started'}
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="text-center"
          >
            <div className="glass rounded-3xl p-12">
              <h2 className="text-3xl font-bold text-white mb-6">
                Not sure which plan is right for you?
              </h2>
              <p className="text-gray-300 mb-8 max-w-2xl mx-auto">
                Our team is here to help you choose the perfect plan for your investment needs.
              </p>
              <motion.button
                className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-8 py-4 rounded-full font-semibold text-lg hover:from-purple-600 hover:to-pink-600 transition-all duration-200 flex items-center justify-center group mx-auto"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Schedule Consultation
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
