/**
 * Red Bull Racing x Gemos - Login Page
 * Enterprise-grade login with framer-motion animations
 * Best practices 2025 for performance and UX
 */

'use client';

import { LoginForm } from '@/components/auth/LoginForm';
import { motion } from 'framer-motion';
import Image from 'next/image';

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-rbr-dark via-rbr-dark-lighter to-rbr-dark">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Racing Lines Animation */}
        <motion.div
          className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-rbr-red to-transparent"
          animate={{
            x: ['-100%', '100%'],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
        <motion.div
          className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-rbr-navy to-transparent"
          animate={{
            x: ['100%', '-100%'],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: 'linear',
          }}
        />

        {/* Gradient Orbs */}
        <motion.div
          className="absolute top-1/4 -left-48 w-96 h-96 bg-rbr-red/10 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        <motion.div
          className="absolute bottom-1/4 -right-48 w-96 h-96 bg-rbr-navy/10 rounded-full blur-3xl"
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.5, 0.3, 0.5],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      </div>

      {/* Main Content */}
      <div className="relative z-10 w-full max-w-6xl mx-auto px-4 py-12">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Side - Branding */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="hidden lg:block space-y-8"
          >
            {/* Logos Partnership */}
            <div className="flex items-center justify-center gap-6">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
                className="relative"
              >
                <Image
                  src="/gemos-logo.png"
                  alt="Gemos Logo"
                  width={120}
                  height={120}
                  className="object-contain"
                  priority
                />
              </motion.div>

              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.5, type: 'spring', stiffness: 150 }}
                className="text-6xl font-bold text-rbr-text-muted"
              >
                ✕
              </motion.div>

              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.7, type: 'spring', stiffness: 200 }}
                className="h-32 w-32 rounded-full bg-racing-red-gradient flex items-center justify-center font-display text-white text-5xl font-black"
              >
                RBR
              </motion.div>
            </div>

            {/* Brand Title */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
              className="text-center space-y-4"
            >
              <h1 className="text-5xl font-heading font-black text-rbr-text-primary leading-tight">
                Oracle Red Bull Racing
              </h1>
              <div className="h-1 w-32 mx-auto bg-racing-red-gradient rounded-full" />
              <p className="text-2xl text-rbr-text-secondary font-medium">
                Meal Booking Platform
              </p>
              <p className="text-rbr-text-muted max-w-md mx-auto leading-relaxed">
                Sistema di prenotazione pasti enterprise per il team più veloce del mondo
              </p>
            </motion.div>

            {/* Racing Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.1 }}
              className="grid grid-cols-3 gap-4 pt-8"
            >
              {[
                { value: '24', label: 'Ore', icon: '⏱️' },
                { value: '365', label: 'Giorni', icon: '📅' },
                { value: '∞', label: 'Velocità', icon: '🏎️' },
              ].map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 1.3 + i * 0.1 }}
                  className="p-4 rounded-lg bg-rbr-dark-card/50 border border-rbr-border text-center"
                >
                  <div className="text-3xl mb-2">{stat.icon}</div>
                  <div className="text-3xl font-heading font-bold text-rbr-red">
                    {stat.value}
                  </div>
                  <div className="text-sm text-rbr-text-muted">{stat.label}</div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>

          {/* Right Side - Login Form */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="w-full"
          >
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="mb-8 lg:hidden text-center"
            >
              <div className="flex items-center justify-center gap-4 mb-4">
                <Image
                  src="/gemos-logo.png"
                  alt="Gemos Logo"
                  width={60}
                  height={60}
                  className="object-contain"
                  priority
                />
                <span className="text-2xl font-bold text-rbr-text-muted">✕</span>
                <div className="h-16 w-16 rounded-full bg-racing-red-gradient flex items-center justify-center font-display text-white text-2xl font-black">
                  RBR
                </div>
              </div>
              <h1 className="text-3xl font-heading font-black text-rbr-text-primary">
                Oracle Red Bull Racing
              </h1>
              <p className="text-rbr-text-secondary mt-2">Meal Booking Platform</p>
            </motion.div>

            <LoginForm />

            {/* Additional Info */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.5 }}
              className="mt-8 text-center"
            >
              <p className="text-sm text-rbr-text-muted">
                Sistema protetto • Enterprise Security
              </p>
              <div className="flex items-center justify-center gap-2 mt-2">
                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-xs text-rbr-text-muted">Tutti i sistemi operativi</span>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Racing Grid Pattern */}
      <div
        className="absolute inset-0 opacity-5 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(0deg, transparent 24%, rgba(220, 0, 0, 0.3) 25%, rgba(220, 0, 0, 0.3) 26%, transparent 27%, transparent 74%, rgba(220, 0, 0, 0.3) 75%, rgba(220, 0, 0, 0.3) 76%, transparent 77%, transparent),
            linear-gradient(90deg, transparent 24%, rgba(220, 0, 0, 0.3) 25%, rgba(220, 0, 0, 0.3) 26%, transparent 27%, transparent 74%, rgba(220, 0, 0, 0.3) 75%, rgba(220, 0, 0, 0.3) 76%, transparent 77%, transparent)
          `,
          backgroundSize: '50px 50px',
        }}
      />
    </div>
  );
}
