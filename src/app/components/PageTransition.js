'use client';

import { motion } from 'framer-motion';

const variants = {
  fadeUp: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -10 },
  },
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  },
  slideRight: {
    initial: { opacity: 0, x: -30 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 30 },
  },
};

export default function PageTransition({ children, variant = 'fadeUp', className = '' }) {
  const v = variants[variant] || variants.fadeUp;
  return (
    <motion.div
      initial={v.initial}
      animate={v.animate}
      exit={v.exit}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className={className}
      style={{ flex: 1 }}
    >
      {children}
    </motion.div>
  );
}

// Card animation wrapper
export function AnimatedCard({ children, delay = 0, style = {} }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -2, boxShadow: '0 8px 24px rgba(0,0,0,0.1)' }}
      style={{ ...style, transition: 'box-shadow 0.2s' }}
    >
      {children}
    </motion.div>
  );
}

// Stagger container
export function StaggerContainer({ children, style = {} }) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{ visible: { transition: { staggerChildren: 0.07 } } }}
      style={style}
    >
      {children}
    </motion.div>
  );
}

// Stagger item
export function StaggerItem({ children, style = {} }) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 16 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] } },
      }}
      style={style}
    >
      {children}
    </motion.div>
  );
}

// Number counter animation
export function AnimatedNumber({ value, suffix = '' }) {
  return (
    <motion.span
      key={value}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {value}{suffix}
    </motion.span>
  );
}

// Skeleton loader
export function SkeletonCard({ height = 80 }) {
  return (
    <motion.div
      animate={{ opacity: [0.5, 1, 0.5] }}
      transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
      style={{ height, borderRadius: '12px', background: 'var(--bg-tertiary)', marginBottom: '12px' }}
    />
  );
}
