'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { FiltersBar } from '@/components/site/filters-bar';
import { DashboardTable } from '@/components/site/dashboard-table';
import { EmptyState } from '@/components/site/empty-state';
import { branchManagementRows } from '@/lib/mock-data';
import { queueApi } from '@/lib/queue-api';
import type { TableColumn } from '@/lib/types';
import { useAuthStore } from '@/store/auth-store';

const branchColumns: Array<TableColumn<Record<string, string>>> = [
  { key: 'branch', label: 'Branch' },
  { key: 'status', label: 'Status' },
  { key: 'workingHours', label: 'Working hours' },
  { key: 'manager', label: 'Manager' },
  { key: 'queue', label: 'Queue' },
  { key: 'staff', label: 'Staff' }
];

export default function BranchManagementPage() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const [rows, setRows] = useState<Array<Record<string, string>>>(branchManagementRows as unknown as Array<Record<string, string>>);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadBranches() {
      try {
        const data = await queueApi.getBranches(accessToken);
        setRows(
          data.map((item) => ({
            branch: String(item.name ?? '--'),
            status: String(item.status ?? '--'),
            workingHours: String(item.working_hours ?? '--'),
            manager: String(item.manager_email ?? '--'),
            queue: String(item.queue ?? '0'),
            staff: String(item.staff ?? '0')
          }))
        );
        setError(null);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Unable to load branches.');
      }
    }

    if (accessToken) {
      void loadBranches();
    }
  }, [accessToken]);

  return (
    <div className="space-y-6 px-4 py-6 md:px-6">
      <FiltersBar placeholder="Search branches or managers..." />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          ['Total branches', '12'],
          ['Active', '9'],
          ['Paused', '2'],
          ['Today queue load', '327']
        ].map(([label, value]) => (
          <Card key={label}>
            <p className="text-sm text-slate-400">{label}</p>
            <p className="mt-3 text-3xl font-semibold text-white">{value}</p>
          </Card>
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <DashboardTable title="Branches" columns={branchColumns} rows={rows} />
        <Card>
          <h2 className="text-xl font-semibold text-white">Add / edit branch</h2>
          <p className="mt-2 text-sm text-slate-300">Backend-ready form layout for branch creation and updates.</p>
          <div className="mt-6 space-y-3 rounded-3xl bg-white/5 p-4">
            <div className="rounded-2xl bg-slate-950/60 px-4 py-3 text-sm text-slate-300">Branch name</div>
            <div className="rounded-2xl bg-slate-950/60 px-4 py-3 text-sm text-slate-300">Manager info</div>
            <div className="rounded-2xl bg-slate-950/60 px-4 py-3 text-sm text-slate-300">Working hours</div>
            <div className="rounded-2xl bg-slate-950/60 px-4 py-3 text-sm text-slate-300">Status and capacity</div>
          </div>
        </Card>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {[
          { title: 'North Wing performance', value: '98.2%', detail: 'Uptime and queue throughput combined' },
          { title: 'Central Desk service speed', value: '7m', detail: 'Average handled service duration' },
          { title: 'Weekend Desk coverage', value: '6 staff', detail: 'Managers and assistants currently assigned' }
        ].map((item) => (
          <Card key={item.title}>
            <p className="text-sm text-slate-400">{item.title}</p>
            <p className="mt-3 text-3xl font-semibold text-white">{item.value}</p>
            <p className="mt-2 text-sm text-slate-300">{item.detail}</p>
          </Card>
        ))}
      </div>
      {error ? (
        <EmptyState title="Branch API unavailable" description={`${error} Showing fallback branch data while the API catches up.`} actionLabel="Retry later" />
      ) : (
        <EmptyState title="No branch filters applied" description="Use search and status filters to review a narrower subset of branches." actionLabel="Create branch" />
      )}
    </div>
  );
}
