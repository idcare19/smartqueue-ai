'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { FiltersBar } from '@/components/site/filters-bar';
import { DashboardTable } from '@/components/site/dashboard-table';
import { EmptyState } from '@/components/site/empty-state';
import { queueApi } from '@/lib/queue-api';
import type { TableColumn } from '@/lib/types';
import { useAuthStore } from '@/store/auth-store';

const staffColumns: Array<TableColumn<Record<string, string>>> = [
  { key: 'name', label: 'Staff' },
  { key: 'role', label: 'Role' },
  { key: 'branch', label: 'Branch assignment' },
  { key: 'status', label: 'Status' }
];

export default function StaffManagementPage() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const [rows, setRows] = useState<Array<Record<string, string>>>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadStaff() {
      if (!accessToken) return;
      try {
        const data = await queueApi.getStaff(accessToken);
        setRows(data.map((item) => ({
          id: String(item.id ?? ''),
          name: `${String(item.first_name ?? '')} ${String(item.last_name ?? '')}`.trim() || String(item.email ?? '--'),
          role: String(item.role ?? '--'),
          branch: String(item.branch ?? '--'),
          status: item.is_archived ? 'Archived' : item.is_suspended ? 'Suspended' : item.is_active ? 'Active' : 'Inactive'
        })));
        setError(null);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Unable to load staff.');
      }
    }

    void loadStaff();
  }, [accessToken]);

  return (
    <div className="space-y-6 px-4 py-6 md:px-6">
      <FiltersBar placeholder="Search staff..." />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          ['Staff members', String(rows.length)],
          ['Active', String(rows.filter((row) => row.status === 'Active').length)],
          ['Suspended', String(rows.filter((row) => row.status === 'Suspended').length)],
          ['Archived', String(rows.filter((row) => row.status === 'Archived').length)]
        ].map(([label, value]) => (
          <Card key={label}>
            <p className="text-sm text-slate-400">{label}</p>
            <p className="mt-3 text-3xl font-semibold text-white">{value}</p>
          </Card>
        ))}
      </div>
      <DashboardTable title="Staff" columns={staffColumns} rows={rows} />
      <Card>
        <h2 className="text-xl font-semibold text-white">Invite staff</h2>
        <p className="mt-2 text-sm text-slate-300">Staff lifecycle controls are exposed from the live staff API and can be wired into invite, suspend, archive, and reset-password flows.</p>
      </Card>
      {error ? <EmptyState title="Staff API unavailable" description={error} actionLabel="Retry later" /> : <EmptyState title="Staff directory live" description="Use filters and API actions to manage roles, assignments, and availability." actionLabel="Invite staff" />}
    </div>
  );
}
