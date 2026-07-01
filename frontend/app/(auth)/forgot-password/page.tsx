'use client';

import { useState } from 'react';
import { AuthCard } from '@/components/auth/auth-card';
import { AuthShell } from '@/components/auth/auth-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { authApi } from '@/lib/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    try {
      const response = await authApi.forgotPassword({ email });
      setMessage(response.detail);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to send reset link.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell title="Reset access" subtitle="We’ll send a secure reset link to your email.">
      <AuthCard>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <Input aria-label="Email address" placeholder="Email address" type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
          {error ? <p className="text-sm text-rose-300">{error}</p> : null}
          {message ? <p className="text-sm text-emerald-300">{message}</p> : null}
          <Button className="w-full" disabled={loading}>
            {loading ? 'Sending...' : 'Send reset link'}
          </Button>
        </form>
      </AuthCard>
    </AuthShell>
  );
}
