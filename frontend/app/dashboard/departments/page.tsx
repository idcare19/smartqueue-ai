'use client';

import { useCallback, useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { FiltersBar } from '@/components/site/filters-bar';
import { DashboardTable } from '@/components/site/dashboard-table';
import { EmptyState } from '@/components/site/empty-state';
import { queueApi } from '@/lib/queue-api';
import type { TableColumn } from '@/lib/types';
import { useAuthStore } from '@/store/auth-store';

const columns: Array<TableColumn<Record<string, string>>> = [
  { key: 'name', label: 'Department' },
  { key: 'branch', label: 'Branch' },
  { key: 'manager', label: 'Manager' },
  { key: 'status', label: 'Status' }
];

export default function DepartmentsPage() {
  const token = useAuthStore((s) => s.accessToken);
  const [rows, setRows] = useState<Array<Record<string, string>>>([]);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!token) return;
    try {
      const data = await queueApi.getDepartments(token);
      setRows(data.map((item) => ({ id: String(item.id), name: String(item.name), branch: String(item.branch_name ?? '--'), manager: '--', status: item.is_active ? 'Active' : 'Archived' })));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to load departments.');
    }
  }, [token]);

  useEffect(() => { void load(); }, [load]);

  return (
    <div className="space-y-6 px-4 py-6 md:px-6">
      <FiltersBar placeholder="Search departments..." />
      <Card><h1 className="text-xl font-semibold text-white">Departments</h1></Card>
      <DashboardTable title="Departments" columns={columns} rows={rows} />
      {error ? <EmptyState title="Department API unavailable" description={error} /> : null}
    </div>
  );
}
