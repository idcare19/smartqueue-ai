import { Card } from '@/components/ui/card';

export function MetricCard({ label, value, trend }: { label: string; value: string; trend: string }) {
  return (
    <Card>
      <p className="text-sm text-slate-400">{label}</p>
      <div className="mt-4 flex items-end justify-between">
        <p className="text-3xl font-semibold text-white">{value}</p>
        <span className="rounded-full bg-emerald-400/10 px-3 py-1 text-sm text-emerald-300">{trend}</span>
      </div>
    </Card>
  );
}

