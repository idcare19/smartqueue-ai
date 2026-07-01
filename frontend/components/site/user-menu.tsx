'use client';

import { ChevronDown, LogOut, UserCircle2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ROLE_LABELS } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/auth-store';

export function UserMenu() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const isSubmitting = useAuthStore((state) => state.isSubmitting);

  async function handleLogout() {
    await logout();
    router.replace('/login');
  }

  return (
    <div className="relative">
      <Button variant="secondary" onClick={() => setOpen((value) => !value)}>
        <UserCircle2 className="mr-2 h-4 w-4" />
        {user?.first_name || user?.email?.split('@')[0] || 'Account'}
        <ChevronDown className="ml-2 h-4 w-4" />
      </Button>
      {open ? (
        <div className="absolute right-0 mt-3 w-56 rounded-3xl border border-white/10 bg-slate-950 p-3 shadow-2xl shadow-black/40">
          <div className="rounded-2xl bg-white/5 px-3 py-3">
            <p className="text-sm font-medium text-white">{user?.email ?? 'Authenticated user'}</p>
            <p className="mt-1 text-xs text-slate-400">{user ? ROLE_LABELS[user.role] : 'Account'}</p>
          </div>
          <button className="mt-2 flex w-full items-center gap-3 rounded-2xl px-3 py-2 text-left text-sm text-slate-200 hover:bg-white/5">
            <UserCircle2 className="h-4 w-4" /> Profile
          </button>
          <button
            className="flex w-full items-center gap-3 rounded-2xl px-3 py-2 text-left text-sm text-slate-200 hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-60"
            onClick={handleLogout}
            disabled={isSubmitting}
          >
            <LogOut className="h-4 w-4" /> {isSubmitting ? 'Signing out...' : 'Sign out'}
          </button>
        </div>
      ) : null}
    </div>
  );
}
