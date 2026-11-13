'use client';

import { motion, useReducedMotion } from 'motion/react';

export const EASE = [0.22, 1, 0.36, 1];

// Fades and lifts its content into place the first time it scrolls into view.
export default function Reveal({ children, delay = 0, y = 28, className }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '0px 0px -10% 0px' }}
      transition={{ duration: 0.9, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}
