'use client';

import { useCallback, useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { FiltersBar } from '@/components/site/filters-bar';
import { DashboardTable } from '@/components/site/dashboard-table';
import { EmptyState } from '@/components/site/empty-state';
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

export default function ServiceManagementPage() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const user = useAuthStore((state) => state.user);
  const [rows, setRows] = useState<Array<Record<string, string>>>([]);
  const [rawServices, setRawServices] = useState<Array<Record<string, string | number | null>>>([]);
  const [branches, setBranches] = useState<Array<{id: number; name: string; organization: number | null}>>([]);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    duration_minutes: 15,
    queue_prefix: 'A',
    priority: 1,
    is_active: true,
    branch: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadServices = useCallback(async () => {
    if (!accessToken) return;
    try {
      const data = await queueApi.getServices(accessToken);
      setRawServices(data);
      setRows(
        data.map((item) => ({
          id: String(item.id ?? ''),
          service: String(item.name ?? '--'),
          duration: `${item.duration ?? '--'}m`,
          prefix: String(item.prefix ?? '--'),
          priority: String(item.priority ?? '--'),
          status: String(item.status ?? '--')
        }))
      );
      setError(null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load services.');
    }
  }, [accessToken]);

  const handleEdit = (row: Record<string, string>) => {
    const id = parseInt(row.id, 10);
    const service = rawServices.find(s => s.id === id);
    if (service) {
      setEditingId(id);
      setFormData({
        name: String(service.name || ''),
        duration_minutes: Number(service.duration || 15),
        queue_prefix: String(service.prefix || 'A'),
        priority: Number(service.priority || 1),
        is_active: Boolean(service.is_active ?? true),
        branch: String(service.branch || '')
      });
    }
  };

  const handleDelete = async (row: Record<string, string>) => {
    const id = parseInt(row.id, 10);
    if (!accessToken || isNaN(id)) return;
    try {
      await queueApi.deleteService(accessToken, id);
      await loadServices();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Unable to delete service.');
    }
  };

  const handleRestore = async (row: Record<string, string>) => {
    const id = parseInt(row.id, 10);
    if (!accessToken || isNaN(id)) return;
    try {
      await queueApi.restoreService(accessToken, id);
      await loadServices();
    } catch (restoreError) {
      setError(restoreError instanceof Error ? restoreError.message : 'Unable to restore service.');
    }
  };

  const serviceActions = [
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
      setBranches(data.map(item => ({ id: Number(item.id), name: String(item.name), organization: item.organization ? Number(item.organization) : null })));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load branches.');
    }
  }, [accessToken]);

  useEffect(() => {
    loadServices();
    loadBranches();
  }, [accessToken, loadServices, loadBranches]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const selectedBranch = branches.find((branch) => branch.id === Number(formData.branch));
    const organizationId = selectedBranch?.organization ?? user?.organization;
    if (!accessToken || !organizationId) return;
    
    setIsSubmitting(true);
    try {
      if (editingId) {
        // Update existing service
          await queueApi.updateService(accessToken, editingId, {
            name: formData.name,
            duration: formData.duration_minutes,
            prefix: formData.queue_prefix,
            priority: formData.priority,
            is_active: formData.is_active,
            branch: Number(formData.branch),
            organization: organizationId
          });
        setEditingId(null);
      } else {
        // Create new service
        await queueApi.createService(accessToken, {
          organization: organizationId,
          name: formData.name,
          duration: formData.duration_minutes,
          prefix: formData.queue_prefix,
          priority: formData.priority,
          is_active: formData.is_active,
          branch: Number(formData.branch)
        });
      }
      setFormData({ name: '', duration_minutes: 15, queue_prefix: 'A', priority: 1, is_active: true, branch: '' });
      await loadServices();
    } catch (error) {
      setError(error instanceof Error ? error.message : `Unable to ${editingId ? 'update' : 'create'} service.`);
    } finally {
      setIsSubmitting(false);
    }
  };

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
        <DashboardTable title="Services" columns={serviceColumns} rows={rows} actions={serviceActions} />
        <Card>
          <h2 className="text-xl font-semibold text-white">Add / edit service</h2>
          <p className="mt-2 text-sm text-slate-300">Create a new service for your branch.</p>
          <form onSubmit={handleSubmit} className="mt-6 space-y-3 rounded-3xl bg-white/5 p-4">
            <input
              type="text"
              placeholder="Service name"
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
            <input
              type="number"
              placeholder="Duration (minutes)"
              value={formData.duration_minutes}
              onChange={(event) => setFormData({ ...formData, duration_minutes: Number(event.target.value) })}
              className="w-full rounded-2xl bg-slate-950/60 px-4 py-3 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="text"
              placeholder="Queue prefix"
              value={formData.queue_prefix}
              onChange={(event) => setFormData({ ...formData, queue_prefix: event.target.value })}
              maxLength={2}
              className="w-full rounded-2xl bg-slate-950/60 px-4 py-3 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="number"
              placeholder="Priority"
              value={formData.priority}
              onChange={(event) => setFormData({ ...formData, priority: Number(event.target.value) })}
              className="w-full rounded-2xl bg-slate-950/60 px-4 py-3 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <label className="flex items-center gap-2 rounded-2xl bg-slate-950/60 px-4 py-3 text-sm text-white">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(event) => setFormData({ ...formData, is_active: event.target.checked })}
                className="h-4 w-4"
              />
              Active
            </label>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (editingId ? 'Updating...' : 'Creating...') : (editingId ? 'Update Service' : 'Create Service')}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={() => {
                  setEditingId(null);
                  setFormData({ name: '', duration_minutes: 15, queue_prefix: 'A', priority: 1, is_active: true, branch: '' });
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
        <EmptyState title="Service API unavailable" description={`${error} Showing fallback service data while the API catches up.`} actionLabel="Retry later" />
      ) : (
        <EmptyState title="No custom service rules yet" description="Add or edit services to define queue prefixes, durations, and priority behavior." actionLabel="Add service" />
      )}
    </div>
  );
}
