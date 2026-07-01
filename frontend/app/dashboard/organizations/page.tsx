import { Card } from '@/components/ui/card';
import { FiltersBar } from '@/components/site/filters-bar';
import { DashboardTable } from '@/components/site/dashboard-table';
import { EmptyState } from '@/components/site/empty-state';
import { branchRows } from '@/lib/mock-data';
import type { TableColumn } from '@/lib/types';

const branchColumns: Array<TableColumn<Record<string, string>>> = [
  { key: 'branch', label: 'Branch' },
  { key: 'counters', label: 'Counters' },
  { key: 'staff', label: 'Staff' },
  { key: 'queue', label: 'Queue' },
  { key: 'status', label: 'Status' }
] as const;

export default function OrganizationsDashboard() {
  return (
    <div className="space-y-6 px-4 py-6 md:px-6">
      <FiltersBar placeholder="Search organizations or branches..." />
      <div className="grid gap-6 lg:grid-cols-3">
        {['North Branch', 'Central Clinic', 'Downtown Service Hub'].map((org) => (
          <Card key={org}>
            <p className="text-sm text-slate-400">Organization</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">{org}</h2>
            <p className="mt-3 text-sm text-slate-300">Branches, services, staffing, and queue rules in one place.</p>
          </Card>
        ))}
      </div>
      <DashboardTable title="Branch registry" columns={branchColumns} rows={branchRows} />
      <EmptyState title="No organizations filtered" description="Create or search organizations to inspect the underlying branch structure." actionLabel="Add organization" />
    </div>
  );
}
