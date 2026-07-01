'use client';

import { useRef, useState } from 'react';
import { ConnectionIndicator } from '@/components/realtime/connection-indicator';
import { LiveToast } from '@/components/realtime/live-toast';
import { useQueueWebsocket } from '@/components/realtime/use-queue-websocket';
import { Card } from '@/components/ui/card';
import { Breadcrumbs } from '@/components/site/breadcrumbs';
import { EmptyState } from '@/components/site/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { notificationsApi } from '@/lib/notifications-api';
import { queueApi } from '@/lib/queue-api';
import type { NotificationItem } from '@/lib/types';

export default function CustomerQueuePage() {
  const [token, setToken] = useState('');
  const [mobile, setMobile] = useState('');
  const [status, setStatus] = useState<{ current: string; your: string; ahead: string; wait: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [history, setHistory] = useState<NotificationItem[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);

  function playNotification() {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new window.AudioContext();
      }
      const context = audioContextRef.current;
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.value = 880;
      gain.gain.value = 0.03;
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start();
      oscillator.stop(context.currentTime + 0.15);
    } catch {
      return;
    }
  }

  const { status: socketStatus } = useQueueWebsocket({
    enabled: Boolean(token),
    path: `/ws/queue/customer/${encodeURIComponent(token)}/`,
    onMessage: (payload) => {
      if (payload.notification) {
        const notification = payload.notification;
        setHistory((current) => [
          {
            id: notification.id,
            channel: notification.channel as NotificationItem['channel'],
            event_type: notification.event_type,
            status: notification.status as NotificationItem['status'],
            provider: notification.provider,
            title: notification.title,
            message: notification.message,
            destination: notification.destination,
            queue_token: null,
            queue_token_number: notification.queue_token,
            retry_count: 0,
            max_retries: 3,
            sent_at: null,
            delivered_at: null,
            read_at: notification.read_at,
            created_at: notification.created_at
          },
          ...current
        ].slice(0, 8));
        return;
      }
      if (!payload.token) {
        return;
      }
      const tokenPayload = payload.token;
      setStatus((current) => ({
        current: `${tokenPayload.status} (${tokenPayload.confidence})`,
        your: tokenPayload.token_number,
        ahead: current?.ahead ?? '--',
        wait: `${tokenPayload.estimated_wait_minutes} min`
      }));
      setToast(`Token ${tokenPayload.token_number} is now ${tokenPayload.status.replace('_', ' ')}`);
      if (tokenPayload.status === 'called') {
        playNotification();
      }
      window.setTimeout(() => setToast(null), 2400);
    }
  });

  async function handleLookup() {
    setLoading(true);
    try {
      const data = await queueApi.customerStatus(token, mobile);
      const notificationHistory = await notificationsApi.customerHistory(token, mobile);
      setStatus({
        current: `${data.status} (${data.confidence})`,
        your: data.token_number,
        ahead: String(data.people_ahead),
        wait: `${data.estimated_wait_minutes} min`
      });
      setHistory(notificationHistory.results);
      setError(null);
    } catch (lookupError) {
      setError(lookupError instanceof Error ? lookupError.message : 'Unable to load token status.');
      setStatus(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 md:px-6">
      <div className="flex items-center justify-between gap-4">
        <Breadcrumbs items={[{ label: 'Queue', href: '/queue' }, { label: 'Track status' }]} />
        <ConnectionIndicator status={socketStatus} />
      </div>
      <Card>
        <h1 className="text-3xl font-semibold">Your queue status</h1>
        <div className="mt-6 grid gap-4 md:grid-cols-[1fr_1fr_auto]">
          <Input aria-label="Token number" placeholder="Token number" value={token} onChange={(event) => setToken(event.target.value)} />
          <Input aria-label="Mobile number" placeholder="Mobile number" value={mobile} onChange={(event) => setMobile(event.target.value)} />
          <Button onClick={handleLookup} disabled={loading}>{loading ? 'Checking...' : 'Track token'}</Button>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-4">
          {[
            ['Current Token', status?.current ?? '--'],
            ['Your Token', status?.your ?? '--'],
            ['People Ahead', status?.ahead ?? '--'],
            ['Estimated Wait', status?.wait ?? '--']
          ].map(([label, value]) => (
            <div key={label} className="rounded-3xl bg-white/5 p-4">
              <p className="text-sm text-slate-400">{label}</p>
              <p className="mt-3 text-2xl font-semibold text-white">{value}</p>
            </div>
          ))}
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((item) => (
            <Skeleton key={item} className="h-24" />
          ))}
        </div>
        <div className="mt-8 rounded-3xl bg-white/5 p-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-white">Notification history</h2>
            <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Live updates</p>
          </div>
          <div className="mt-4 space-y-3">
            {history.length > 0 ? history.map((item) => (
              <div key={item.id} className="rounded-2xl bg-slate-950/40 px-4 py-3">
                <p className="text-sm text-white">{item.title}</p>
                <p className="mt-1 text-xs text-slate-400">{item.message}</p>
              </div>
            )) : (
              <p className="text-sm text-slate-400">Your SMS, WhatsApp, email, and in-app history will appear here after lookup.</p>
            )}
          </div>
        </div>
        <div className="mt-8">
          {error ? (
            <EmptyState title="Token status unavailable" description={error} actionLabel="Try again" />
          ) : (
            <EmptyState
              title="Waiting for queue data"
              description="Once you join a queue, this card updates with your live position, AI wait estimate, and confidence level."
              actionLabel="Join queue"
            />
          )}
        </div>
      </Card>
      <LiveToast message={toast} />
    </div>
  );
}
