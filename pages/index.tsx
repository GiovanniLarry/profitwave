import React from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, Shield, Globe, Users, ArrowRight, Star, BarChart3, Zap, Lock } from 'lucide-react'
import HeroSection from '../components/HeroSection'
import FeaturesSection from '../components/FeaturesSection'
import StatsSection from '../components/StatsSection'
import TestimonialsSection from '../components/TestimonialsSection'
import CTASection from '../components/CTASection'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <Navbar />
      <HeroSection />
      <FeaturesSection />
      <StatsSection />
      <TestimonialsSection />
      <CTASection />
      <Footer />
    </div>
  )
}
