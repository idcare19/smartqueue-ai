import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function ManagementLoading({ title }: { title: string }) {
  return (
    <div className="space-y-6 px-4 py-6 md:px-6">
      <div className="flex flex-col gap-3">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-8 w-72" />
      </div>
      <Skeleton className="h-12 w-full" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index}>
            <Skeleton className="h-4 w-24" />
            <Skeleton className="mt-4 h-10 w-20" />
          </Card>
        ))}
      </div>
      <Card>
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-44" />
          <Skeleton className="h-8 w-32" />
        </div>
        <div className="mt-6 space-y-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-14 w-full" />
          ))}
        </div>
      </Card>
      <p className="text-sm text-slate-400">{title} loading state</p>
    </div>
  );
}

