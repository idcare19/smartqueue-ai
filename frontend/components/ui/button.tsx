import Link from 'next/link';
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

type Props = {
  children: ReactNode;
  className?: string;
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline';
} & ButtonHTMLAttributes<HTMLButtonElement> &
  AnchorHTMLAttributes<HTMLAnchorElement>;

export function Button({ children, className, variant = 'primary', href, ...props }: Props & { href?: string }) {
  const classes = cn(
    'inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-medium transition will-change-transform',
    variant === 'primary' && 'bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/20 hover:-translate-y-0.5',
    variant === 'secondary' && 'bg-white/8 text-white border border-white/10 hover:bg-white/12',
    variant === 'outline' && 'border border-white/12 bg-transparent text-white hover:bg-white/5',
    variant === 'ghost' && 'text-slate-200 hover:bg-white/5',
    className
  );

  if (href) {
    return (
      <Link className={classes} href={href}>
        {children}
      </Link>
    );
  }

  return (
    <button className={classes} {...(props as ButtonHTMLAttributes<HTMLButtonElement>)}>
      {children}
    </button>
  );
}

