'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { EASE } from './Reveal';

// Our own words, set as pull quotes. They change slowly every few seconds.
export default function Quotes({ quotes }) {
  const [index, setIndex] = useState(0);
  const reduce = useReducedMotion();

  useEffect(() => {
    if (reduce) return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % quotes.length), 7000);
    return () => clearInterval(timer);
  }, [reduce, quotes.length]);

  return (
    <div className="quotes">
      <span className="quote-mark" aria-hidden="true">“</span>
      <div className="quote-stage">
        <AnimatePresence mode="wait">
          <motion.blockquote
            key={index}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.9, ease: EASE }}
          >
            {quotes[index]}
          </motion.blockquote>
        </AnimatePresence>
      </div>
      <div className="quote-dots">
        {quotes.map((_, i) => (
          <button key={i} type="button" className={i === index ? 'active' : ''} onClick={() => setIndex(i)} aria-label={`Show note ${i + 1}`} />
        ))}
      </div>
    </div>
  );
}
