'use client';

import { useEffect, useState } from 'react';
import { ConnectionIndicator } from '@/components/realtime/connection-indicator';
import { LiveToast } from '@/components/realtime/live-toast';
import { useQueueWebsocket } from '@/components/realtime/use-queue-websocket';
import { Card } from '@/components/ui/card';
import { Breadcrumbs } from '@/components/site/breadcrumbs';
import { EmptyState } from '@/components/site/empty-state';
import { queueRows } from '@/lib/mock-data';
import { queueApi } from '@/lib/queue-api';

type DisplayRow = {
  token: string;
  customer: string;
  wait?: string;
};

export default function PublicDisplayPage() {
  const [rows, setRows] = useState<DisplayRow[]>(queueRows.map((row) => ({ token: row.token, customer: row.customer, wait: row.eta })));
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const { status } = useQueueWebsocket({
    path: '/ws/queue/public/all/',
    onMessage: (payload) => {
      if (!payload.token) {
        return;
      }
      const token = payload.token;
      setRows((current) => {
        const next = [
          {
            token: token.token_number,
            customer: token.customer_name,
            wait: `${token.estimated_wait_minutes} min`
          },
          ...current.filter((row) => row.token !== token.token_number)
        ];
        return next.slice(0, 10);
      });
      setToast(`${token.token_number} ${payload.event.replace('token.', '').replace('_', ' ')}`);
      window.setTimeout(() => setToast(null), 2200);
    }
  });

  useEffect(() => {
    async function loadDisplay() {
      try {
        const data = await queueApi.publicStatus();
        setRows(
          data.map((item) => ({
            token: item.token_number,
            customer: item.customer_name,
            wait: `${item.estimated_wait_minutes} min`
          }))
        );
        setError(null);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Unable to load public queue status.');
      }
    }

    void loadDisplay();
  }, []);

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-white md:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex items-center justify-between gap-4">
          <Breadcrumbs items={[{ label: 'Display', href: '/display' }, { label: 'Live screen' }]} />
          <ConnectionIndicator status={status} />
        </div>
      </div>
      <Card className="mx-auto max-w-7xl mt-4">
        <p className="text-sm text-emerald-300">Now serving</p>
        <h1 className="mt-3 text-7xl font-semibold tracking-tight">{rows[0]?.token ?? 'A-014'}</h1>
        <p className="mt-4 text-slate-300">{rows[0]?.customer ?? 'Counter 03'}</p>
        <p className="mt-2 text-sm text-cyan-200">Estimated wait: {rows[0]?.wait ?? '--'}</p>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {rows.slice(0, 3).map((row) => (
            <div key={row.token} className="rounded-3xl bg-white/5 p-5">
              <p className="text-sm text-slate-400">Next token</p>
              <p className="mt-2 text-2xl font-semibold">{row.token}</p>
              <p className="mt-2 text-sm text-slate-300">{row.customer}</p>
              <p className="mt-2 text-sm text-cyan-200">ETA {row.wait ?? '--'}</p>
            </div>
          ))}
        </div>
        <div className="mt-8">
          {error ? (
            <EmptyState title="Display API unavailable" description={`${error} Showing fallback queue display data.`} actionLabel="Retry later" />
          ) : (
            <EmptyState title="No announcement queued" description="Branch-wide display announcements can appear here once connected to live admin updates." actionLabel="Create announcement" />
          )}
        </div>
      </Card>
      <LiveToast message={toast} />
    </main>
  );
}
