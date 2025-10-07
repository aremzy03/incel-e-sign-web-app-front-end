'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, 
  Menu, 
  X, 
  Home, 
  FileText, 
  Settings, 
  User,
  LogIn,
  UserPlus,
  Palette
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button, AuthorityButton } from '@/components/ui/button';
import { useBreakpoint } from '@/lib/platform';

const navigation = [
  { name: 'Home', href: '/', icon: Home },
  { name: 'Dashboard', href: '/dashboard', icon: FileText },
];

const authNavigation = [
  { name: 'Sign In', href: '/login', icon: LogIn, variant: 'secondary' as const },
  { name: 'Register', href: '/register', icon: UserPlus, variant: 'authority' as const },
];

export function Navigation() {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const isMobile = useBreakpoint('md-');
  
  // Only show auth buttons when user is not authenticated
  const showAuthButtons = status !== 'authenticated';

  // Close mobile menu when pathname changes
  React.useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const NavLogo = () => (
    <Link href="/" className="flex items-center gap-3 group">
      <motion.div
        className="flex items-center justify-center w-10 h-10 bg-navy-900 text-white rounded-lg"
        whileHover={{ scale: 1.05, rotate: 5 }}
        whileTap={{ scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 300 }}
      >
        <Shield className="w-5 h-5" />
      </motion.div>
      <div className="flex flex-col">
        <span className="text-xl font-bold font-heading text-navy-900 group-hover:text-blue-600 transition-colors">
          INCEL E-Sign
        </span>
        <span className="text-xs text-gray-500 font-medium">
          Legal Authority
        </span>
      </div>
    </Link>
  );

  const NavLinks = ({ mobile = false }: { mobile?: boolean }) => (
    <div className={cn(
      'flex gap-2',
      mobile ? 'flex-col w-full' : 'flex-row items-center'
    )}>
      {navigation.map((item) => {
        const isActive = pathname === item.href || (pathname && pathname.startsWith(item.href + '/'));
        
        return (
          <Link
            key={item.name}
            href={item.href}
            className={cn(
              'relative px-3 py-2 rounded-md text-sm font-medium transition-all duration-200',
              'flex items-center gap-2',
              mobile && 'w-full justify-start',
              isActive
                ? 'text-navy-900 bg-blue-50'
                : 'text-gray-600 hover:text-navy-900 hover:bg-gray-50'
            )}
          >
            <item.icon className="w-4 h-4" />
            {item.name}
            
            {/* Active indicator */}
            {isActive && !mobile && (
              <motion.div
                className="absolute -bottom-1 left-0 right-0 h-0.5 bg-blue-500"
                layoutId="navbar-indicator"
                initial={false}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              />
            )}
          </Link>
        );
      })}
    </div>
  );

  const AuthButtons = ({ mobile = false }: { mobile?: boolean }) => (
    <div className={cn(
      'flex gap-3',
      mobile ? 'flex-col w-full' : 'flex-row items-center'
    )}>
      {authNavigation.map((item) => (
        <Button
          key={item.name}
          variant={item.variant}
          size={mobile ? 'default' : 'sm'}
          className={mobile ? 'w-full justify-start' : ''}
          asChild
        >
          <Link href={item.href}>
            <item.icon className="w-4 h-4" />
            {item.name}
          </Link>
        </Button>
      ))}
    </div>
  );

  return (
    <motion.nav 
      className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50"
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 200, damping: 20 }}
    >
      <div className="container-corporate">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <NavLogo />

          {/* Desktop Navigation */}
          {!isMobile && (
            <div className="flex items-center gap-8">
              <NavLinks />
              {showAuthButtons && (
                <>
                  <div className="h-6 w-px bg-gray-300" />
                  <AuthButtons />
                </>
              )}
            </div>
          )}

          {/* Mobile Menu Button */}
          {isMobile && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle mobile menu"
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobile && mobileMenuOpen && (
          <motion.div
            className="bg-white border-t border-gray-200 shadow-lg"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
          >
            <div className="container-corporate py-4 space-y-4">
              <NavLinks mobile />
              {showAuthButtons && (
                <div className="pt-4 border-t border-gray-100">
                  <AuthButtons mobile />
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
