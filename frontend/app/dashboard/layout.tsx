import type { ReactNode } from 'react';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { PageShell } from '@/components/site/page-shell';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute>
      <PageShell title="Dashboard" subtitle="Queue operations and analytics">
        {children}
      </PageShell>
    </ProtectedRoute>
  );
}
