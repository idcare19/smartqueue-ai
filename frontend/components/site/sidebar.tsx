'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { navItems } from '@/lib/site';
import { isActiveRoute, isDashboardSection } from '@/lib/navigation';

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 hidden h-screen w-72 shrink-0 border-r border-white/10 bg-slate-950/70 p-5 backdrop-blur-xl lg:block">
      <div className="mb-8">
        <p className="text-xs uppercase tracking-[0.4em] text-emerald-300">SmartQueue AI</p>
        <h2 className="mt-2 text-2xl font-semibold text-white">Control Center</h2>
      </div>
      <nav className="space-y-2" aria-label="Sidebar navigation">
        <div className="px-3 pb-2 text-xs uppercase tracking-[0.24em] text-slate-500">Dashboard</div>
        {navItems
          .filter((item) => item.group === 'dashboard')
          .map((item) => {
            const Icon = item.icon;
            const active = isActiveRoute(pathname, item.href);
            const sectionActive = isDashboardSection(pathname);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex items-center gap-3 rounded-2xl px-4 py-3 text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950',
                  active
                    ? 'bg-emerald-400/15 text-white shadow-lg shadow-emerald-400/10'
                    : sectionActive
                      ? 'text-slate-300 hover:bg-white/5 hover:text-white'
                      : 'text-slate-400 hover:bg-white/5 hover:text-white'
                )}
              >
                <Icon className={cn('h-4 w-4', active ? 'text-emerald-300' : 'text-slate-400')} />
                {item.label}
              </Link>
            );
          })}
        <div className="px-3 pb-2 pt-6 text-xs uppercase tracking-[0.24em] text-slate-500">Operations</div>
        {navItems
          .filter((item) => item.group === 'queue')
          .map((item) => {
            const Icon = item.icon;
            const active = isActiveRoute(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex items-center gap-3 rounded-2xl px-4 py-3 text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950',
                  active ? 'bg-emerald-400/15 text-white' : 'text-slate-300 hover:bg-white/5 hover:text-white'
                )}
              >
                <Icon className={cn('h-4 w-4', active ? 'text-emerald-300' : 'text-slate-400')} />
                {item.label}
              </Link>
            );
          })}
      </nav>
    </aside>
  );
}

