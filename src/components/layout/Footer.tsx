/**
 * Red Bull Racing x Gemos - Footer
 * Animated footer with dynamic heart and bull icon
 */

'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';

export function Footer() {
  const [isHeartBeating, setIsHeartBeating] = useState(false);

  return (
    <footer className="border-t border-rbr-border bg-rbr-dark-card/80 backdrop-blur-lg">
      <div className="container mx-auto px-6 py-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Left - Copyright */}
          <div className="text-sm text-rbr-text-muted">
            © {new Date().getFullYear()} Oracle Red Bull Racing. Tutti i diritti riservati.
          </div>

          {/* Center - Developed by */}
          <motion.div
            className="flex items-center gap-2 text-sm"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="text-rbr-text-secondary">Sviluppato con</span>
            
            {/* Animated Heart */}
            <motion.button
              onClick={() => {
                setIsHeartBeating(true);
                setTimeout(() => setIsHeartBeating(false), 1000);
              }}
              whileHover={{ scale: 1.2 }}
              whileTap={{ scale: 0.9 }}
              className="cursor-pointer"
            >
              <motion.span
                className="text-2xl"
                animate={
                  isHeartBeating
                    ? {
                        scale: [1, 1.3, 1, 1.3, 1],
                        rotate: [0, 10, -10, 10, 0],
                      }
                    : { scale: 1 }
                }
                transition={{
                  duration: 0.6,
                  ease: 'easeInOut',
                }}
              >
                ❤️
              </motion.span>
            </motion.button>

            <span className="text-rbr-text-secondary">da</span>

            {/* Gemos Logo (text) */}
            <motion.span
              className="font-heading font-bold text-rbr-text-primary"
              whileHover={{ scale: 1.05, color: '#DC0000' }}
              transition={{ duration: 0.2 }}
            >
              Gemos
            </motion.span>

            <motion.span
              className="text-rbr-text-muted text-xl"
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
            >
              ✕
            </motion.span>

            {/* Animated Bull Icon */}
            <motion.div
              className="relative"
              whileHover={{ scale: 1.2 }}
              animate={{
                y: [0, -2, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            >
              <motion.span
                className="text-2xl"
                animate={{
                  rotate: [0, -10, 10, 0],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              >
                🐂
              </motion.span>
              {/* Racing Spark Effect */}
              <motion.div
                className="absolute -right-1 top-0 w-1 h-1 rounded-full bg-rbr-red"
                animate={{
                  scale: [0, 1.5, 0],
                  opacity: [0, 1, 0],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  repeatDelay: 0.5,
                }}
              />
            </motion.div>

            <motion.span
              className="font-heading font-bold bg-racing-red-gradient bg-clip-text text-transparent"
              animate={{
                backgroundPosition: ['0%', '100%', '0%'],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: 'linear',
              }}
            >
              Red Bull
            </motion.span>
          </motion.div>

          {/* Right - Version & Status */}
          <div className="flex items-center gap-4 text-xs text-rbr-text-muted">
            <div className="flex items-center gap-2">
              <motion.div
                className="h-2 w-2 rounded-full bg-green-500"
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [1, 0.7, 1],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />
              <span>v1.0.0</span>
            </div>
            <span className="text-rbr-border">•</span>
            <span>Powered by F1 Technology</span>
          </div>
        </div>
      </div>

      {/* Racing Bottom Line */}
      <motion.div
        className="h-1 bg-gradient-to-r from-rbr-navy via-rbr-red to-rbr-navy"
        animate={{
          backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'linear',
        }}
        style={{
          backgroundSize: '200% 100%',
        }}
      />
    </footer>
  );
}
