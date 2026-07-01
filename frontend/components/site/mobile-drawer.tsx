'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import { navItems } from '@/lib/site';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/site/theme-toggle';
import { cn } from '@/lib/utils';
import { isActiveRoute } from '@/lib/navigation';

export function MobileDrawer() {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    if (open) panelRef.current?.focus();
  }, [open]);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <>
      <Button variant="secondary" className="lg:hidden" onClick={() => setOpen(true)} aria-label="Open navigation menu">
        <Menu className="mr-2 h-4 w-4" />
        Menu
      </Button>
      <AnimatePresence>
        {open ? (
          <motion.div
            className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
          >
            <motion.aside
              ref={panelRef}
              tabIndex={-1}
              role="dialog"
              aria-modal="true"
              aria-label="SmartQueue navigation"
              className="absolute left-0 top-0 flex h-full w-[88vw] max-w-sm flex-col border-r border-white/10 bg-slate-950 p-5 shadow-2xl shadow-black/40 outline-none"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 260, damping: 28 }}
              onClick={(event) => event.stopPropagation()}
            >
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.4em] text-emerald-300">SmartQueue AI</p>
                  <p className="mt-2 text-lg font-semibold text-white">Navigation</p>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  aria-label="Close navigation menu"
                  className="rounded-full p-2 text-slate-300 transition hover:bg-white/5 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="mb-4">
                <ThemeToggle />
              </div>
              <nav className="space-y-5" aria-label="Mobile navigation">
                {(['dashboard', 'queue'] as const).map((group) => (
                  <div key={group}>
                    <p className="mb-2 px-3 text-xs uppercase tracking-[0.24em] text-slate-500">
                      {group === 'dashboard' ? 'Dashboard' : 'Operations'}
                    </p>
                    <div className="space-y-2">
                      {navItems.filter((item) => item.group === group).map((item) => {
                        const Icon = item.icon;
                        const active = isActiveRoute(pathname, item.href);
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            aria-current={active ? 'page' : undefined}
                            className={cn(
                              'flex items-center gap-3 rounded-2xl px-4 py-3 text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70',
                              active ? 'bg-emerald-400/15 text-white' : 'text-slate-300 hover:bg-white/5 hover:text-white'
                            )}
                            onClick={() => setOpen(false)}
                          >
                            <Icon className={cn('h-4 w-4', active ? 'text-emerald-300' : 'text-slate-400')} />
                            {item.label}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </nav>
            </motion.aside>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
