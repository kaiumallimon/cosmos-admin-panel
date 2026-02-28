'use client';

import { Menu, X, SparklesIcon, SunIcon, MoonIcon } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';

export default function LandingHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('');
  const [mounted, setMounted] = useState(false);
  const { resolvedTheme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const sections = ['features', 'how-it-works', 'tech-stack', 'why-uiu'];
      let current = '';
      for (const id of sections) {
        const el = document.getElementById(id);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= window.innerHeight / 2 && rect.bottom > 0) {
            current = id;
          }
        }
      }
      setActiveSection(current);
    };
    window.addEventListener('scroll', handleScroll);
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { href: '#features', label: 'Features' },
    { href: '#how-it-works', label: 'How It Works' },
    { href: '#tech-stack', label: 'Tech Stack' },
    { href: '#why-uiu', label: 'Why UIU' },
  ];

  const isActive = (href: string) =>
    activeSection === href.replace('#', '');

  return (
    <motion.nav
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-6xl"
    >
      <motion.div
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.3, delay: 0.2 }}
        className="bg-background/60 dark:bg-background/50 backdrop-blur-xl border border-border/40 rounded-full pl-5 pr-4 py-2.5 flex items-center justify-between shadow-2xl shadow-black/20"
      >
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 group"
        >
          <motion.div
            className="h-7 w-7 rounded-lg bg-linear-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-md shadow-orange-500/20"
            whileHover={{ rotate: 180, scale: 1.1 }}
            transition={{ duration: 0.4 }}
          >
            <SparklesIcon className="h-3.5 w-3.5 text-white" />
          </motion.div>
          <span className="text-sm font-bold tracking-tight text-foreground">
            COSMOS<span className="text-orange-500">-ITS</span>
          </span>
        </Link>



        {/* Right actions */}
        <div className="flex items-center gap-2">
          {/* Theme toggle */}
          {mounted && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full"
              onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
              aria-label="Toggle theme"
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={resolvedTheme}
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {resolvedTheme === 'dark' ? (
                    <SunIcon className="h-3.5 w-3.5" />
                  ) : (
                    <MoonIcon className="h-3.5 w-3.5" />
                  )}
                </motion.div>
              </AnimatePresence>
            </Button>
          )}

          {/* Sign In + Get Started (desktop) */}
          <div className="hidden sm:flex items-center gap-1.5">
            <Link href="/login">
              <Button variant="ghost" size="sm" className="text-xs font-medium h-8 rounded-full px-4">
                Sign In
              </Button>
            </Link>
            <Link href="/register">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  size="sm"
                  className="text-xs font-semibold h-8 rounded-full px-4 bg-orange-500 hover:bg-orange-600 text-white shadow-md shadow-orange-500/20"
                >
                  Get Started
                </Button>
              </motion.div>
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-1.5 rounded-full hover:bg-muted/50 transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X size={18} className="text-foreground" />
            ) : (
              <Menu size={18} className="text-foreground" />
            )}
          </button>
        </div>
      </motion.div>

      {/* Mobile dropdown */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.95 }}
            transition={{ duration: 0.18 }}
            className="absolute top-14 left-0 w-full bg-background/80 dark:bg-background/90 border border-border/40 backdrop-blur-xl rounded-2xl p-3 flex flex-col gap-1 md:hidden shadow-xl"
          >
            
            <div className="flex gap-2 pt-1">
              <Link href="/login" className="flex-1">
                <Button variant="outline" size="sm" className="w-full text-xs rounded-xl">
                  Sign In
                </Button>
              </Link>
              <Link href="/register" className="flex-1">
                <Button
                  size="sm"
                  className="w-full text-xs rounded-xl bg-orange-500 hover:bg-orange-600 text-white"
                >
                  Get Started
                </Button>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
