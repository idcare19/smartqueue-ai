'use client';

import { useEffect, useRef, useState } from 'react';
import type { ConnectionStatus, QueueRealtimePayload } from '@/lib/realtime';
import { websocketBaseUrl } from '@/lib/realtime';

type Options = {
  enabled?: boolean;
  token?: string | null;
  path: string;
  onMessage?: (payload: QueueRealtimePayload) => void;
};

export function useQueueWebsocket({ enabled = true, token, path, onMessage }: Options) {
  const socketRef = useRef<WebSocket | null>(null);
  const retryRef = useRef(0);
  const timeoutRef = useRef<number | null>(null);
  const onMessageRef = useRef(onMessage);
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');

  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    function handleOffline() {
      setStatus('offline');
      socketRef.current?.close();
    }

    function handleOnline() {
      if (enabled) {
        connect();
      }
    }

    function cleanupTimer() {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    }

    function scheduleReconnect() {
      cleanupTimer();
      retryRef.current += 1;
      const delay = Math.min(1000 * 2 ** retryRef.current, 15000);
      setStatus(navigator.onLine ? 'reconnecting' : 'offline');
      timeoutRef.current = window.setTimeout(() => {
        connect();
      }, delay);
    }

    function connect() {
      if (!enabled || !navigator.onLine) {
        setStatus(navigator.onLine ? 'disconnected' : 'offline');
        return;
      }

      cleanupTimer();
      socketRef.current?.close();
      setStatus(retryRef.current > 0 ? 'reconnecting' : 'connecting');

      const url = new URL(`${websocketBaseUrl()}${path}`);
      if (token) {
        url.searchParams.set('token', token);
      }

      const socket = new WebSocket(url.toString());
      socketRef.current = socket;

      socket.onopen = () => {
        retryRef.current = 0;
        setStatus('connected');
      };

      socket.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data) as QueueRealtimePayload;
          if (payload.event !== 'connection.ready') {
            onMessageRef.current?.(payload);
          }
        } catch {
          return;
        }
      };

      socket.onclose = () => {
        if (enabled) {
          scheduleReconnect();
        } else {
          setStatus('disconnected');
        }
      };

      socket.onerror = () => {
        socket.close();
      };
    }

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    connect();

    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
      cleanupTimer();
      socketRef.current?.close();
      socketRef.current = null;
    };
  }, [enabled, path, token]);

  return { status };
}

