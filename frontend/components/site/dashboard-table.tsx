import { Card } from '@/components/ui/card';
import type { TableColumn } from '@/lib/types';

export function DashboardTable({ 
  title, 
  columns, 
  rows, 
  actions 
}: { 
  title: string; 
  columns: Array<TableColumn<Record<string, string>>>; 
  rows: Array<Record<string, string>>;
  actions?: Array<{
    label: string;
    onClick: (row: Record<string, string>) => void;
    variant?: 'default' | 'destructive';
  }>;
}) {
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
              {actions && actions.length > 0 && <th className="px-6 py-4 font-medium">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={`${row.token ?? row.branch ?? index}`} data-testid={row.id ? `row-${row.id}` : undefined} className="border-t border-white/5">
                {columns.map((column) => (
                  <td key={String(column.key)} className="px-6 py-4 text-slate-200">{row[String(column.key)]}</td>
                ))}
                {actions && actions.length > 0 && (
                  <td className="px-6 py-4">
                    <div className="flex gap-2 flex-wrap">
                      {actions.map((action, actionIndex) => (
                        <button
                          key={actionIndex}
                          data-testid={row.id ? `row-${row.id}-action-${action.label.toLowerCase()}` : undefined}
                          onClick={() => action.onClick(row)}
                          className={`px-3 py-1 text-xs rounded-md transition-colors ${
                            action.variant === 'destructive'
                              ? 'bg-red-600/20 text-red-400 hover:bg-red-600/30'
                              : 'bg-white/10 text-slate-200 hover:bg-white/20'
                          }`}
                        >
                          {action.label}
                        </button>
                      ))}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
