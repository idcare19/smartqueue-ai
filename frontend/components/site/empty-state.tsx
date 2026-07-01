import { Button } from '@/components/ui/button';

export function EmptyState({ title, description, actionLabel }: { title: string; description: string; actionLabel?: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-white/10 bg-white/5 p-10 text-center">
      <p className="text-xl font-semibold text-white">{title}</p>
      <p className="mt-3 max-w-md text-sm text-slate-300">{description}</p>
      {actionLabel ? <Button className="mt-6">{actionLabel}</Button> : null}
    </div>
  );
}

