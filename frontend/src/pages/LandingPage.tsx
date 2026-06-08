import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Truck, MapPin, BarChart3, Shield, Zap, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-hero-gradient text-white overflow-hidden">
      <nav className="flex items-center justify-between px-6 lg:px-12 py-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
            <Truck className="w-5 h-5" />
          </div>
          <span className="font-bold text-xl">FleetFlow</span>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/login"><Button variant="ghost" className="text-white hover:bg-white/10">Sign in</Button></Link>
          <Link to="/register"><Button variant="gradient">Get Started <ArrowRight className="w-4 h-4" /></Button></Link>
        </div>
      </nav>

      <section className="max-w-7xl mx-auto px-6 lg:px-12 pt-16 pb-24 text-center">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <span className="inline-block px-4 py-1.5 rounded-full bg-white/10 text-sm mb-6 border border-white/10">
            Realtime Fleet Tracking & Logistics
          </span>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6">
            Move smarter.<br />
            <span className="bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">Track everything.</span>
          </h1>
          <p className="text-lg text-white/70 max-w-2xl mx-auto mb-10">
            Professional SaaS-grade logistics platform. Live fleet tracking, delivery management, and analytics — all in one beautiful dashboard.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register"><Button size="lg" variant="gradient" className="w-full sm:w-auto">Create Free Account</Button></Link>
            <Link to="/login"><Button size="lg" variant="outline" className="w-full sm:w-auto border-white/20 text-white hover:bg-white/10">Sign In</Button></Link>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="mt-20 grid md:grid-cols-3 gap-6"
        >
          {[
            { icon: MapPin, title: 'Live Tracking', desc: 'Real-time driver locations on interactive maps' },
            { icon: BarChart3, title: 'Analytics', desc: 'Revenue, delivery metrics, and fleet insights' },
            { icon: Shield, title: 'Enterprise Security', desc: 'JWT auth, role-based access, encrypted data' },
          ].map((f) => (
            <div key={f.title} className="glass rounded-2xl p-8 text-left card-hover">
              <div className="w-12 h-12 rounded-xl bg-violet-500/20 flex items-center justify-center mb-4">
                <f.icon className="w-6 h-6 text-violet-300" />
              </div>
              <h3 className="text-xl font-semibold mb-2">{f.title}</h3>
              <p className="text-white/60 text-sm">{f.desc}</p>
            </div>
          ))}
        </motion.div>
      </section>

      <footer className="border-t border-white/10 py-8 text-center text-white/40 text-sm">
        <Zap className="w-4 h-4 inline mr-1" /> FleetFlow © 2026 — Built for modern logistics
      </footer>
    </div>
  );
}
