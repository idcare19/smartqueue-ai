'use client';

import Link from 'next/link';
import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AuthCard } from '@/components/auth/auth-card';
import { AuthShell } from '@/components/auth/auth-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuthStore } from '@/store/auth-store';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const login = useAuthStore((state) => state.login);
  const isSubmitting = useAuthStore((state) => state.isSubmitting);
  const error = useAuthStore((state) => state.error);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (isAuthenticated) {
      router.replace(searchParams.get('next') ?? '/dashboard');
    }
  }, [isAuthenticated, router, searchParams]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      await login({ email, password });
    } catch {}
  }

  return (
    <AuthCard>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <Input aria-label="Email" placeholder="Email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
        <Input aria-label="Password" placeholder="Password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
        <div className="flex items-center justify-between text-sm text-slate-400">
          <label className="flex items-center gap-2"><input type="checkbox" /> Remember me</label>
          <Link href="/forgot-password" className="text-emerald-300">Forgot password?</Link>
        </div>
        {error ? <p className="text-sm text-rose-300">{error}</p> : null}
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? 'Signing in...' : 'Sign in'}
        </Button>
      </form>
    </AuthCard>
  );
}

export default function LoginPage() {
  return (
    <AuthShell title="Welcome back" subtitle="Sign in to manage queues, staff, and branches.">
      <Suspense fallback={<AuthCard><div className="space-y-4"><div className="h-12 rounded-2xl bg-white/5" /><div className="h-12 rounded-2xl bg-white/5" /></div></AuthCard>}>
        <LoginForm />
      </Suspense>
    </AuthShell>
  );
}
