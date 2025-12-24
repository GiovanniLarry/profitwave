import React from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, Zap, Shield, TrendingUp } from 'lucide-react'
import Link from 'next/link'

export default function CTASection() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center"
        >
          <div className="glass rounded-3xl p-12 glow-hover transition-all duration-300">
            <motion.div
              animate={{
                background: [
                  "linear-gradient(135deg, rgba(147, 51, 234, 0.1) 0%, rgba(236, 72, 153, 0.1) 100%)",
                  "linear-gradient(135deg, rgba(236, 72, 153, 0.1) 0%, rgba(147, 51, 234, 0.1) 100%)",
                  "linear-gradient(135deg, rgba(147, 51, 234, 0.1) 0%, rgba(236, 72, 153, 0.1) 100%)"
                ]
              }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
              className="rounded-2xl p-8"
            >
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                <span className="gradient-text">
                  Ready to Transform Your Investment Journey?
                </span>
              </h2>
              <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
                Join thousands of successful investors who are already using ProfitWave to maximize their returns and minimize risks.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {[
                  { icon: Zap, text: "Start in minutes" },
                  { icon: Shield, text: "Risk-free trial" },
                  { icon: TrendingUp, text: "Proven results" }
                ].map((item, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.2 + index * 0.1 }}
                    className="flex items-center justify-center space-x-2 text-gray-300"
                  >
                    <item.icon className="w-5 h-5 text-purple-400" />
                    <span>{item.text}</span>
                  </motion.div>
                ))}
              </div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.5 }}
                className="flex justify-center"
              >
                <Link href="/signup">
                  <motion.button
                    className="button-gradient text-white px-8 py-4 rounded-full font-semibold text-lg flex items-center justify-center group"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Sign Up
                    <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </motion.button>
                </Link>
              </motion.div>

              <motion.p
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.7 }}
                className="text-gray-400 mt-6 text-sm"
              >
                No credit card required • Cancel anytime • 14-day free trial
              </motion.p>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
