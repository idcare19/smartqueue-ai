'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthCard } from '@/components/auth/auth-card';
import { AuthShell } from '@/components/auth/auth-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuthStore } from '@/store/auth-store';

export default function RegisterPage() {
  const router = useRouter();
  const register = useAuthStore((state) => state.register);
  const isSubmitting = useAuthStore((state) => state.isSubmitting);
  const error = useAuthStore((state) => state.error);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [form, setForm] = useState({
    full_name: '',
    organization_name: '',
    email: '',
    phone_number: '',
    password: ''
  });

  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/dashboard');
    }
  }, [isAuthenticated, router]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      await register({
        ...form,
        role: 'organization_admin'
      });
    } catch {}
  }

  return (
    <AuthShell title="Create your organization" subtitle="Launch your queue operations with a premium setup.">
      <AuthCard>
        <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
          <Input aria-label="Full name" placeholder="Full name" value={form.full_name} onChange={(event) => setForm((current) => ({ ...current, full_name: event.target.value }))} />
          <Input aria-label="Organization name" placeholder="Organization name" value={form.organization_name} onChange={(event) => setForm((current) => ({ ...current, organization_name: event.target.value }))} />
          <Input aria-label="Email" placeholder="Email" type="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} />
          <Input aria-label="Phone" placeholder="Phone" value={form.phone_number} onChange={(event) => setForm((current) => ({ ...current, phone_number: event.target.value }))} />
          <Input aria-label="Password" placeholder="Password" type="password" className="md:col-span-2" value={form.password} onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))} />
          {error ? <p className="text-sm text-rose-300 md:col-span-2">{error}</p> : null}
          <Button className="md:col-span-2" disabled={isSubmitting}>
            {isSubmitting ? 'Creating account...' : 'Create account'}
          </Button>
        </form>
      </AuthCard>
    </AuthShell>
  );
}
