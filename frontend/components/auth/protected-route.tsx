'use client';

import { useEffect, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { SessionLoading } from '@/components/auth/session-loading';
import { isRouteAllowed } from '@/lib/auth';
import { useAuthStore } from '@/store/auth-store';

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isBootstrapping = useAuthStore((state) => state.isBootstrapping);
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    if (isBootstrapping) return;

    if (!isAuthenticated) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
      return;
    }

    if (!isRouteAllowed(pathname, user?.role)) {
      router.replace('/dashboard');
    }
  }, [isAuthenticated, isBootstrapping, pathname, router, user?.role]);

  if (isBootstrapping) {
    return <SessionLoading />;
  }

  if (!isAuthenticated || !isRouteAllowed(pathname, user?.role)) {
    return <SessionLoading />;
  }

  return <>{children}</>;
}
