import { Card } from '@/components/ui/card';
import { DashboardTable } from '@/components/site/dashboard-table';
import { EmptyState } from '@/components/site/empty-state';
import { invoiceRows, subscriptionPlans } from '@/lib/mock-data';
import type { TableColumn } from '@/lib/types';

const invoiceColumns: Array<TableColumn<Record<string, string>>> = [
  { key: 'invoice', label: 'Invoice' },
  { key: 'date', label: 'Date' },
  { key: 'plan', label: 'Plan' },
  { key: 'amount', label: 'Amount' },
  { key: 'status', label: 'Status' }
];

export default function SubscriptionBillingPage() {
  return (
    <div className="space-y-6 px-4 py-6 md:px-6">
      <div className="grid gap-4 xl:grid-cols-4">
        {subscriptionPlans.map((plan) => (
          <Card key={plan.name} className={plan.highlighted ? 'border-emerald-400/40 bg-emerald-400/8' : ''}>
            <p className="text-sm text-slate-400">{plan.name}</p>
            <p className="mt-3 text-4xl font-semibold text-white">{plan.price}</p>
            <p className="mt-3 text-sm text-slate-300">{plan.description}</p>
            <div className="mt-6 space-y-2 text-sm text-slate-200">
              {plan.features.map((feature) => (
                <div key={feature} className="rounded-2xl bg-white/5 px-3 py-2">{feature}</div>
              ))}
            </div>
          </Card>
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-[0.7fr_1.3fr]">
        <Card>
          <h2 className="text-xl font-semibold text-white">Usage limits</h2>
          <div className="mt-6 space-y-4 text-sm">
            {[
              ['Branches used', '3 / 10'],
              ['Tokens this month', '4,280 / 10,000'],
              ['SMS usage', '720 / 1,500']
            ].map(([label, value]) => (
              <div key={label}>
                <div className="mb-2 flex justify-between text-slate-300">
                  <span>{label}</span>
                  <span>{value}</span>
                </div>
                <div className="h-3 rounded-full bg-white/5">
                  <div className="h-3 rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400" style={{ width: '60%' }} />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 rounded-3xl bg-white/5 p-5">
            <p className="text-sm text-slate-400">Upgrade CTA</p>
            <p className="mt-2 text-lg font-semibold text-white">Go to Professional to unlock more branches and notifications.</p>
          </div>
        </Card>
      <DashboardTable title="Invoices" columns={invoiceColumns} rows={invoiceRows as unknown as Array<Record<string, string>>} />
      </div>
      <Card>
        <h2 className="text-xl font-semibold text-white">Stripe / Razorpay ready billing UI</h2>
        <p className="mt-3 text-sm text-slate-300">The layout is structured for payment method selection, billing address, and invoice actions.</p>
      </Card>
      <EmptyState title="No unpaid invoices" description="Billing data is clean. When charges are added, this section will surface outstanding items." actionLabel="Upgrade plan" />
    </div>
  );
}
