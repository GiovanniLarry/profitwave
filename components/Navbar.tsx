import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Menu, X, TrendingUp, ChevronDown } from 'lucide-react'
import Link from 'next/link'

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState('')

  const navItems = [
    { name: 'Home', href: '/' },
    { 
      name: 'Product', 
      href: '#',
      dropdown: [
        { name: 'Features', href: '/features' },
        { name: 'Security', href: '/security' }
      ]
    },
    { 
      name: 'Company', 
      href: '#',
      dropdown: [
        { name: 'About', href: '/about' },
        { name: 'Blog', href: '/blog' },
        { name: 'Press', href: '/press' }
      ]
    },
    { 
      name: 'Resources', 
      href: '#',
      dropdown: [
        { name: 'Documentation', href: '/documentation' },
        { name: 'Support', href: '/support' },
        { name: 'Community', href: '/community' }
      ]
    },
    { 
      name: 'Legal', 
      href: '#',
      dropdown: [
        { name: 'Privacy', href: '/privacy' },
        { name: 'Terms', href: '/terms' },
        { name: 'Cookie Policy', href: '/cookie-policy' },
        { name: 'Compliance', href: '/compliance' }
      ]
    }
  ]

  return (
    <motion.nav 
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="fixed top-0 w-full z-50 bg-black/20 backdrop-blur-lg border-b border-white/10"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/">
            <motion.div 
              className="flex items-center space-x-2 cursor-pointer"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              <TrendingUp className="h-8 w-8 text-purple-400" />
              <span className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                ProfitWave
              </span>
            </motion.div>
          </Link>

          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <div key={item.name} className="relative">
                {item.dropdown ? (
                  <div
                    className="relative"
                    onMouseEnter={() => setDropdownOpen(item.name)}
                    onMouseLeave={() => setDropdownOpen('')}
                  >
                    <motion.button
                      className="text-gray-300 hover:text-white transition-colors duration-200 flex items-center"
                      whileHover={{ y: -2 }}
                      transition={{ type: "spring", stiffness: 400, damping: 10 }}
                    >
                      {item.name}
                      <ChevronDown className="ml-1 h-4 w-4" />
                    </motion.button>
                    {dropdownOpen === item.name && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="absolute top-full left-0 mt-2 w-48 glass rounded-lg shadow-lg"
                      >
                        {item.dropdown.map((subItem) => (
                          <Link
                            key={subItem.name}
                            href={subItem.href}
                            className="block px-4 py-2 text-gray-300 hover:text-white hover:bg-white/10 transition-colors duration-200"
                          >
                            {subItem.name}
                          </Link>
                        ))}
                      </motion.div>
                    )}
                  </div>
                ) : (
                  <Link href={item.href}>
                    <motion.div
                      className="text-gray-300 hover:text-white transition-colors duration-200 cursor-pointer"
                      whileHover={{ y: -2 }}
                      transition={{ type: "spring", stiffness: 400, damping: 10 }}
                    >
                      {item.name}
                    </motion.div>
                  </Link>
                )}
              </div>
            ))}
            <Link href="/get-started">
              <motion.button
                className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-2 rounded-full font-semibold hover:from-purple-600 hover:to-pink-600 transition-all duration-200"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Start Now
              </motion.button>
            </Link>
          </div>

          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-gray-300 hover:text-white"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="md:hidden bg-black/90 backdrop-blur-lg border-b border-white/10"
        >
          <div className="px-2 pt-2 pb-3 space-y-1">
            {navItems.map((item) => (
              <div key={item.name}>
                {item.dropdown ? (
                  <div>
                    <div className="px-3 py-2 text-gray-300 font-semibold">
                      {item.name}
                    </div>
                    {item.dropdown.map((subItem) => (
                      <Link
                        key={subItem.name}
                        href={subItem.href}
                        className="block px-6 py-2 text-gray-300 hover:text-white transition-colors duration-200"
                        onClick={() => setIsOpen(false)}
                      >
                        {subItem.name}
                      </Link>
                    ))}
                  </div>
                ) : (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="block px-3 py-2 text-gray-300 hover:text-white transition-colors duration-200"
                    onClick={() => setIsOpen(false)}
                  >
                    {item.name}
                  </Link>
                )}
              </div>
            ))}
            <Link href="/get-started" onClick={() => setIsOpen(false)}>
              <button className="w-full text-left bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 py-2 rounded-full font-semibold">
                Start Now
              </button>
            </Link>
          </div>
        </motion.div>
      )}
    </motion.nav>
  )
}
