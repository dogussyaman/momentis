'use client'

import { motion } from 'framer-motion'
import { EASE } from '@/lib/motion'

export function Reveal({ children, delay = 0, className, y = 28, once = true, duration = 0.9 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once, margin: '-60px' }}
      transition={{ duration, delay, ease: EASE }}
      className={className}
    >
      {children}
    </motion.div>
  )
}
