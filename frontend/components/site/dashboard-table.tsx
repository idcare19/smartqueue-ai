import { Card } from '@/components/ui/card';
import type { TableColumn } from '@/lib/types';

export function DashboardTable({ title, columns, rows }: { title: string; columns: Array<TableColumn<Record<string, string>>>; rows: Array<Record<string, string>> }) {
  return (
    <Card className="overflow-hidden p-0">
      <div className="border-b border-white/10 p-6">
        <h2 className="text-xl font-semibold text-white">{title}</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-white/5 text-slate-400">
            <tr>
              {columns.map((column) => (
                <th key={String(column.key)} className="px-6 py-4 font-medium">{column.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={`${row.token ?? row.branch ?? index}`} className="border-t border-white/5">
                {columns.map((column) => (
                  <td key={String(column.key)} className="px-6 py-4 text-slate-200">{row[String(column.key)]}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
