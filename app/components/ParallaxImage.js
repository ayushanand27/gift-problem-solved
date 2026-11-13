'use client';

import { useRef } from 'react';
import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react';

// A framed photograph that drifts slightly as the page scrolls and zooms slowly on hover.
export default function ParallaxImage({ src, alt, ratio = '4 / 5', arched = false }) {
  const ref = useRef(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], ['-5%', '5%']);
  return (
    <div ref={ref} className={arched ? 'frame arched' : 'frame'} style={{ aspectRatio: ratio }}>
      <motion.div className="frame-drift" style={reduce ? undefined : { y }}>
        <img src={src} alt={alt} loading="lazy" decoding="async" />
      </motion.div>
    </div>
  );
}
