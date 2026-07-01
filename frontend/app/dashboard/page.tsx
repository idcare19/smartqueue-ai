'use client';

import { useState } from 'react';
import { ConnectionIndicator } from '@/components/realtime/connection-indicator';
import { useQueueWebsocket } from '@/components/realtime/use-queue-websocket';
import { Card } from '@/components/ui/card';
import { MetricCard } from '@/components/site/metric-card';
import { FiltersBar } from '@/components/site/filters-bar';
import { DashboardTable } from '@/components/site/dashboard-table';
import { EmptyState } from '@/components/site/empty-state';
import { dashboardStats, queueRows } from '@/lib/mock-data';
import type { TableColumn } from '@/lib/types';
import { useAuthStore } from '@/store/auth-store';

const queueColumns: Array<TableColumn<Record<string, string>>> = [
  { key: 'token', label: 'Token' },
  { key: 'customer', label: 'Customer' },
  { key: 'service', label: 'Service' },
  { key: 'counter', label: 'Counter' },
  { key: 'status', label: 'Status' },
  { key: 'eta', label: 'ETA' }
] as const;

export default function SuperAdminDashboard() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const user = useAuthStore((state) => state.user);
  const [stats, setStats] = useState(dashboardStats);
  const { status } = useQueueWebsocket({
    enabled: Boolean(accessToken && user?.organization),
    token: accessToken,
    path: `/ws/queue/organization/${user?.organization ?? 'scope'}/`,
    onMessage: (payload) => {
      if (!payload.token) {
        return;
      }
      setStats((current) =>
        current.map((item) =>
          item.label === 'Active tokens'
            ? { ...item, value: String(Number.parseInt(item.value, 10) + 1) }
            : item
        )
      );
    }
  });

  return (
    <div className="space-y-8 px-4 py-6 md:px-6">
      <FiltersBar placeholder="Search organizations, tokens, or staff..." />
      <ConnectionIndicator status={status} />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((item) => <MetricCard key={item.label} {...item} />)}
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.4fr_0.6fr]">
        <DashboardTable title="Today&apos;s queue activity" columns={queueColumns} rows={queueRows} />
        <Card>
          <h2 className="text-xl font-semibold">Alerts</h2>
          <div className="mt-6 space-y-3">
            {['No urgent alerts', 'System latency normal', '2 branches need staffing review'].map((item) => (
              <div key={item} className="rounded-2xl bg-white/5 px-4 py-3 text-sm text-slate-300">{item}</div>
            ))}
          </div>
          <div className="mt-6">
            <EmptyState title="No critical alerts" description="Operational signals look healthy across all branches." actionLabel="View report" />
          </div>
        </Card>
      </div>
      <Card>
        <h2 className="text-xl font-semibold">Realtime throughput</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-5">
          {[44, 62, 71, 55, 83].map((value, index) => (
            <div key={index} className="rounded-3xl bg-white/5 p-4">
              <div className="h-40 rounded-2xl bg-gradient-to-t from-emerald-400/30 to-sky-400/10">
                <div className="h-full w-full rounded-2xl" style={{ background: `linear-gradient(180deg, rgba(16,185,129,0.2) 0%, rgba(16,185,129,0.05) ${100 - value}%)` }} />
              </div>
              <p className="mt-3 text-center text-xs text-slate-400">Branch {index + 1}</p>
            </div>
          ))}
        </div>
      </Card>
      <EmptyState title="No incident-driven actions" description="This overview is ready for live metrics, alerts, and API-fed operational summaries." actionLabel="Create automation" />
    </div>
  );
}
