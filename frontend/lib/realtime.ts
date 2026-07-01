import { API_BASE_URL } from '@/lib/auth';

export type QueueRealtimePayload = {
  event: string;
  token?: {
    id: number;
    organization: number;
    branch: number;
    branch_name: string;
    service: number;
    service_name: string;
    counter: number | null;
    counter_name: string;
    customer_name: string;
    mobile_number: string;
    token_number: string;
    sequence_number: number;
    status: string;
    note: string;
    queue_date: string;
    estimated_wait_minutes: number;
    confidence: string;
  };
  notification?: {
    id: number;
    channel: string;
    event_type: string;
    status: string;
    title: string;
    message: string;
    destination: string;
    provider: string;
    queue_token: string;
    read_at: string | null;
    created_at: string;
  };
};

export type ConnectionStatus = 'connecting' | 'connected' | 'reconnecting' | 'offline' | 'disconnected';

export function websocketBaseUrl() {
  const explicit = process.env.NEXT_PUBLIC_WS_BASE_URL;
  if (explicit) {
    return explicit.replace(/\/$/, '');
  }

  const httpUrl = new URL(API_BASE_URL);
  httpUrl.protocol = httpUrl.protocol === 'https:' ? 'wss:' : 'ws:';
  return httpUrl.toString().replace(/\/$/, '');
}
