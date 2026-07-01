import type { ReactNode } from 'react';
import { Section } from '@/components/site/section';

export function AuthShell({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <main className="min-h-screen text-slate-50">
      <Section className="grid min-h-screen items-center py-10 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="max-w-xl">
          <p className="mb-4 text-sm uppercase tracking-[0.4em] text-emerald-300">SmartQueue AI</p>
          <h1 className="text-5xl font-semibold tracking-tight text-white md:text-6xl">{title}</h1>
          {subtitle ? <p className="mt-5 max-w-lg text-lg leading-8 text-slate-300">{subtitle}</p> : null}
        </div>
        <div>{children}</div>
      </Section>
    </main>
  );
}

