'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AuthCard } from '@/components/auth/auth-card';
import { AuthShell } from '@/components/auth/auth-shell';
import { Button } from '@/components/ui/button';
import { authApi } from '@/lib/api';

function VerifyEmailContent() {
  const params = useSearchParams();
  const router = useRouter();
  const uid = useMemo(() => params.get('uid') ?? '', [params]);
  const token = useMemo(() => params.get('token') ?? '', [params]);
  const [message, setMessage] = useState('Verifying your account...');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!uid || !token) {
      setError('Verification link is incomplete.');
      setMessage('');
      return;
    }

    authApi.verifyEmail({ uid, token })
      .then((response) => {
        setMessage(response.detail);
        router.replace('/login');
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Unable to verify email.'));
  }, [router, token, uid]);

  return (
    <AuthCard>
      <div className="space-y-4">
        {message ? <p className="text-sm text-emerald-300">{message}</p> : null}
        {error ? <p className="text-sm text-rose-300">{error}</p> : null}
        <Button type="button" className="w-full" onClick={() => router.push('/login')}>
          Go to sign in
        </Button>
      </div>
    </AuthCard>
  );
}

export default function VerifyEmailPage() {
  return (
    <AuthShell title="Verify email" subtitle="Confirm your account to continue.">
      <Suspense fallback={<AuthCard><div className="h-24 rounded-2xl bg-white/5" /></AuthCard>}>
        <VerifyEmailContent />
      </Suspense>
    </AuthShell>
  );
}
