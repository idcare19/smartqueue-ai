'use client';

import { useEffect, useMemo, useState } from 'react';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { Breadcrumbs } from '@/components/site/breadcrumbs';
import { EmptyState } from '@/components/site/empty-state';
import { FiltersBar } from '@/components/site/filters-bar';
import { Card } from '@/components/ui/card';
import { notificationsApi } from '@/lib/notifications-api';
import type { NotificationItem, NotificationStats } from '@/lib/types';
import { useAuthStore } from '@/store/auth-store';

export default function NotificationCenterPage() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [stats, setStats] = useState<NotificationStats>({ total: 0, unread: 0, failed: 0, delivered: 0, providers: [] });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [error, setError] = useState<string | null>(null);

  const query = useMemo(() => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (statusFilter) params.set('status', statusFilter);
    return params.toString();
  }, [search, statusFilter]);

  useEffect(() => {
    async function loadCenter() {
      if (!accessToken) return;
      try {
        const [notificationResponse, statsResponse] = await Promise.all([
          notificationsApi.list(accessToken, query),
          notificationsApi.stats(accessToken)
        ]);
        setItems(notificationResponse.results);
        setStats(statsResponse);
        setError(null);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Unable to load notification center.');
      }
    }

    void loadCenter();
  }, [accessToken, query]);

  return (
    <ProtectedRoute>
      <div className="space-y-6 px-4 py-6 md:px-6">
        <div className="flex items-center justify-between gap-4">
          <Breadcrumbs items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Notifications' }]} />
          <button
            className="rounded-full bg-white/5 px-4 py-2 text-sm text-slate-200 transition hover:bg-white/10"
            onClick={() =>
              accessToken
                ? notificationsApi.markAllRead(accessToken).then(() =>
                    setItems((current) => current.map((item) => ({ ...item, status: 'read', read_at: new Date().toISOString() })))
                  )
                : undefined
            }
          >
            Mark all as read
          </button>
        </div>
        <FiltersBar placeholder="Search notifications by token, title, or destination..." />
        <div className="flex flex-wrap gap-2">
          {['', 'sent', 'delivered', 'failed', 'read'].map((item) => (
            <button
              key={item || 'all'}
              className={`rounded-full px-4 py-2 text-sm ${statusFilter === item ? 'bg-emerald-400 text-slate-950' : 'bg-white/5 text-slate-300'}`}
              onClick={() => setStatusFilter(item)}
            >
              {item || 'All'}
            </button>
          ))}
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Quick search..."
            className="min-w-[14rem] rounded-full border border-white/10 bg-slate-950/50 px-4 py-2 text-sm text-white outline-none"
          />
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            ['Total notifications', String(stats.total)],
            ['Unread', String(stats.unread)],
            ['Delivered', String(stats.delivered)],
            ['Failed', String(stats.failed)]
          ].map(([label, value]) => (
            <Card key={label}>
              <p className="text-sm text-slate-400">{label}</p>
              <p className="mt-3 text-3xl font-semibold text-white">{value}</p>
            </Card>
          ))}
        </div>
        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <Card className="space-y-4">
            <h2 className="text-xl font-semibold text-white">Notification history</h2>
            {items.map((item) => (
              <div key={item.id} className="rounded-3xl bg-white/5 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-white">{item.title}</p>
                    <p className="mt-1 text-sm text-slate-300">{item.message}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full bg-white/5 px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-slate-400">{item.channel}</span>
                    <span className="rounded-full bg-white/5 px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-slate-400">{item.status}</span>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-slate-500">
                  <span>Token {item.queue_token_number || '--'}</span>
                  <span>{item.provider || 'provider pending'}</span>
                  <span>{new Date(item.created_at).toLocaleString()}</span>
                </div>
              </div>
            ))}
          </Card>
          <Card>
            <h2 className="text-xl font-semibold text-white">Provider health</h2>
            <div className="mt-6 space-y-3">
              {stats.providers.map((provider) => (
                <div key={provider.channel} className="rounded-2xl bg-white/5 px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm text-white">{provider.provider}</p>
                    <span className={`rounded-full px-3 py-1 text-[11px] uppercase tracking-[0.2em] ${provider.enabled ? 'bg-emerald-400 text-slate-950' : 'bg-rose-400/20 text-rose-200'}`}>
                      {provider.enabled ? 'enabled' : 'disabled'}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-slate-400">
                    {provider.missing_credentials.length > 0 ? `Missing: ${provider.missing_credentials.join(', ')}` : 'Credentials look ready.'}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-6">
              {error ? (
                <EmptyState title="Notification center fallback" description={error} actionLabel="Retry soon" />
              ) : (
                <EmptyState title="Delivery stream healthy" description="New queue events land here automatically through the shared realtime layer." actionLabel="Open settings" />
              )}
            </div>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  );
}
