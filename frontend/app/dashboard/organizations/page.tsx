'use client';

import { useCallback, useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { FiltersBar } from '@/components/site/filters-bar';
import { DashboardTable } from '@/components/site/dashboard-table';
import { EmptyState } from '@/components/site/empty-state';
import { queueApi } from '@/lib/queue-api';
import type { TableColumn } from '@/lib/types';
import { useAuthStore } from '@/store/auth-store';

type OrgRow = Record<string, string>;

const orgColumns: Array<TableColumn<OrgRow>> = [
  { key: 'name', label: 'Organization' },
  { key: 'slug', label: 'Slug' },
  { key: 'email', label: 'Contact email' },
  { key: 'phone', label: 'Contact phone' },
  { key: 'status', label: 'Status' }
];

export default function OrganizationsDashboard() {
  const token = useAuthStore((state) => state.accessToken);
  const [rows, setRows] = useState<OrgRow[]>([]);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({ name: '', slug: '', contact_email: '', contact_phone: '' });
  const [loading, setLoading] = useState(false);

  const loadOrganizations = useCallback(async () => {
    if (!token) return;
    try {
      const data = await queueApi.getOrganizations(token);
      setRows(
        data.map((item) => ({
          id: String(item.id ?? ''),
          name: String(item.name ?? '--'),
          slug: String(item.slug ?? '--'),
          email: String(item.contact_email ?? '--'),
          phone: String(item.contact_phone ?? '--'),
          status: String(item.is_active ? 'Active' : 'Archived')
        }))
      );
      setError('');
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load organizations.');
    }
  }, [token]);

  useEffect(() => {
    loadOrganizations();
  }, [loadOrganizations]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) return;
    setLoading(true);
    setError('');
    try {
      await queueApi.createOrganization(token, formData);
      setFormData({ name: '', slug: '', contact_email: '', contact_phone: '' });
      await loadOrganizations();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Unable to create organization.');
    } finally {
      setLoading(false);
    }
  }

  const actions = [
    {
      label: 'Archive',
      onClick: async (row: Record<string, string>) => {
        if (!token) return;
        await queueApi.deleteOrganization(token, Number(row.id));
        await loadOrganizations();
      },
      variant: 'destructive' as const
    },
    {
      label: 'Restore',
      onClick: async (row: Record<string, string>) => {
        if (!token) return;
        await queueApi.restoreOrganization(token, Number(row.id));
        await loadOrganizations();
      }
    }
  ];

  return (
    <div className="space-y-6 px-4 py-6 md:px-6">
      <FiltersBar placeholder="Search organizations..." />
      <div className="grid gap-4 md:grid-cols-3">
        {['Operations', 'Branding', 'Queue rules'].map((item) => (
          <Card key={item}>
            <p className="text-sm text-slate-400">{item}</p>
            <p className="mt-3 text-3xl font-semibold text-white">Live</p>
          </Card>
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <DashboardTable title="Organizations" columns={orgColumns} rows={rows} actions={actions} />
        <Card>
          <h2 className="text-xl font-semibold text-white">Add organization</h2>
          <form className="mt-6 space-y-3" onSubmit={handleSubmit}>
            <input className="w-full rounded-2xl bg-slate-950/60 px-4 py-3 text-sm text-white" placeholder="Name" value={formData.name} onChange={(event) => setFormData((current) => ({ ...current, name: event.target.value, slug: current.slug || event.target.value.toLowerCase().replace(/\s+/g, '-') }))} />
            <input className="w-full rounded-2xl bg-slate-950/60 px-4 py-3 text-sm text-white" placeholder="Slug" value={formData.slug} onChange={(event) => setFormData((current) => ({ ...current, slug: event.target.value }))} />
            <input className="w-full rounded-2xl bg-slate-950/60 px-4 py-3 text-sm text-white" placeholder="Contact email" value={formData.contact_email} onChange={(event) => setFormData((current) => ({ ...current, contact_email: event.target.value }))} />
            <input className="w-full rounded-2xl bg-slate-950/60 px-4 py-3 text-sm text-white" placeholder="Contact phone" value={formData.contact_phone} onChange={(event) => setFormData((current) => ({ ...current, contact_phone: event.target.value }))} />
            {error ? <p className="text-sm text-rose-300">{error}</p> : null}
            <button className="w-full rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white" disabled={loading}>
              {loading ? 'Saving...' : 'Create organization'}
            </button>
          </form>
        </Card>
      </div>
      {!rows.length ? <EmptyState title="No organizations yet" description="Create an organization to start managing branches and queue operations." actionLabel="Create organization" /> : null}
    </div>
  );
}
