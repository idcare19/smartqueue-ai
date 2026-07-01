'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { FiltersBar } from '@/components/site/filters-bar';
import { DashboardTable } from '@/components/site/dashboard-table';
import { EmptyState } from '@/components/site/empty-state';
import { serviceRows } from '@/lib/mock-data';
import { queueApi } from '@/lib/queue-api';
import type { TableColumn } from '@/lib/types';
import { useAuthStore } from '@/store/auth-store';

const serviceColumns: Array<TableColumn<Record<string, string>>> = [
  { key: 'service', label: 'Service' },
  { key: 'duration', label: 'Duration' },
  { key: 'prefix', label: 'Queue prefix' },
  { key: 'priority', label: 'Priority' },
  { key: 'status', label: 'Status' }
];

export default function ServicesManagementPage() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const [rows, setRows] = useState<Array<Record<string, string>>>(serviceRows as unknown as Array<Record<string, string>>);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadServices() {
      try {
        const data = await queueApi.getServices(accessToken);
        setRows(
          data.map((item) => ({
            service: String(item.name ?? '--'),
            duration: `${String(item.duration ?? '--')} min`,
            prefix: String(item.prefix ?? '--'),
            priority: String(item.priority ?? '--'),
            status: String(item.status ?? '--')
          }))
        );
        setError(null);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Unable to load services.');
      }
    }

    if (accessToken) {
      void loadServices();
    }
  }, [accessToken]);

  return (
    <div className="space-y-6 px-4 py-6 md:px-6">
      <FiltersBar placeholder="Search services..." />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          ['Services', '18'],
          ['Active', '15'],
          ['High priority', '4'],
          ['Avg duration', '6m']
        ].map(([label, value]) => (
          <Card key={label}>
            <p className="text-sm text-slate-400">{label}</p>
            <p className="mt-3 text-3xl font-semibold text-white">{value}</p>
          </Card>
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <DashboardTable title="Services" columns={serviceColumns} rows={rows} />
        <Card>
          <h2 className="text-xl font-semibold text-white">Add / edit service</h2>
          <p className="mt-2 text-sm text-slate-300">Duration, prefix, priority, and active state all map directly to backend fields.</p>
          <div className="mt-6 space-y-3 rounded-3xl bg-white/5 p-4">
            <div className="rounded-2xl bg-slate-950/60 px-4 py-3 text-sm text-slate-300">Service name</div>
            <div className="rounded-2xl bg-slate-950/60 px-4 py-3 text-sm text-slate-300">Duration + queue prefix</div>
            <div className="rounded-2xl bg-slate-950/60 px-4 py-3 text-sm text-slate-300">Priority settings</div>
            <div className="rounded-2xl bg-slate-950/60 px-4 py-3 text-sm text-slate-300">Active / inactive toggle</div>
          </div>
        </Card>
      </div>
      {error ? (
        <EmptyState title="Service API unavailable" description={`${error} Showing fallback service data while the API catches up.`} actionLabel="Retry later" />
      ) : (
        <EmptyState title="No custom service rules yet" description="Add or edit services to define queue prefixes, durations, and priority behavior." actionLabel="Add service" />
      )}
    </div>
  );
}
