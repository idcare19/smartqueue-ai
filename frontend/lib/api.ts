import { API_BASE_URL, type AuthResponse, type AuthTokens, type AuthUser, type ForgotPasswordPayload, type LoginPayload, type RegisterPayload, type RegisterResponse, type ResetPasswordPayload, type VerifyEmailPayload } from '@/lib/auth';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {})
    },
    cache: 'no-store'
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.detail ?? payload.message ?? 'Request failed.');
  }

  if (response.status === 204 || response.status === 205) {
    return {} as T;
  }

  return response.json() as Promise<T>;
}

export const authApi = {
  login: (payload: LoginPayload) =>
    request<AuthResponse>('/api/auth/login/', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
  register: (payload: RegisterPayload) =>
    request<RegisterResponse>('/api/auth/register/', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
  refresh: (refresh: string) =>
    request<AuthTokens>('/api/auth/refresh/', {
      method: 'POST',
      body: JSON.stringify({ refresh })
    }),
  logout: (refresh: string, access: string) =>
    request<void>('/api/auth/logout/', {
      method: 'POST',
      body: JSON.stringify({ refresh }),
      headers: {
        Authorization: `Bearer ${access}`
      }
    }),
  me: (access: string) =>
    request<AuthUser>('/api/auth/me/', {
      headers: {
        Authorization: `Bearer ${access}`
      }
    }),
  forgotPassword: (payload: ForgotPasswordPayload) =>
    request<{ detail: string }>('/api/auth/forgot-password/', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
  resetPassword: (payload: ResetPasswordPayload) =>
    request<{ detail: string }>('/api/auth/reset-password/', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
  verifyEmail: (payload: VerifyEmailPayload) =>
    request<{ detail: string }>('/api/auth/verify-email/', {
      method: 'POST',
      body: JSON.stringify(payload)
    })
};
