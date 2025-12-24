import React from 'react'
import { motion } from 'framer-motion'
import { Star, Quote } from 'lucide-react'

export default function TestimonialsSection() {
  const testimonials = [
    {
      name: "Sarah Chen",
      role: "Venture Capitalist",
      content: "ProfitWave transformed my investment strategy. The AI insights are incredibly accurate and have helped me achieve 40% returns this year.",
      rating: 5,
      avatar: "SC"
    },
    {
      name: "Michael Rodriguez",
      role: "Day Trader",
      content: "The lightning-fast execution speeds and real-time analytics give me the edge I need in competitive markets. Absolutely essential tool.",
      rating: 5,
      avatar: "MR"
    },
    {
      name: "Emma Thompson",
      role: "Portfolio Manager",
      content: "The risk management features are outstanding. I can now manage multiple portfolios with confidence and precision.",
      rating: 5,
      avatar: "ET"
    }
  ]

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="gradient-text">
              Trusted by Investors Worldwide
            </span>
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            See what our successful users have to say about their experience
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              whileHover={{ y: -10 }}
              className="group"
            >
              <div className="h-full glass rounded-2xl p-8 hover:bg-white/15 transition-all duration-300">
                <div className="flex items-center mb-4">
                  <Quote className="w-8 h-8 text-purple-400 mr-2" />
                  <div className="flex">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                    ))}
                  </div>
                </div>
                <p className="text-gray-300 mb-6 leading-relaxed">
                  "{testimonial.content}"
                </p>
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold mr-4">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <div className="font-semibold text-white">{testimonial.name}</div>
                    <div className="text-gray-400 text-sm">{testimonial.role}</div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
