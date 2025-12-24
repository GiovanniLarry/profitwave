import React from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, Mail, Phone, MapPin, Facebook, Twitter, Linkedin, Instagram } from 'lucide-react'
import Link from 'next/link'

export default function Footer() {
  const footerLinks = {
    Product: [
      { name: 'Features', href: '/features' },
      { name: 'Security', href: '/security' }
    ],
    Company: [
      { name: 'About', href: '/about' },
      { name: 'Blog', href: '/blog' },
      { name: 'Careers', href: '/careers' },
      { name: 'Press', href: '/press' }
    ],
    Resources: [
      { name: 'Documentation', href: '/documentation' },
      { name: 'Support', href: '/support' },
      { name: 'Community', href: '/community' }
    ],
    Legal: [
      { name: 'Privacy', href: '/privacy' },
      { name: 'Terms', href: '/terms' },
      { name: 'Cookie Policy', href: '/cookie-policy' },
      { name: 'Compliance', href: '/compliance' }
    ]
  }

  const socialLinks = [
    { icon: Facebook, href: '#' },
    { icon: Twitter, href: '#' },
    { icon: Linkedin, href: '#' },
    { icon: Instagram, href: '#' }
  ]

  return (
    <footer className="bg-black/50 backdrop-blur-lg border-t border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8">
          <div className="lg:col-span-2">
            <motion.div 
              className="flex items-center space-x-2 mb-4"
              whileHover={{ scale: 1.05 }}
            >
              <TrendingUp className="h-8 w-8 text-purple-400" />
              <span className="text-2xl font-bold gradient-text">ProfitWave</span>
            </motion.div>
            <p className="text-gray-400 mb-6 max-w-sm">
              Empowering investors with AI-driven insights and cutting-edge technology for smarter trading decisions.
            </p>
          </div>

          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h3 className="text-white font-semibold mb-4">{category}</h3>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.name}>
                    <Link href={link.href}>
                      <motion.div
                        className="text-gray-400 hover:text-white transition-colors duration-200 cursor-pointer"
                        whileHover={{ x: 5 }}
                      >
                        {link.name}
                      </motion.div>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-white/10 mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm mb-4 md:mb-0">
              © 2026 ProfitWave. All rights reserved.
            </p>
            <div className="flex items-center space-x-6 text-sm text-gray-400">
              <div className="flex items-center">
                <Mail className="w-4 h-4 mr-2" />
                support@profitwave.com
              </div>
              <div className="flex items-center">
                <Phone className="w-4 h-4 mr-2" />
                +1 (555) 123-4567
              </div>
              <div className="flex items-center">
                <MapPin className="w-4 h-4 mr-2" />
                New York, NY
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
