'use client';

import Link from 'next/link';
import { Mail, Github, Twitter, Linkedin } from 'lucide-react';
import { SparklesIcon } from 'lucide-react';
import { motion } from 'motion/react';

export default function LandingFooter() {
  const currentYear = new Date().getFullYear();

  const quickLinks = [
    { name: 'Meet the Team', href: '/meet-the-team' },
    { name: 'Sign In', href: '/login' },
    { name: 'Register', href: '/register' },
  ];

  const socialLinks = [
    { icon: Mail, href: 'mailto:contact@cosmos-its.com', label: 'Email' },
  ];

  return (
    <motion.footer
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="relative border-t border-border/40 bg-background/70 backdrop-blur-md"
    >
      <div className="max-w-6xl mx-auto px-6 py-14">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-10">
          {/* Brand */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="space-y-4"
          >
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-linear-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-md shadow-orange-500/20">
                <SparklesIcon className="h-4 w-4 text-white" />
              </div>
              <span className="text-base font-bold text-foreground">
                COSMOS<span className="text-orange-500">-ITS</span>
              </span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
              An AI-powered Intelligent Tutoring System built exclusively for United International University students.
            </p>
          </motion.div>

          {/* Quick Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="space-y-4"
          >
            <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider">
              Quick Links
            </h4>
            <nav className="grid grid-cols-2 gap-x-4 gap-y-2">
              {quickLinks.map((link, i) => (
                <motion.div
                  key={link.name}
                  initial={{ opacity: 0, x: -8 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: 0.3 + i * 0.04 }}
                >
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-orange-500 transition-colors"
                  >
                    {link.name}
                  </Link>
                </motion.div>
              ))}
            </nav>
          </motion.div>

          {/* Connect */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="space-y-4"
          >
            <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider">
              Connect
            </h4>
            <div className="flex gap-3">
              {socialLinks.map((social, i) => {
                const Icon = social.icon;
                return (
                  <motion.a
                    key={social.label}
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.3, delay: 0.4 + i * 0.1 }}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={social.label}
                    className="w-9 h-9 rounded-full bg-muted/50 border border-border/60 flex items-center justify-center text-muted-foreground hover:text-orange-500 hover:border-orange-500/30 hover:bg-orange-500/10 transition-all"
                  >
                    <Icon size={16} />
                  </motion.a>
                );
              })}
            </div>
            <div className="mt-2 space-y-1.5">
              <p className="text-xs text-muted-foreground">United International University</p>
              <p className="text-xs text-muted-foreground">Dhaka, Bangladesh</p>
            </div>
          </motion.div>
        </div>

        {/* Bottom bar */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="pt-8 border-t border-border/30 flex flex-col md:flex-row justify-between items-center gap-3"
        >
          <p className="text-xs text-muted-foreground">
            &copy; {currentYear} COSMOS-ITS. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <span className="text-xs text-muted-foreground">
              Powered by OpenAI · MongoDB · Pinecone · Next.js
            </span>
          </div>
        </motion.div>
      </div>
    </motion.footer>
  );
}
