import { API_BASE_URL } from '@/lib/auth';
import type {
  NotificationItem,
  NotificationLogItem,
  NotificationStats,
  NotificationTemplateItem,
  PaginatedResponse
} from '@/lib/types';

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  token?: string | null;
};

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
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
    throw new Error(payload.detail ?? payload.message ?? 'Unable to complete notification request.');
  }

  if (response.status === 204 || response.status === 205) {
    return {} as T;
  }

  return response.json() as Promise<T>;
}

export const notificationsApi = {
  list: (token: string | null, query = '') =>
    request<PaginatedResponse<NotificationItem>>(`/api/notifications/${query ? `?${query}` : ''}`, { token }),
  markRead: (token: string | null, id: number) =>
    request<NotificationItem>(`/api/notifications/${id}/read/`, { method: 'POST', token }),
  markAllRead: (token: string | null) =>
    request<{ updated: number }>('/api/notifications/mark-all-read/', { method: 'POST', token }),
  retry: (token: string | null, id: number) =>
    request<NotificationItem>(`/api/notifications/${id}/retry/`, { method: 'POST', token }),
  customerHistory: (tokenNumber: string, mobile: string, page = 1) =>
    request<PaginatedResponse<NotificationItem>>(
      `/api/notifications/customer-history/?token=${encodeURIComponent(tokenNumber)}&mobile=${encodeURIComponent(mobile)}&page=${page}`
    ),
  templates: (token: string | null) =>
    request<PaginatedResponse<NotificationTemplateItem>>('/api/notification-templates/', { token }),
  createTemplate: (token: string | null, payload: Partial<NotificationTemplateItem>) =>
    request<NotificationTemplateItem>('/api/notification-templates/', { method: 'POST', token, body: payload }),
  updateTemplate: (token: string | null, id: number, payload: Partial<NotificationTemplateItem>) =>
    request<NotificationTemplateItem>(`/api/notification-templates/${id}/`, { method: 'PATCH', token, body: payload }),
  logs: (token: string | null, query = 'status=failed') =>
    request<PaginatedResponse<NotificationLogItem>>(`/api/notification-logs/${query ? `?${query}` : ''}`, { token }),
  stats: (token: string | null) => request<NotificationStats>('/api/notification-stats/', { token }),
  providers: (token: string | null) => request<NotificationStats['providers']>('/api/notification-providers/', { token })
};
