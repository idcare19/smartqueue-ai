'use client';

import { useEffect, useState } from 'react';
import { ConnectionIndicator } from '@/components/realtime/connection-indicator';
import { LiveToast } from '@/components/realtime/live-toast';
import { useQueueWebsocket } from '@/components/realtime/use-queue-websocket';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { Card } from '@/components/ui/card';
import { Breadcrumbs } from '@/components/site/breadcrumbs';
import { FiltersBar } from '@/components/site/filters-bar';
import { DashboardTable } from '@/components/site/dashboard-table';
import { EmptyState } from '@/components/site/empty-state';
import { notificationsApi } from '@/lib/notifications-api';
import { queueRows } from '@/lib/mock-data';
import { queueApi } from '@/lib/queue-api';
import type { NotificationItem, TableColumn } from '@/lib/types';
import { useAuthStore } from '@/store/auth-store';

const staffQueueColumns: Array<TableColumn<Record<string, string>>> = [
  { key: 'token', label: 'Token' },
  { key: 'customer', label: 'Customer' },
  { key: 'status', label: 'Status' },
  { key: 'eta', label: 'ETA' }
] as const;

export default function StaffDashboard() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const user = useAuthStore((state) => state.user);
  const [rows, setRows] = useState<Array<Record<string, string>>>(queueRows);
  const [error, setError] = useState<string | null>(null);
  const [acting, setActing] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [notificationActivity, setNotificationActivity] = useState<NotificationItem[]>([]);

  const { status: socketStatus } = useQueueWebsocket({
    enabled: Boolean(accessToken && user?.branch),
    token: accessToken,
    path: `/ws/queue/staff/${user?.organization ?? 'scope'}/?branch=${user?.branch ?? ''}`,
    onMessage: (payload) => {
      if (!payload.token) {
        return;
      }
      const token = payload.token;
      setRows((current) => {
        const next = current.filter((row) => row.token !== token.token_number);
        next.unshift({
          token: token.token_number,
          customer: token.customer_name,
          status: token.status,
          eta: `${token.estimated_wait_minutes} min`
        });
        return next.slice(0, 12);
      });
      setToast(`${token.token_number} ${payload.event.replace('token.', '').replace('_', ' ')}`);
      window.setTimeout(() => setToast(null), 2200);
    }
  });

  useEffect(() => {
    async function loadQueue() {
      try {
        const data = await queueApi.getStaffQueue(accessToken, user?.branch ? String(user.branch) : undefined);
        setRows(
          data.map((item) => ({
            token: item.token_number,
            customer: item.customer_name,
            status: item.status,
            eta: `${item.estimated_wait_minutes} min`
          }))
        );
        setError(null);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Unable to load queue actions.');
      }
    }

    if (accessToken) {
      void loadQueue();
    }
  }, [accessToken, user?.branch]);

  async function handleCallNext() {
    if (!accessToken || !user?.branch) return;
    setActing('call');
    try {
      const calledToken = await queueApi.callNext(accessToken, { branch: user.branch });
      const data = await queueApi.getStaffQueue(accessToken, String(user.branch));
      setRows(
        data.map((item) => ({
          token: item.token_number,
          customer: item.customer_name,
          status: item.status,
          eta: `${item.estimated_wait_minutes} min`
        }))
      );
      const notificationResponse = await notificationsApi.list(accessToken, `queue_token=${calledToken.id}`);
      setNotificationActivity(notificationResponse.results);
      setError(null);
    } finally {
      setActing(null);
    }
  }

  return (
    <ProtectedRoute>
      <div className="space-y-6 px-4 py-6 md:px-6">
        <div className="flex items-center justify-between gap-4">
          <Breadcrumbs items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Staff' }]} />
          <ConnectionIndicator status={socketStatus} />
        </div>
        <FiltersBar placeholder="Search tokens or customers..." />
        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <button className="w-full text-left" onClick={handleCallNext} disabled={acting === 'call'}>
              <h2 className="text-xl font-semibold text-white">{acting === 'call' ? 'Calling...' : 'Call Next'}</h2>
              <p className="mt-3 text-sm text-slate-300">Advance the next waiting token and trigger SMS, WhatsApp, email, and in-app delivery.</p>
            </button>
          </Card>
          {['Recall', 'Skip'].map((action) => (
            <Card key={action}>
              <h2 className="text-xl font-semibold text-white">{action}</h2>
              <p className="mt-3 text-sm text-slate-300">Structured for live queue actions with AI wait predictions kept in sync.</p>
            </Card>
          ))}
        </div>
        <Card>
          <h2 className="text-xl font-semibold text-white">Notification sending progress</h2>
          <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {notificationActivity.length > 0 ? notificationActivity.map((item) => (
              <div key={item.id} className="rounded-2xl bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.22em] text-slate-400">{item.channel}</p>
                <p className="mt-2 text-lg font-semibold text-white">{item.status}</p>
                <p className="mt-2 text-sm text-slate-300">{item.provider || 'pending provider'}</p>
              </div>
            )) : (
              <div className="rounded-2xl bg-white/5 p-4 text-sm text-slate-300 md:col-span-2 xl:col-span-4">
                Trigger a call action to inspect live delivery progress for the selected token.
              </div>
            )}
          </div>
        </Card>
        <DashboardTable title="Live token list" columns={staffQueueColumns} rows={rows} />
        {error ? (
          <EmptyState title="Staff queue API unavailable" description={`${error} Showing fallback queue data while the API catches up.`} actionLabel="Retry later" />
        ) : (
          <EmptyState title="No manual staff override" description="When supervisors intervene in queue flow, those actions can surface here alongside live token operations." actionLabel="Open queue controls" />
        )}
      </div>
      <LiveToast message={toast} />
    </ProtectedRoute>
  );
}
