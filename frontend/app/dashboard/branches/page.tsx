'use client';

import { useCallback, useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { FiltersBar } from '@/components/site/filters-bar';
import { DashboardTable } from '@/components/site/dashboard-table';
import { EmptyState } from '@/components/site/empty-state';
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
  const user = useAuthStore((state) => state.user);
  const [rows, setRows] = useState<Array<Record<string, string>>>([]);
  const [rawBranches, setRawBranches] = useState<Array<Record<string, string | number | null>>>([]);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    working_hours: '9 AM - 5 PM',
    timezone: 'UTC',
    status: 'active'
  });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadBranches = useCallback(async () => {
    if (!accessToken) return;
    try {
      const data = await queueApi.getBranches(accessToken);
      setRawBranches(data);
      setRows(
        data.map((item) => ({
          id: String(item.id ?? ''),
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
  }, [accessToken]);

  const handleEdit = (row: Record<string, string>) => {
    const id = parseInt(row.id, 10);
    const branch = rawBranches.find(b => b.id === id);
    if (branch) {
      setEditingId(id);
      setFormData({
        name: String(branch.name || ''),
        working_hours: String(branch.working_hours || '9 AM - 5 PM'),
        timezone: String(branch.timezone || 'UTC'),
        status: String(branch.status || 'active')
      });
    }
  };

  const handleDelete = async (row: Record<string, string>) => {
    const id = parseInt(row.id, 10);
    if (!accessToken || isNaN(id)) return;
    try {
      await queueApi.deleteBranch(accessToken, id);
      await loadBranches();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Unable to delete branch.');
    }
  };

  const handleRestore = async (row: Record<string, string>) => {
    const id = parseInt(row.id, 10);
    if (!accessToken || isNaN(id)) return;
    try {
      await queueApi.restoreBranch(accessToken, id);
      await loadBranches();
    } catch (restoreError) {
      setError(restoreError instanceof Error ? restoreError.message : 'Unable to restore branch.');
    }
  };

  const branchActions = [
    {
      label: 'Edit',
      onClick: handleEdit
    },
    {
      label: 'Delete',
      onClick: handleDelete,
      variant: 'destructive' as const
    },
    {
      label: 'Restore',
      onClick: handleRestore
    }
  ];

  useEffect(() => {
    loadBranches();
  }, [accessToken, loadBranches]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken || !user?.organization) return;
    
    setIsSubmitting(true);
    try {
      const slug = formData.name.toLowerCase().replace(/\s+/g, '-');
      if (editingId) {
        // Update existing branch
        await queueApi.updateBranch(accessToken, editingId, {
          name: formData.name,
          status: formData.status,
          working_hours: formData.working_hours,
          timezone: formData.timezone
        });
        setEditingId(null);
      } else {
        // Create new branch
        await queueApi.createBranch(accessToken, {
          organization: user.organization,
          name: formData.name,
          slug,
          status: formData.status,
          working_hours: formData.working_hours,
          timezone: formData.timezone,
          manager: user.id
        });
      }
      setFormData({ name: '', working_hours: '9 AM - 5 PM', timezone: 'UTC', status: 'active' });
      await loadBranches();
    } catch (error) {
      setError(error instanceof Error ? error.message : `Unable to ${editingId ? 'update' : 'create'} branch.`);
    } finally {
      setIsSubmitting(false);
    }
  };

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
        <DashboardTable title="Branches" columns={branchColumns} rows={rows} actions={branchActions} />
        <Card>
          <h2 className="text-xl font-semibold text-white">Add / edit branch</h2>
          <p className="mt-2 text-sm text-slate-300">Create a new branch for your organization.</p>
          <form onSubmit={handleSubmit} className="mt-6 space-y-3 rounded-3xl bg-white/5 p-4">
            <input
              type="text"
              placeholder="Branch name"
              value={formData.name}
              onChange={(event) => setFormData({ ...formData, name: event.target.value })}
              className="w-full rounded-2xl bg-slate-950/60 px-4 py-3 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <div className="rounded-2xl bg-slate-950/60 px-4 py-3 text-sm text-slate-300">Manager: {user?.email ?? 'Current user'}</div>
            <input
              type="text"
              placeholder="Working hours"
              value={formData.working_hours}
              onChange={(event) => setFormData({ ...formData, working_hours: event.target.value })}
              className="w-full rounded-2xl bg-slate-950/60 px-4 py-3 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <select
              value={formData.status}
              onChange={(event) => setFormData({ ...formData, status: event.target.value })}
              className="w-full rounded-2xl bg-slate-950/60 px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="active">Active</option>
              <option value="paused">Paused</option>
            </select>
            <input
              type="text"
              placeholder="Timezone"
              value={formData.timezone}
              onChange={(event) => setFormData({ ...formData, timezone: event.target.value })}
              className="w-full rounded-2xl bg-slate-950/60 px-4 py-3 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (editingId ? 'Updating...' : 'Creating...') : (editingId ? 'Update Branch' : 'Create Branch')}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={() => {
                  setEditingId(null);
                  setFormData({ name: '', working_hours: '9 AM - 5 PM', timezone: 'UTC', status: 'active' });
                }}
                className="w-full rounded-2xl bg-slate-600 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-700"
              >
                Cancel Edit
              </button>
            )}
          </form>
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
