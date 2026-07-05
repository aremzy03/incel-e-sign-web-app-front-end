'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { IncelLogo } from '@/components/ui/incel-logo';

export function Navigation() {
  const NavLogo = () => (
    <Link href="/" className="flex items-center gap-3 group">
      <motion.div
        className="flex items-center justify-center"
        whileHover={{ scale: 1.05, rotate: 5 }}
        whileTap={{ scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 300 }}
      >
        <IncelLogo variant="icon" size={40} />
      </motion.div>
      <div className="flex flex-col">
        <span className="text-xl font-bold font-heading text-primary group-hover:text-secondary transition-colors">
          INCEL E-Sign
        </span>
        <span className="text-xs text-muted font-medium">
          Legal Authority
        </span>
      </div>
    </Link>
  );

  return (
    <motion.nav 
      className="sticky top-0 z-50 border-b border-border bg-surface-container-lowest shadow-sm"
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 200, damping: 20 }}
    >
      <div className="container-corporate">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <NavLogo />
        </div>
      </div>
    </motion.nav>
  );
}
