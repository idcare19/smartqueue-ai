import type { ReactNode } from 'react';
import { Sidebar } from '@/components/site/sidebar';
import { DashboardHeader } from '@/components/site/header';

export function PageShell({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <div className="flex">
        <Sidebar />
        <div className="min-w-0 flex-1">
          <DashboardHeader title={title} subtitle={subtitle} />
          <main>{children}</main>
        </div>
      </div>
    </div>
  );
}
