import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ThemeToggle } from '@/components/site/theme-toggle';
import { NotificationsMenu } from '@/components/site/notifications-menu';
import { UserMenu } from '@/components/site/user-menu';
import { Breadcrumbs } from '@/components/site/breadcrumbs';
import { MobileDrawer } from '@/components/site/mobile-drawer';

export function DashboardHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <header className="sticky top-0 z-20 border-b border-white/10 bg-slate-950/70 backdrop-blur-xl">
      <div className="flex items-center gap-4 px-4 py-4 md:px-6">
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex items-center justify-between gap-3 lg:hidden">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-white">{title}</p>
              {subtitle ? <p className="truncate text-xs text-slate-400">{subtitle}</p> : null}
            </div>
            <MobileDrawer />
          </div>
          <div className="hidden lg:block">
            <Breadcrumbs items={[{ label: 'Dashboard', href: '/dashboard' }, { label: title }]} />
            <p className="text-sm text-slate-400">{subtitle}</p>
            <h1 className="truncate text-2xl font-semibold text-white">{title}</h1>
          </div>
        </div>
        <div className="hidden w-full max-w-sm md:block">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <Input className="pl-9" placeholder="Search tokens, branches, staff..." />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden md:block">
            <ThemeToggle />
          </div>
          <div className="hidden xl:block">
            <NotificationsMenu />
          </div>
          <div className="hidden xl:block">
            <UserMenu />
          </div>
        </div>
      </div>
    </header>
  );
}
