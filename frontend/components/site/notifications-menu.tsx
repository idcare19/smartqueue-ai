'use client';

import Link from 'next/link';
import { Bell } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { notificationsApi } from '@/lib/notifications-api';
import { notifications as fallbackNotifications, notificationStatsFallback } from '@/lib/mock-data';
import type { NotificationItem } from '@/lib/types';
import { useAuthStore } from '@/store/auth-store';
import { useQueueWebsocket } from '@/components/realtime/use-queue-websocket';

export function NotificationsMenu() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const user = useAuthStore((state) => state.user);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [items, setItems] = useState<NotificationItem[]>(fallbackNotifications);
  const [count, setCount] = useState(notificationStatsFallback.unread);
  const [loading, setLoading] = useState(false);

  const query = useMemo(() => {
    const params = new URLSearchParams();
    params.set('page', String(page));
    if (search) params.set('search', search);
    if (filter === 'unread') params.set('status', 'sent');
    return params.toString();
  }, [filter, page, search]);

  const loadNotifications = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const [notificationResponse, statsResponse] = await Promise.all([
        notificationsApi.list(accessToken, query),
        notificationsApi.stats(accessToken)
      ]);
      setItems(notificationResponse.results);
      setCount(statsResponse.unread);
    } finally {
      setLoading(false);
    }
  }, [accessToken, query]);

  useEffect(() => {
    if (open) {
      void loadNotifications();
    }
  }, [open, loadNotifications]);

  useQueueWebsocket({
    enabled: Boolean(open && accessToken && user?.organization),
    token: accessToken,
    path: `/ws/queue/organization/${user?.organization ?? 'scope'}/`,
    onMessage: (payload) => {
      if (payload.event === 'notification.created' && open) {
        void loadNotifications();
      }
    }
  });

  return (
    <div className="relative">
      <Button variant="secondary" onClick={() => setOpen((value) => !value)} aria-label="Open notifications center">
        <Bell className="mr-2 h-4 w-4" />
        Alerts
        {count > 0 ? (
          <span className="ml-2 rounded-full bg-emerald-400 px-2 py-0.5 text-[11px] font-semibold text-slate-950">
            {count}
          </span>
        ) : null}
      </Button>
      {open ? (
        <div className="absolute right-0 mt-3 w-[24rem] rounded-3xl border border-white/10 bg-slate-950 p-4 shadow-2xl shadow-black/40">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-medium text-white">Notifications</p>
            <button
              className="text-xs text-emerald-300 transition hover:text-emerald-200"
              onClick={() => accessToken ? notificationsApi.markAllRead(accessToken).then(() => void loadNotifications()) : undefined}
            >
              Mark all read
            </button>
          </div>
          <div className="mt-4 flex gap-2">
            <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search notifications..." />
            <button
              className={`rounded-full px-3 py-2 text-xs ${filter === 'all' ? 'bg-emerald-400 text-slate-950' : 'bg-white/5 text-slate-300'}`}
              onClick={() => setFilter('all')}
            >
              All
            </button>
            <button
              className={`rounded-full px-3 py-2 text-xs ${filter === 'unread' ? 'bg-emerald-400 text-slate-950' : 'bg-white/5 text-slate-300'}`}
              onClick={() => setFilter('unread')}
            >
              Unread
            </button>
          </div>
          <div className="mt-4 space-y-3">
            {items.map((item) => (
              <div key={item.id} className="rounded-2xl bg-white/5 p-3">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm text-slate-200">{item.title}</p>
                  <span className="rounded-full bg-white/5 px-2 py-1 text-[10px] uppercase tracking-[0.2em] text-slate-400">
                    {item.channel}
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-400">{item.message}</p>
                <p className="mt-2 text-[11px] text-slate-500">{new Date(item.created_at).toLocaleString()}</p>
              </div>
            ))}
            {loading ? <p className="text-xs text-slate-500">Loading notifications...</p> : null}
          </div>
          <div className="mt-4 flex items-center justify-between">
            <div className="flex gap-2">
              <button className="rounded-full bg-white/5 px-3 py-1 text-xs text-slate-300" onClick={() => setPage((value) => Math.max(1, value - 1))}>
                Prev
              </button>
              <button className="rounded-full bg-white/5 px-3 py-1 text-xs text-slate-300" onClick={() => setPage((value) => value + 1)}>
                Next
              </button>
            </div>
            <Link className="text-xs text-emerald-300 hover:text-emerald-200" href="/dashboard/notifications" onClick={() => setOpen(false)}>
              Open center
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
