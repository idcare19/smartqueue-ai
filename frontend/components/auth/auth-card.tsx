import type { ReactNode } from 'react';
import { Card } from '@/components/ui/card';
import { authCards } from '@/lib/site';

export function AuthCard({ children }: { children: ReactNode }) {
  return (
    <div className="space-y-6">
      <Card>{children}</Card>
      <div className="grid gap-4 md:grid-cols-3">
        {authCards.map((item) => {
          const Icon = item.icon;
          return (
            <Card key={item.title} className="p-5">
              <Icon className="h-6 w-6 text-emerald-300" />
              <p className="mt-4 font-medium text-white">{item.title}</p>
              <p className="mt-2 text-sm text-slate-300">{item.text}</p>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

