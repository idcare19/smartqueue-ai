'use client';

import { useCallback, useEffect, useState } from 'react';
import { useQueueWebsocket } from '@/components/realtime/use-queue-websocket';
import { queueApi } from '@/lib/queue-api';
import type { QueueApiToken } from '@/lib/types';

export default function PublicDisplay() {
  const [, setTokens] = useState<QueueApiToken[]>([]);
  const [currentToken, setCurrentToken] = useState<QueueApiToken | null>(null);
  const [nextTokens, setNextTokens] = useState<QueueApiToken[]>([]);
  const [branch, setBranch] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Extract branch from URL search params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const branchParam = params.get('branch');
    if (branchParam) {
      setBranch(branchParam);
    }
  }, []);

  // Load initial queue status
  const loadQueueStatus = useCallback(async () => {
    if (!branch) return;
    setLoading(true);
    try {
      const data = await queueApi.publicStatus(branch);
      processQueueData(data);
      setError(null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load queue status.');
    } finally {
      setLoading(false);
    }
  }, [branch]);

  // Process queue data to separate current and next tokens
  const processQueueData = (data: QueueApiToken[]) => {
    const sorted = [...data];
    
    const serving = sorted.find(t => t.status === 'serving');
    const waiting = sorted.filter(t => t.status === 'waiting').slice(0, 5);
    
    setCurrentToken(serving || null);
    setNextTokens(waiting);
    setTokens(sorted);
  };

  // Initial load
  useEffect(() => {
    if (branch) {
      loadQueueStatus();
      const interval = setInterval(loadQueueStatus, 30000);
      return () => clearInterval(interval);
    }
  }, [branch, loadQueueStatus]);

  // WebSocket for real-time updates
  const { status: socketStatus } = useQueueWebsocket({
    enabled: Boolean(branch),
    path: `/ws/queue/public/${branch}/`,
    onMessage: (payload) => {
      if (payload.token) {
        processQueueData([payload.token]);
      }
    }
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-white text-2xl">Loading queue display...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-red-400 text-2xl">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white p-8">
      <header className="text-center mb-12">
        <h1 className="text-5xl font-bold mb-2">SmartQueue AI</h1>
        <p className="text-slate-400 text-xl">Live Queue Status</p>
        {socketStatus !== 'connected' && (
          <p className="text-yellow-400 mt-2">WebSocket disconnected - Refreshing automatically...</p>
        )}
      </header>

      {/* Current serving token */}
      <section className="mb-12">
        <div className="max-w-4xl mx-auto bg-gradient-to-r from-blue-600 to-blue-800 rounded-3xl p-12 text-center shadow-2xl">
          <h2 className="text-3xl font-semibold mb-4">Now Serving</h2>
          {currentToken ? (
            <>
              <div className="text-8xl font-bold mb-4">{currentToken.token_number}</div>
              <p className="text-2xl">{currentToken.customer_name}</p>
            </>
          ) : (
            <div className="text-4xl text-blue-200">No tokens being served</div>
          )}
        </div>
      </section>

      {/* Next tokens */}
      <section>
        <h2 className="text-3xl font-semibold text-center mb-8">Up Next</h2>
        <div className="max-w-4xl mx-auto grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {nextTokens.length > 0 ? nextTokens.map((token, index) => (
            <div key={token.token_number} className="bg-white/5 rounded-2xl p-6 text-center">
              <div className="text-sm text-slate-400 mb-2">Queue Position {index + 1}</div>
              <div className="text-4xl font-bold mb-2">{token.token_number}</div>
              <p className="text-slate-300">{token.customer_name}</p>
            </div>
          )) : (
            <div className="col-span-full text-center text-slate-400 text-xl py-12">
              No waiting tokens in queue
            </div>
          )}
        </div>
      </section>

      <footer className="mt-16 text-center text-slate-500">
        <p>Auto-refreshes every 30 seconds • Last updated: {new Date().toLocaleTimeString()}</p>
      </footer>
    </div>
  );
}
