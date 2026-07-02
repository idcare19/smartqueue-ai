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

  if (response.status === 204) {
    return undefined as T;
  }

  const text = await response.text();
  if (!text.trim()) {
    return undefined as T;
  }

  return JSON.parse(text) as T;
}

export const queueApi = {
  getOrganizations: (token: string | null) => apiRequest<Array<Record<string, string | number | null>>>('/api/organizations/', { token }),
  createOrganization: (token: string | null, data: Record<string, unknown>) => apiRequest<Record<string, string | number | null>>('/api/organizations/', { method: 'POST', body: data, token }),
  updateOrganization: (token: string | null, id: number, data: Record<string, unknown>) => apiRequest<Record<string, string | number | null>>(`/api/organizations/${id}/`, { method: 'PATCH', body: data, token }),
  deleteOrganization: (token: string | null, id: number) => apiRequest<void>(`/api/organizations/${id}/`, { method: 'DELETE', token }),
  restoreOrganization: (token: string | null, id: number) => apiRequest<Record<string, string | number | null>>(`/api/organizations/${id}/restore/`, { method: 'POST', token }),
  getBranches: (token: string | null) => apiRequest<Array<Record<string, string | number | null>>>('/api/branches/', { token }),
  createBranch: (token: string | null, data: Record<string, unknown>) => apiRequest<Record<string, string | number | null>>('/api/branches/', { method: 'POST', body: data, token }),
  updateBranch: (token: string | null, id: number, data: Record<string, unknown>) => apiRequest<Record<string, string | number | null>>(`/api/branches/${id}/`, { method: 'PATCH', body: data, token }),
  deleteBranch: (token: string | null, id: number) => apiRequest<void>(`/api/branches/${id}/`, { method: 'DELETE', token }),
  restoreBranch: (token: string | null, id: number) => apiRequest<Record<string, string | number | null>>(`/api/branches/${id}/restore/`, { method: 'POST', token }),
  getServices: (token: string | null) => apiRequest<Array<Record<string, string | number | null>>>('/api/services/', { token }),
  createService: (token: string | null, data: Record<string, unknown>) => apiRequest<Record<string, string | number | null>>('/api/services/', { method: 'POST', body: data, token }),
  updateService: (token: string | null, id: number, data: Record<string, unknown>) => apiRequest<Record<string, string | number | null>>(`/api/services/${id}/`, { method: 'PATCH', body: data, token }),
  deleteService: (token: string | null, id: number) => apiRequest<void>(`/api/services/${id}/`, { method: 'DELETE', token }),
  restoreService: (token: string | null, id: number) => apiRequest<Record<string, string | number | null>>(`/api/services/${id}/restore/`, { method: 'POST', token }),
  getCounters: (token: string | null) => apiRequest<Array<Record<string, string | number | null>>>('/api/counters/', { token }),
  createCounter: (token: string | null, data: Record<string, unknown>) => apiRequest<Record<string, string | number | null>>('/api/counters/', { method: 'POST', body: data, token }),
  updateCounter: (token: string | null, id: number, data: Record<string, unknown>) => apiRequest<Record<string, string | number | null>>(`/api/counters/${id}/`, { method: 'PATCH', body: data, token }),
  deleteCounter: (token: string | null, id: number) => apiRequest<void>(`/api/counters/${id}/`, { method: 'DELETE', token }),
  restoreCounter: (token: string | null, id: number) => apiRequest<Record<string, string | number | null>>(`/api/counters/${id}/restore/`, { method: 'POST', token }),
  getDepartments: (token: string | null) => apiRequest<Array<Record<string, string | number | null>>>('/api/departments/', { token }),
  createDepartment: (token: string | null, data: Record<string, unknown>) => apiRequest<Record<string, string | number | null>>('/api/departments/', { method: 'POST', body: data, token }),
  updateDepartment: (token: string | null, id: number, data: Record<string, unknown>) => apiRequest<Record<string, string | number | null>>(`/api/departments/${id}/`, { method: 'PATCH', body: data, token }),
  deleteDepartment: (token: string | null, id: number) => apiRequest<void>(`/api/departments/${id}/`, { method: 'DELETE', token }),
  restoreDepartment: (token: string | null, id: number) => apiRequest<Record<string, string | number | null>>(`/api/departments/${id}/restore/`, { method: 'POST', token }),
  getStaff: (token: string | null) => apiRequest<Array<Record<string, string | number | null>>>('/api/auth/staff/', { token }),
  updateStaff: (token: string | null, id: number, data: Record<string, unknown>) => apiRequest<Record<string, string | number | null>>(`/api/auth/staff/${id}/`, { method: 'PATCH', body: data, token }),
  archiveStaff: (token: string | null, id: number) => apiRequest<Record<string, string | number | null>>(`/api/auth/staff/${id}/archive/`, { method: 'POST', token }),
  suspendStaff: (token: string | null, id: number) => apiRequest<Record<string, string | number | null>>(`/api/auth/staff/${id}/suspend/`, { method: 'POST', token }),
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
  markNoShow: (token: string | null, id: number) =>
    apiRequest<QueueApiToken>(`/api/queue-tokens/${id}/no-show/`, { method: 'POST', token }),
  cancelToken: (token: string | null, id: number) =>
    apiRequest<QueueApiToken>(`/api/queue-tokens/${id}/cancel/`, { method: 'POST', token }),
  pauseToken: (token: string | null, id: number) =>
    apiRequest<QueueApiToken>(`/api/queue-tokens/${id}/pause/`, { method: 'POST', token }),
  resumeToken: (token: string | null, id: number) =>
    apiRequest<QueueApiToken>(`/api/queue-tokens/${id}/resume/`, { method: 'POST', token }),
  transferCounter: (token: string | null, id: number, counter: number) =>
    apiRequest<QueueApiToken>(`/api/queue-tokens/${id}/transfer-counter/`, { method: 'POST', body: { counter }, token }),
  transferService: (token: string | null, id: number, service: number) =>
    apiRequest<QueueApiToken>(`/api/queue-tokens/${id}/transfer-service/`, { method: 'POST', body: { service }, token }),
  openQueue: (token: string | null) => apiRequest<{ detail: string }>('/api/queue-tokens/open/', { method: 'POST', token }),
  closeQueue: (token: string | null) => apiRequest<{ detail: string }>('/api/queue-tokens/close/', { method: 'POST', token }),
  customerStatus: (tokenNumber: string, mobileNumber: string) =>
    apiRequest<QueueApiToken & { people_ahead: number; estimated_wait_minutes: number }>(
      `/api/queue-tokens/customer-status/?token=${encodeURIComponent(tokenNumber)}&mobile=${encodeURIComponent(mobileNumber)}`
    ),
  publicStatus: (branch?: string) =>
    apiRequest<QueueApiToken[]>(`/api/queue-tokens/public-status/${branch ? `?branch=${branch}` : ''}`),
  joinQueue: (data: { branch: number; service: number; customer_name: string; mobile_number: string; queue_type?: string; priority?: string }) =>
    apiRequest<QueueApiToken>('/api/queue-tokens/join/', { method: 'POST', body: data }),
  walkInQueue: (data: Record<string, unknown>) => apiRequest<QueueApiToken>('/api/queue-tokens/walk-in/', { method: 'POST', body: data }),
  appointmentQueue: (data: Record<string, unknown>) => apiRequest<QueueApiToken>('/api/queue-tokens/appointment/', { method: 'POST', body: data }),
  vipQueue: (data: Record<string, unknown>) => apiRequest<QueueApiToken>('/api/queue-tokens/vip/', { method: 'POST', body: data }),
  emergencyQueue: (data: Record<string, unknown>) => apiRequest<QueueApiToken>('/api/queue-tokens/emergency/', { method: 'POST', body: data }),
  analyticsSummary: (token: string | null, branch?: string) =>
    apiRequest<AnalyticsSummary>(`/api/analytics/summary/${branch ? `?branch=${branch}` : ''}`, { token })
};
