import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function SessionLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="mt-4 h-4 w-56" />
        <div className="mt-6 space-y-3">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </Card>
    </div>
  );
}

