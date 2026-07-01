'use client';

import { Suspense, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AuthCard } from '@/components/auth/auth-card';
import { AuthShell } from '@/components/auth/auth-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { authApi } from '@/lib/api';

function ResetPasswordForm() {
  const params = useSearchParams();
  const router = useRouter();
  const uid = useMemo(() => params.get('uid') ?? '', [params]);
  const token = useMemo(() => params.get('token') ?? '', [params]);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    try {
      const response = await authApi.resetPassword({ uid, token, password, confirm_password: confirmPassword });
      setMessage(response.detail);
      router.replace('/login');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update password.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthCard>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <Input aria-label="New password" placeholder="New password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
        <Input aria-label="Confirm password" placeholder="Confirm password" type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} />
        {error ? <p className="text-sm text-rose-300">{error}</p> : null}
        {message ? <p className="text-sm text-emerald-300">{message}</p> : null}
        <Button className="w-full" disabled={loading || !uid || !token}>
          {loading ? 'Updating...' : 'Update password'}
        </Button>
      </form>
    </AuthCard>
  );
}

export default function ResetPasswordPage() {
  return (
    <AuthShell title="Choose a new password" subtitle="Use a strong password to secure your account.">
      <Suspense fallback={<AuthCard><div className="h-24 rounded-2xl bg-white/5" /></AuthCard>}>
        <ResetPasswordForm />
      </Suspense>
    </AuthShell>
  );
}
