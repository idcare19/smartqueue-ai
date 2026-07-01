'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authApi } from '@/lib/api';
import type { AuthResponse, AuthUser, LoginPayload, RegisterPayload } from '@/lib/auth';

type AuthState = {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isBootstrapping: boolean;
  isSubmitting: boolean;
  error: string | null;
  setSession: (payload: AuthResponse) => void;
  clearSession: () => void;
  bootstrap: () => Promise<void>;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isBootstrapping: true,
      isSubmitting: false,
      error: null,
      setSession: (payload) =>
        set({
          user: payload.user,
          accessToken: payload.access,
          refreshToken: payload.refresh,
          isAuthenticated: true,
          error: null
        }),
      clearSession: () =>
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
          error: null
        }),
      bootstrap: async () => {
        const { refreshToken, accessToken, clearSession } = get();

        if (!refreshToken) {
          set({ isBootstrapping: false, isAuthenticated: false });
          return;
        }

        try {
          let nextAccess = accessToken;
          try {
            if (!nextAccess) {
              throw new Error('Refresh access token');
            }

            const user = await authApi.me(nextAccess);
            set({
              user,
              accessToken: nextAccess,
              isAuthenticated: true,
              isBootstrapping: false,
              error: null
            });
            return;
          } catch {
            const refreshed = await authApi.refresh(refreshToken);
            nextAccess = refreshed.access;
            set({ accessToken: refreshed.access, refreshToken: refreshed.refresh ?? refreshToken });
          }

          const user = await authApi.me(nextAccess);
          set({
            user,
            accessToken: nextAccess,
            isAuthenticated: true,
            isBootstrapping: false,
            error: null
          });
        } catch (error) {
          clearSession();
          set({
            isBootstrapping: false,
            error: error instanceof Error ? error.message : 'Session expired.'
          });
        }
      },
      login: async (payload) => {
        set({ isSubmitting: true, error: null });
        try {
          const response = await authApi.login(payload);
          get().setSession(response);
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Unable to sign in.' });
          throw error;
        } finally {
          set({ isSubmitting: false, isBootstrapping: false });
        }
      },
      register: async (payload) => {
        set({ isSubmitting: true, error: null });
        try {
          const response = await authApi.register(payload);
          if (response.access && response.refresh) {
            get().setSession(response as AuthResponse);
          } else {
            set({
              user: response.user,
              isAuthenticated: false,
              accessToken: null,
              refreshToken: null,
              error: 'Verification email sent. Please verify your account to continue.'
            });
          }
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Unable to register.' });
          throw error;
        } finally {
          set({ isSubmitting: false, isBootstrapping: false });
        }
      },
      logout: async () => {
        const { refreshToken, accessToken, clearSession } = get();
        try {
          if (refreshToken && accessToken) {
            await authApi.logout(refreshToken, accessToken);
          }
        } finally {
          clearSession();
          set({ isBootstrapping: false });
        }
      }
    }),
    {
      name: 'smartqueue-auth',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
);
