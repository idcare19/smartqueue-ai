'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { FiltersBar } from '@/components/site/filters-bar';
import { DashboardTable } from '@/components/site/dashboard-table';
import { EmptyState } from '@/components/site/empty-state';
import { counterRows } from '@/lib/mock-data';
import { queueApi } from '@/lib/queue-api';
import type { TableColumn } from '@/lib/types';
import { useAuthStore } from '@/store/auth-store';

const counterColumns: Array<TableColumn<Record<string, string>>> = [
  { key: 'counter', label: 'Counter' },
  { key: 'branch', label: 'Branch' },
  { key: 'staff', label: 'Assigned staff' },
  { key: 'currentToken', label: 'Current token' },
  { key: 'status', label: 'Status' }
];

export default function CountersManagementPage() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const [rows, setRows] = useState<Array<Record<string, string>>>(counterRows as unknown as Array<Record<string, string>>);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadCounters() {
      try {
        const data = await queueApi.getCounters(accessToken);
        setRows(
          data.map((item) => ({
            counter: String(item.name ?? '--'),
            branch: String(item.branch_name ?? '--'),
            staff: String(item.staff ?? '--'),
            currentToken: String(item.currentToken ?? '--'),
            status: String(item.status ?? '--')
          }))
        );
        setError(null);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Unable to load counters.');
      }
    }

    if (accessToken) {
      void loadCounters();
    }
  }, [accessToken]);

  return (
    <div className="space-y-6 px-4 py-6 md:px-6">
      <FiltersBar placeholder="Search counters or staff..." />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          ['Counters', '24'],
          ['Open', '18'],
          ['Paused', '3'],
          ['Closed', '3']
        ].map(([label, value]) => (
          <Card key={label}>
            <p className="text-sm text-slate-400">{label}</p>
            <p className="mt-3 text-3xl font-semibold text-white">{value}</p>
          </Card>
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <DashboardTable title="Counters" columns={counterColumns} rows={rows} />
        <Card>
          <h2 className="text-xl font-semibold text-white">Add / edit counter</h2>
          <p className="mt-2 text-sm text-slate-300">Assign staff, set current token, and control open, paused, or closed state.</p>
          <div className="mt-6 space-y-3 rounded-3xl bg-white/5 p-4">
            <div className="rounded-2xl bg-slate-950/60 px-4 py-3 text-sm text-slate-300">Counter name</div>
            <div className="rounded-2xl bg-slate-950/60 px-4 py-3 text-sm text-slate-300">Assigned staff</div>
            <div className="rounded-2xl bg-slate-950/60 px-4 py-3 text-sm text-slate-300">Current token + quick call next</div>
            <div className="rounded-2xl bg-slate-950/60 px-4 py-3 text-sm text-slate-300">Status selector</div>
          </div>
        </Card>
      </div>
      {error ? (
        <EmptyState title="Counter API unavailable" description={`${error} Showing fallback counter data while the API catches up.`} actionLabel="Retry later" />
      ) : (
        <EmptyState title="No counters filtered" description="Open or search counters to inspect queue assignment and live state." actionLabel="Add counter" />
      )}
    </div>
  );
}
