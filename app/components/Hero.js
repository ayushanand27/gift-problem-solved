'use client';

import Link from 'next/link';
import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react';
import { ArrowRight } from 'lucide-react';
import { EASE } from './Reveal';

export default function Hero({ image, imageMobile }) {
  const reduce = useReducedMotion();
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 900], [0, 140]);

  const rise = (delay) => ({
    initial: reduce ? false : { opacity: 0, y: 30 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.9, delay, ease: EASE },
  });

  return (
    <section className="hero">
      <motion.div className="hero-media" style={reduce ? undefined : { y }}>
        <picture>
          <source media="(max-width: 700px)" srcSet={imageMobile} />
          <img src={image} alt="A newly married couple standing close on a tree-lined path" fetchPriority="high" />
        </picture>
      </motion.div>
      <div className="hero-shade" />
      <div className="hero-copy">
        <motion.p className="eyebrow" {...rise(0.15)}>The gift registry for the Indian wedding</motion.p>
        <motion.h1 {...rise(0.3)}>Nobody needs a <em>fourth</em> mixer.</motion.h1>
        <motion.p className="hero-lead" {...rise(0.45)}>
          Tell your guests what you are truly saving for. They scan your invitation, gift by UPI,
          and arrive with a certificate in hand.
        </motion.p>
        <motion.div className="hero-actions" {...rise(0.6)}>
          <Link href="/signup" className="btn light">Begin your page <ArrowRight size={14} strokeWidth={1.25} /></Link>
          <Link href="/#unfolds" className="text-link light">See how it unfolds</Link>
        </motion.div>
      </div>
    </section>
  );
}
