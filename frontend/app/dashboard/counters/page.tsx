'use client';

import { useCallback, useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { FiltersBar } from '@/components/site/filters-bar';
import { DashboardTable } from '@/components/site/dashboard-table';
import { EmptyState } from '@/components/site/empty-state';
import { queueApi } from '@/lib/queue-api';
import type { TableColumn } from '@/lib/types';
import { useAuthStore } from '@/store/auth-store';

const counterColumns: Array<TableColumn<Record<string, string>>> = [
  { key: 'counter', label: 'Counter' },
  { key: 'branch', label: 'Branch' },
  { key: 'status', label: 'Status' },
  { key: 'currentToken', label: 'Current token' },
  { key: 'staff', label: 'Assigned staff' }
];

export default function CounterManagementPage() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const user = useAuthStore((state) => state.user);
  const [rows, setRows] = useState<Array<Record<string, string>>>([]);
  const [rawCounters, setRawCounters] = useState<Array<Record<string, string | number | null>>>([]);
  const [branches, setBranches] = useState<Array<{id: number; name: string}>>([]);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    status: 'active',
    branch: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadCounters = useCallback(async () => {
    if (!accessToken) return;
    try {
      const data = await queueApi.getCounters(accessToken);
      setRawCounters(data);
      setRows(
        data.map((item) => ({
          id: String(item.id ?? ''),
          counter: String(item.name ?? '--'),
          branch: String(item.branch_name ?? '--'),
          status: String(item.status ?? '--'),
          currentToken: String(item.currentToken ?? '--'),
          staff: String(item.staff ?? '--')
        }))
      );
      setError(null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load counters.');
    }
  }, [accessToken]);

  const handleEdit = (row: Record<string, string>) => {
    const id = parseInt(row.id, 10);
    const counter = rawCounters.find(c => c.id === id);
    if (counter) {
      setEditingId(id);
      setFormData({
        name: String(counter.name || ''),
        status: String(counter.status || 'active'),
        branch: String(counter.branch || '')
      });
    }
  };

  const handleDelete = async (row: Record<string, string>) => {
    const id = parseInt(row.id, 10);
    if (!accessToken || isNaN(id)) return;
    try {
      await queueApi.deleteCounter(accessToken, id);
      await loadCounters();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Unable to delete counter.');
    }
  };

  const handleRestore = async (row: Record<string, string>) => {
    const id = parseInt(row.id, 10);
    if (!accessToken || isNaN(id)) return;
    try {
      await queueApi.updateCounter(accessToken, id, { is_active: true });
      await loadCounters();
    } catch (restoreError) {
      setError(restoreError instanceof Error ? restoreError.message : 'Unable to restore counter.');
    }
  };

  const counterActions = [
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

  const loadBranches = useCallback(async () => {
    if (!accessToken) return;
    try {
      const data = await queueApi.getBranches(accessToken);
      setBranches(data.map(item => ({ id: Number(item.id), name: String(item.name) })));
    } catch {
      console.error('Failed to load branches');
    }
  }, [accessToken]);

  useEffect(() => {
    loadCounters();
    loadBranches();
  }, [accessToken, loadCounters, loadBranches]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken || !user?.organization) return;
    
    setIsSubmitting(true);
    try {
      if (editingId) {
        // Update existing counter
        await queueApi.updateCounter(accessToken, editingId, {
          name: formData.name,
          status: formData.status,
          branch: Number(formData.branch)
        });
        setEditingId(null);
      } else {
        // Create new counter
        await queueApi.createCounter(accessToken, {
          organization: user.organization,
          name: formData.name,
          status: formData.status,
          branch: Number(formData.branch)
        });
      }
      setFormData({ name: '', status: 'active', branch: '' });
      await loadCounters();
    } catch (error) {
      setError(error instanceof Error ? error.message : `Unable to ${editingId ? 'update' : 'create'} counter.`);
    } finally {
      setIsSubmitting(false);
    }
  };

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
        <DashboardTable title="Counters" columns={counterColumns} rows={rows} actions={counterActions} />
        <Card>
          <h2 className="text-xl font-semibold text-white">Add / edit counter</h2>
          <p className="mt-2 text-sm text-slate-300">Create a new counter for your branch.</p>
          <form onSubmit={handleSubmit} className="mt-6 space-y-3 rounded-3xl bg-white/5 p-4">
            <input
              type="text"
              placeholder="Counter name"
              value={formData.name}
              onChange={(event) => setFormData({ ...formData, name: event.target.value })}
              className="w-full rounded-2xl bg-slate-950/60 px-4 py-3 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <select
              value={formData.branch}
              onChange={(event) => setFormData({ ...formData, branch: event.target.value })}
              className="w-full rounded-2xl bg-slate-950/60 px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select branch</option>
              {branches.map(branch => (
                <option key={branch.id} value={branch.id}>{branch.name}</option>
              ))}
            </select>
            <select
              value={formData.status}
              onChange={(event) => setFormData({ ...formData, status: event.target.value })}
              className="w-full rounded-2xl bg-slate-950/60 px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="active">Active</option>
              <option value="paused">Paused</option>
            </select>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (editingId ? 'Updating...' : 'Creating...') : (editingId ? 'Update Counter' : 'Create Counter')}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={() => {
                  setEditingId(null);
                  setFormData({ name: '', status: 'active', branch: '' });
                }}
                className="w-full rounded-2xl bg-slate-600 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-700"
              >
                Cancel Edit
              </button>
            )}
          </form>
        </Card>
      </div>
      {error ? (
        <EmptyState title="Counter API unavailable" description={`${error} Showing fallback counter data while the API catches up.`} actionLabel="Retry later" />
      ) : (
        <EmptyState title="No counters found" description="Get started by creating your first counter to manage your queue system." actionLabel="Add counter" />
      )}
    </div>
  );
}
