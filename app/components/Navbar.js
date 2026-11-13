'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Menu, X } from 'lucide-react';
import { EASE } from './Reveal';

const LEFT = [
  { href: '/#idea', label: 'The Idea' },
  { href: '/#unfolds', label: 'How it Unfolds' },
  { href: '/#goals', label: 'Goals' },
];

export default function Navbar({ brand, loggedIn, logoutAction }) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    document.documentElement.style.overflow = open ? 'hidden' : '';
    return () => { document.documentElement.style.overflow = ''; };
  }, [open]);

  // Over the home page photograph the bar is clear. Everywhere else it is frosted.
  const clear = pathname === '/' && !scrolled && !open;

  const right = loggedIn
    ? [{ href: '/dashboard', label: 'Dashboard' }]
    : [{ href: '/login', label: 'Log in' }, { href: '/signup', label: 'Begin' }];

  return (
    <>
    <header className={`nav no-print ${clear ? 'nav-clear' : 'nav-solid'}`}>
      <div className="nav-inner">
        <nav className="nav-links nav-left" aria-label="Main">
          {LEFT.map((item) => <Link key={item.href} href={item.href}>{item.label}</Link>)}
        </nav>
        <button type="button" className="nav-toggle" onClick={() => setOpen(true)} aria-label="Open menu" aria-expanded={open}>
          <Menu size={22} strokeWidth={1.25} />
        </button>

        <Link href="/" className="wordmark">{brand}</Link>

        <nav className="nav-links nav-right" aria-label="Account">
          {right.map((item) => <Link key={item.href} href={item.href}>{item.label}</Link>)}
          {loggedIn && <form action={logoutAction}><button className="nav-button">Log out</button></form>}
        </nav>
        <span className="nav-spacer" aria-hidden="true" />
      </div>
    </header>

      <AnimatePresence>
        {open && (
          <motion.div
            className="drawer"
            data-lenis-prevent
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: EASE }}
          >
            <div className="drawer-top">
              <button type="button" className="nav-toggle shown" onClick={() => setOpen(false)} aria-label="Close menu">
                <X size={22} strokeWidth={1.25} />
              </button>
              <span className="wordmark">{brand}</span>
              <span className="nav-spacer shown" aria-hidden="true" />
            </div>
            <nav className="drawer-links" aria-label="Menu">
              {[...LEFT, ...right].map((item, i) => (
                <motion.div
                  key={item.href}
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.9, delay: 0.08 + i * 0.07, ease: EASE }}
                >
                  <Link href={item.href} onClick={() => setOpen(false)}>{item.label}</Link>
                </motion.div>
              ))}
              {loggedIn && <form action={logoutAction}><button className="drawer-button">Log out</button></form>}
            </nav>
            <p className="eyebrow drawer-note">Gifts go bank to bank. We never hold them.</p>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
