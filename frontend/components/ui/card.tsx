import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('glass rounded-3xl border border-white/10 p-6 shadow-2xl shadow-black/20', className)}>{children}</div>;
}

