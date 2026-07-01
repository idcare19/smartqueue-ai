import { Card } from '@/components/ui/card';
import { FiltersBar } from '@/components/site/filters-bar';
import { DashboardTable } from '@/components/site/dashboard-table';
import { EmptyState } from '@/components/site/empty-state';
import { staffRows } from '@/lib/mock-data';
import type { TableColumn } from '@/lib/types';

const staffColumns: Array<TableColumn<Record<string, string>>> = [
  { key: 'name', label: 'Staff' },
  { key: 'role', label: 'Role' },
  { key: 'branch', label: 'Branch assignment' },
  { key: 'permission', label: 'Permissions' },
  { key: 'status', label: 'Status' }
];

export default function StaffManagementPage() {
  return (
    <div className="space-y-6 px-4 py-6 md:px-6">
      <FiltersBar placeholder="Search staff..." />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          ['Staff members', '32'],
          ['Active', '27'],
          ['Invited', '3'],
          ['Suspended', '2']
        ].map(([label, value]) => (
          <Card key={label}>
            <p className="text-sm text-slate-400">{label}</p>
            <p className="mt-3 text-3xl font-semibold text-white">{value}</p>
          </Card>
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <DashboardTable title="Staff" columns={staffColumns} rows={staffRows as unknown as Array<Record<string, string>>} />
        <Card>
          <h2 className="text-xl font-semibold text-white">Invite staff</h2>
          <p className="mt-2 text-sm text-slate-300">Invite flow with role selection, branch assignment, and permissions preview.</p>
          <div className="mt-6 space-y-3 rounded-3xl bg-white/5 p-4">
            <div className="rounded-2xl bg-slate-950/60 px-4 py-3 text-sm text-slate-300">Name and email</div>
            <div className="rounded-2xl bg-slate-950/60 px-4 py-3 text-sm text-slate-300">Role badge selector</div>
            <div className="rounded-2xl bg-slate-950/60 px-4 py-3 text-sm text-slate-300">Branch assignment</div>
            <div className="rounded-2xl bg-slate-950/60 px-4 py-3 text-sm text-slate-300">Permissions preview</div>
          </div>
        </Card>
      </div>
      <EmptyState title="No staff search results" description="Invite new people or refine the current filters to review branch assignments and permissions." actionLabel="Invite staff" />
    </div>
  );
}
