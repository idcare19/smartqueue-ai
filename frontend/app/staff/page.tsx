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
import { queueApi } from '@/lib/queue-api';
import type { TableColumn } from '@/lib/types';
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
  const [rows, setRows] = useState<Array<Record<string, string>>>([]);
  const [error, setError] = useState<string | null>(null);
  const [acting, setActing] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [counters, setCounters] = useState<Array<{id: number; name: string}>>([]);
  const [selectedCounter, setSelectedCounter] = useState<string>('');

  // Load counters for the user's branch
  useEffect(() => {
    const loadCounters = async () => {
      if (!accessToken) return;
      try {
        const countersData = await queueApi.getCounters(accessToken);
        const userCounters = countersData.filter(c => c.branch === user?.branch);
        setCounters(userCounters.map(item => ({ id: Number(item.id), name: String(item.name) })));
        if (userCounters.length > 0) {
          setSelectedCounter(String(userCounters[0].id));
        }
    } catch {
      console.error('Failed to load counters');
    }
    };
    loadCounters();
  }, [accessToken, user?.branch]);

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

  const refreshQueue = async () => {
    if (!accessToken || !user?.branch) return;
    const data = await queueApi.getStaffQueue(accessToken, String(user.branch));
    setRows(
      data.map((item) => ({
        token: item.token_number,
        customer: item.customer_name,
        status: item.status,
        eta: `${item.estimated_wait_minutes} min`
        }))
      );
  };

  async function handleCallNext() {
    if (!accessToken || !user?.branch || !selectedCounter) return;
    setActing('call');
    try {
      await queueApi.callNext(accessToken, { branch: user.branch, counter: Number(selectedCounter) });
      await refreshQueue();
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to call next token.');
    } finally {
      setActing(null);
    }
  }

  async function handleRecall(tokenId: number) {
    if (!accessToken) return;
    setActing(`recall-${tokenId}`);
    try {
      await queueApi.recallToken(accessToken, tokenId);
      await refreshQueue();
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to recall token.');
    } finally {
      setActing(null);
    }
  }

  async function handleSkip(tokenId: number) {
    if (!accessToken) return;
    setActing(`skip-${tokenId}`);
    try {
      await queueApi.skipToken(accessToken, tokenId);
      await refreshQueue();
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to skip token.');
    } finally {
      setActing(null);
    }
  }

  async function handleMarkServing(tokenId: number) {
    if (!accessToken) return;
    setActing(`serving-${tokenId}`);
    try {
      await queueApi.markServing(accessToken, tokenId);
      await refreshQueue();
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to mark token as serving.');
    } finally {
      setActing(null);
    }
  }

  async function handleComplete(tokenId: number) {
    if (!accessToken) return;
    setActing(`complete-${tokenId}`);
    try {
      await queueApi.completeToken(accessToken, tokenId);
      await refreshQueue();
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to complete token.');
    } finally {
      setActing(null);
    }
  }

  async function handleNoShow(tokenId: number) {
    if (!accessToken) return;
    setActing(`noshow-${tokenId}`);
    try {
      await queueApi.markNoShow(accessToken, tokenId);
      await refreshQueue();
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to mark token as no-show.');
    } finally {
      setActing(null);
    }
  }

  async function handleCancel(tokenId: number) {
    if (!accessToken) return;
    setActing(`cancel-${tokenId}`);
    try {
      await queueApi.cancelToken(accessToken, tokenId);
      await refreshQueue();
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to cancel token.');
    } finally {
      setActing(null);
    }
  }

  // Table row actions configuration
  const tableActions = [
    {
      label: 'Serving',
      onClick: (row: Record<string, string>) => {
        const tokenId = parseInt(row.token, 10);
        if (!isNaN(tokenId)) handleMarkServing(tokenId);
      }
    },
    {
      label: 'Complete',
      onClick: (row: Record<string, string>) => {
        const tokenId = parseInt(row.token, 10);
        if (!isNaN(tokenId)) handleComplete(tokenId);
      }
    },
    {
      label: 'Recall',
      onClick: (row: Record<string, string>) => {
        const tokenId = parseInt(row.token, 10);
        if (!isNaN(tokenId)) handleRecall(tokenId);
      }
    },
    {
      label: 'Skip',
      onClick: (row: Record<string, string>) => {
        const tokenId = parseInt(row.token, 10);
        if (!isNaN(tokenId)) handleSkip(tokenId);
      }
    },
    {
      label: 'No-Show',
      onClick: (row: Record<string, string>) => {
        const tokenId = parseInt(row.token, 10);
        if (!isNaN(tokenId)) handleNoShow(tokenId);
      },
      variant: 'destructive' as const
    },
    {
      label: 'Cancel',
      onClick: (row: Record<string, string>) => {
        const tokenId = parseInt(row.token, 10);
        if (!isNaN(tokenId)) handleCancel(tokenId);
      },
      variant: 'destructive' as const
    }
  ];

  return (
    <ProtectedRoute>
      <div className="space-y-6 px-4 py-6 md:px-6">
        <div className="flex items-center justify-between gap-4">
          <Breadcrumbs items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Staff' }]} />
          <ConnectionIndicator status={socketStatus} />
        </div>
        <FiltersBar placeholder="Search tokens or customers..." />
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          <Card>
            <h2 className="text-xl font-semibold text-white">Call Next</h2>
            <p className="mt-2 text-sm text-slate-300">Call the next waiting token in queue.</p>
            <select
              value={selectedCounter}
              onChange={(e) => setSelectedCounter(e.target.value)}
              className="mt-3 w-full rounded-2xl bg-slate-950/60 px-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {counters.map(counter => (
                <option key={counter.id} value={counter.id}>{counter.name}</option>
              ))}
            </select>
            <button
              onClick={handleCallNext}
              disabled={acting === 'call' || !selectedCounter}
              className="mt-3 w-full rounded-2xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {acting === 'call' ? 'Calling...' : 'Call Next'}
            </button>
          </Card>
          <Card>
            <h2 className="text-xl font-semibold text-white">Queue Actions</h2>
            <p className="mt-2 text-sm text-slate-300">Select a token from the list to perform actions.</p>
            <div className="mt-3 space-y-2">
              <p className="text-xs text-slate-400">Available actions:</p>
              <ul className="text-xs text-slate-300 list-disc list-inside">
                <li>Mark as Serving</li>
                <li>Complete</li>
                <li>Recall</li>
                <li>Skip</li>
              </ul>
            </div>
          </Card>
        </div>
        <DashboardTable title="Live token list" columns={staffQueueColumns} rows={rows} actions={tableActions} />
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
