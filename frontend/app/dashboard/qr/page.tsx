import { Card } from '@/components/ui/card';
import { FiltersBar } from '@/components/site/filters-bar';
import { EmptyState } from '@/components/site/empty-state';
import { qrRows } from '@/lib/mock-data';

export default function QrCodeManagementPage() {
  return (
    <div className="space-y-6 px-4 py-6 md:px-6">
      <FiltersBar placeholder="Search QR codes..." />
      <div className="grid gap-6 xl:grid-cols-3">
        {qrRows.map((qr) => (
          <Card key={qr.label}>
            <p className="text-sm text-slate-400">{qr.type}</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">{qr.label}</h2>
            <p className="mt-2 text-sm text-slate-300">{qr.branch}</p>
            <div className="mt-6 rounded-3xl bg-white p-6 text-slate-950">
              <div className="grid grid-cols-6 gap-1">
                {Array.from({ length: 36 }).map((_, index) => (
                  <div key={index} className={`h-3 w-3 rounded-sm ${index % 3 === 0 ? 'bg-slate-950' : 'bg-slate-300'}`} />
                ))}
              </div>
            </div>
            <div className="mt-6 flex gap-2">
              <div className="rounded-full bg-white/5 px-4 py-2 text-sm text-slate-200">Download</div>
              <div className="rounded-full bg-white/5 px-4 py-2 text-sm text-slate-200">Print</div>
            </div>
            <p className="mt-4 text-xs text-slate-400">{qr.destination}</p>
          </Card>
        ))}
      </div>
      <Card>
        <h2 className="text-xl font-semibold text-white">Print-ready layout</h2>
        <p className="mt-3 text-sm text-slate-300">Each QR asset is ready for signage, counter posters, and branch-level printing workflows.</p>
      </Card>
      <EmptyState title="No QR filters active" description="Search by branch, service, or counter to narrow down the QR list." actionLabel="Generate QR" />
    </div>
  );
}
