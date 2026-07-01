'use client';

import { useEffect, useMemo, useState } from 'react';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { ConnectionIndicator } from '@/components/realtime/connection-indicator';
import { useQueueWebsocket } from '@/components/realtime/use-queue-websocket';
import { Breadcrumbs } from '@/components/site/breadcrumbs';
import { EmptyState } from '@/components/site/empty-state';
import { FiltersBar } from '@/components/site/filters-bar';
import { Card } from '@/components/ui/card';
import { queueApi } from '@/lib/queue-api';
import type { AnalyticsSummary } from '@/lib/types';
import { useAuthStore } from '@/store/auth-store';

function formatHour(hour: number | null) {
  if (hour === null) {
    return 'Unknown';
  }

  return `${String(hour).padStart(2, '0')}:00`;
}

function formatConfidence(confidence: string | undefined) {
  if (!confidence) {
    return '--';
  }

  return confidence.replace('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default function AnalyticsDashboard() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const user = useAuthStore((state) => state.user);
  const [summary, setSummary] = useState<AnalyticsSummary>({
    average_wait_time_minutes: 0,
    average_service_time_minutes: 0,
    peak_hours: [],
    no_show_rate: 0,
    completed_tokens: 0,
    queue_load_by_service: [],
    counter_performance: [],
    insights: [],
    prediction: null
  });
  const [error, setError] = useState<string | null>(null);

  const { status } = useQueueWebsocket({
    enabled: Boolean(accessToken && user?.organization),
    token: accessToken,
    path: `/ws/queue/organization/${user?.organization ?? 'scope'}/`,
    onMessage: (payload) => {
      if (!payload.token) {
        return;
      }
      const token = payload.token;
      setSummary((current) => ({
        ...current,
        prediction: {
          estimated_wait_minutes: token.estimated_wait_minutes,
          confidence: token.confidence
        }
      }));
    }
  });

  useEffect(() => {
    async function loadSummary() {
      try {
        const data = await queueApi.analyticsSummary(accessToken, user?.branch ? String(user.branch) : undefined);
        setSummary(data);
        setError(null);
      } catch (summaryError) {
        setError(summaryError instanceof Error ? summaryError.message : 'Unable to load analytics summary.');
      }
    }

    if (accessToken) {
      void loadSummary();
    }
  }, [accessToken, user?.branch]);

  const topCards = useMemo(
    () => [
      {
        title: 'Average wait time',
        value: `${summary.average_wait_time_minutes} min`,
        detail: "Live queue-to-call delay based on today's traffic."
      },
      {
        title: 'Average service time',
        value: `${summary.average_service_time_minutes} min`,
        detail: 'Measured from serving start to completed tokens.'
      },
      {
        title: 'AI prediction',
        value: summary.prediction ? `${summary.prediction.estimated_wait_minutes} min` : '--',
        detail: `Confidence: ${formatConfidence(summary.prediction?.confidence)}`
      }
    ],
    [summary]
  );

  return (
    <ProtectedRoute>
      <div className="space-y-6 px-4 py-6 md:px-6">
        <div className="flex items-center justify-between gap-4">
          <Breadcrumbs items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Analytics' }]} />
          <ConnectionIndicator status={status} />
        </div>
        <FiltersBar placeholder="Filter analytics by branch or date..." />
        <div className="grid gap-6 lg:grid-cols-3">
          {topCards.map((item) => (
            <Card key={item.title}>
              <p className="text-sm text-slate-400">{item.title}</p>
              <h2 className="mt-3 text-2xl font-semibold text-white">{item.value}</h2>
              <p className="mt-2 text-sm text-slate-300">{item.detail}</p>
            </Card>
          ))}
        </div>
        <div className="grid gap-6 xl:grid-cols-2">
          <Card>
            <h2 className="text-xl font-semibold">Peak hours</h2>
            <div className="mt-6 grid gap-3">
              {summary.peak_hours.map((item) => (
                <div key={`${item.hour}-${item.total}`} className="flex items-center gap-4">
                  <span className="w-16 text-sm text-slate-400">{formatHour(item.hour)}</span>
                  <div className="h-3 flex-1 rounded-full bg-white/5">
                    <div
                      className="h-3 rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400"
                      style={{ width: `${Math.min(item.total * 12, 100)}%` }}
                    />
                  </div>
                  <span className="w-10 text-right text-sm text-slate-300">{item.total}</span>
                </div>
              ))}
            </div>
          </Card>
          <Card>
            <h2 className="text-xl font-semibold">Queue load by service</h2>
            <div className="mt-6 space-y-4">
              {summary.queue_load_by_service.map((item) => (
                <div key={item.service}>
                  <div className="mb-2 flex justify-between text-sm text-slate-300">
                    <span>{item.service}</span>
                    <span>{item.total}</span>
                  </div>
                  <div className="h-3 rounded-full bg-white/5">
                    <div
                      className="h-3 rounded-full bg-gradient-to-r from-violet-400 to-pink-400"
                      style={{ width: `${Math.min(item.total * 10, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <Card>
            <h2 className="text-xl font-semibold">Counter performance</h2>
            <div className="mt-6 space-y-3">
              {summary.counter_performance.map((item) => (
                <div key={item.counter} className="flex items-center justify-between rounded-2xl bg-white/5 px-4 py-3">
                  <span className="text-sm text-slate-200">{item.counter}</span>
                  <span className="text-sm text-slate-400">{item.total} completed</span>
                </div>
              ))}
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl bg-white/5 px-4 py-4">
                <p className="text-sm text-slate-400">Completed today</p>
                <p className="mt-2 text-2xl font-semibold text-white">{summary.completed_tokens}</p>
              </div>
              <div className="rounded-2xl bg-white/5 px-4 py-4">
                <p className="text-sm text-slate-400">No-show rate</p>
                <p className="mt-2 text-2xl font-semibold text-white">{summary.no_show_rate}%</p>
              </div>
            </div>
          </Card>
          <Card>
            <h2 className="text-xl font-semibold">Smart insights</h2>
            <div className="mt-6 space-y-3">
              {summary.insights.map((item) => (
                <div key={item} className="rounded-2xl bg-white/5 px-4 py-3 text-sm text-slate-300">
                  {item}
                </div>
              ))}
            </div>
            <div className="mt-6">
              {error ? (
                <EmptyState
                  title="Live analytics API unavailable"
                  description={`${error} Showing premium fallback insights until the analytics endpoint responds.`}
                  actionLabel="Retry soon"
                />
              ) : (
                <EmptyState
                  title="Insight engine active"
                  description="AI predictions update automatically as queue events arrive from the real-time engine."
                  actionLabel="Export analytics"
                />
              )}
            </div>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  );
}
