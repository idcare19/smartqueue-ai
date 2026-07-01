import { API_BASE_URL } from '@/lib/auth';
import type { AnalyticsSummary, QueueApiToken } from '@/lib/types';

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  token?: string | null;
};

async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method ?? 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {})
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
    cache: 'no-store'
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.detail ?? payload.message ?? 'Unable to complete request.');
  }

  return response.json() as Promise<T>;
}

export const queueApi = {
  getBranches: (token: string | null) => apiRequest<Array<Record<string, string | number | null>>>('/api/branches/', { token }),
  getServices: (token: string | null) => apiRequest<Array<Record<string, string | number | null>>>('/api/services/', { token }),
  getCounters: (token: string | null) => apiRequest<Array<Record<string, string | number | null>>>('/api/counters/', { token }),
  getStaffQueue: (token: string | null, branch?: string) =>
    apiRequest<QueueApiToken[]>(`/api/queue-tokens/staff-dashboard/${branch ? `?branch=${branch}` : ''}`, { token }),
  callNext: (token: string | null, payload: { branch?: number; counter?: number | null; note?: string }) =>
    apiRequest<QueueApiToken>('/api/queue-tokens/call-next/', { method: 'POST', body: payload, token }),
  recallToken: (token: string | null, id: number) =>
    apiRequest<QueueApiToken>(`/api/queue-tokens/${id}/recall/`, { method: 'POST', token }),
  skipToken: (token: string | null, id: number) =>
    apiRequest<QueueApiToken>(`/api/queue-tokens/${id}/skip/`, { method: 'POST', token }),
  completeToken: (token: string | null, id: number) =>
    apiRequest<QueueApiToken>(`/api/queue-tokens/${id}/complete/`, { method: 'POST', token }),
  markServing: (token: string | null, id: number) =>
    apiRequest<QueueApiToken>(`/api/queue-tokens/${id}/serving/`, { method: 'POST', token }),
  customerStatus: (tokenNumber: string, mobileNumber: string) =>
    apiRequest<QueueApiToken & { people_ahead: number; estimated_wait_minutes: number }>(
      `/api/queue-tokens/customer-status/?token=${encodeURIComponent(tokenNumber)}&mobile=${encodeURIComponent(mobileNumber)}`
    ),
  publicStatus: (branch?: string) =>
    apiRequest<QueueApiToken[]>(`/api/queue-tokens/public-status/${branch ? `?branch=${branch}` : ''}`),
  analyticsSummary: (token: string | null, branch?: string) =>
    apiRequest<AnalyticsSummary>(`/api/analytics/summary/${branch ? `?branch=${branch}` : ''}`, { token })
};
