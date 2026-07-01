import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import { cn } from '@/lib/utils';

type SectionProps = {
  children: ReactNode;
  className?: string;
} & ComponentPropsWithoutRef<'section'>;

export function Section({ children, className, ...props }: SectionProps) {
  return (
    <section className={cn('mx-auto w-full max-w-7xl px-4 py-10 md:px-6 lg:px-8', className)} {...props}>
      {children}
    </section>
  );
}
