import React from 'react';
import {
  BellSimple,
  ShoppingBag,
  FileText,
  Users,
  Cube,
  ArrowRight,
  Receipt,
  Wallet,
  Clock,
  WarningCircle,
} from '@phosphor-icons/react';
import { AppSidebar } from '#/pages/shared/AppSidebar';
import { Card, CardContent } from '#/components/atoms/Card';
import { Badge } from '#/components/atoms/Badge';
import { Button } from '#/components/atoms/Button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/atoms/Select';
import { useNavigate } from '@tanstack/react-router';

// ─── Mock Data ───────────────────────────────────────────────────────────────

const INVOICES = [
  { status: 'VERIFYING', id: 'INV-000005', amount: '₱24,000.00', name: 'Juan Dela Cruz', method: 'GCash' },
  { status: 'SENT',      id: 'INV-000004', amount: '₱24,000.00', name: 'Juan Dela Cruz', method: 'BDO' },
  { status: 'VERIFYING', id: 'INV-000003', amount: '₱24,000.00', name: 'Juan Dela Cruz', method: 'BPI' },
  { status: 'SENT',      id: 'INV-000002', amount: '₱24,000.00', name: 'Juan Dela Cruz', method: 'GrabPay' },
  { status: 'OVERDUE',   id: 'INV-000001', amount: '₱24,000.00', name: 'Juan Dela Cruz', method: 'GCash' },
];

const ORDERS = [
  { id: 'REG-000005', regStatus: 'APPROVED', payStatus: 'VERIFYING', form: 'Civil Engineering Enrollment Form' },
  { id: 'REG-000004', regStatus: 'APPROVED', payStatus: 'OVERDUE',   form: 'Architecture Enrollment Form' },
  { id: 'REG-000003', regStatus: 'APPROVED', payStatus: 'OVERDUE',   form: 'Master Plumber Enrollment Form' },
  { id: 'REG-000002', regStatus: 'APPROVED', payStatus: 'SENT',      form: 'Civil Engineering Enrollment Form' },
  { id: 'REG-000001', regStatus: 'APPROVED', payStatus: 'FULLY PAID', form: 'Architecture Enrollment Form' },
];

// ─── Components ──────────────────────────────────────────────────────────────

function KpiCard({
  label,
  value,
  trend,
  trendType = 'success',
  subtext,
  icon: Icon,
}: {
  label: string;
  value: string;
  trend?: string;
  trendType?: 'success' | 'destructive';
  subtext?: string;
  icon: React.ElementType;
}) {
  return (
    <Card className="flex-1">
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-4">
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <Icon size={16} className="text-slate-400" />
        </div>
        <div className="space-y-1">
          <p className="text-2xl font-bold text-slate-900 leading-tight">
            {value} <span className="text-xs font-normal text-slate-400 ml-0.5">PHP</span>
          </p>
          {trend && (
            <p className={`text-xs font-medium ${trendType === 'success' ? 'text-green-600' : 'text-red-600'}`}>
              {trend} <span className="text-slate-400 font-normal ml-0.5">from last month</span>
            </p>
          )}
          {subtext && <p className="text-xs text-slate-400">{subtext}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

function QuickstartCard({ label, icon: Icon, onClick }: { label: string; icon: React.ElementType; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-3 p-4 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors group w-full"
    >
      <div className="w-10 h-10 rounded-lg bg-violet-50 flex items-center justify-center text-violet-600 group-hover:bg-violet-100 transition-colors">
        <Icon size={20} />
      </div>
      <span className="text-xs font-medium text-slate-600">{label}</span>
    </button>
  );
}

export function DashboardPage() {
  const navigate = useNavigate();

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <AppSidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* ── Header ── */}
        <header className="shrink-0 relative z-10 bg-white border-b border-slate-200 px-6 h-14 flex items-center justify-between">
          <nav className="flex items-center gap-1.5 text-sm text-slate-500">
            <span className="text-slate-900 font-medium">Dashboard</span>
          </nav>
          <button className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors">
            <BellSimple size={16} />
          </button>
        </header>

        {/* ── Content ── */}
        <main className="flex-1 overflow-y-auto px-10 py-8">
          <div className="max-w-7xl mx-auto space-y-10">

            {/* ── Upgrade Banner ── */}
            <Card className="bg-white border-slate-200 overflow-hidden">
              <CardContent className="p-6 flex items-center justify-between">
                <div className="space-y-1">
                  <h2 className="text-xl font-bold text-slate-900">Get the best out of Mochi, for the best price!</h2>
                  <p className="text-sm text-slate-500">Upgrade and supercharge your business at its full power by upgrading Mochi to the Pro version today!</p>
                </div>
                <Button
                  className="bg-violet-600 hover:bg-violet-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
                  onClick={() => navigate({ to: '/settings', search: { section: 'subscription' } })}
                >
                  Upgrade now
                </Button>
              </CardContent>
            </Card>

            {/* ── Getting Started ── */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-slate-900">How do you want to get started?</h3>
              <div className="grid grid-cols-2 gap-4">
                <Card className="hover:bg-slate-50 transition-colors cursor-pointer border-slate-200">
                  <CardContent className="p-6 space-y-2">
                    <p className="font-bold text-slate-900">Start billing customers</p>
                    <p className="text-sm text-slate-500">Create your first invoice and send it to your first customer.</p>
                  </CardContent>
                </Card>
                <Card className="hover:bg-slate-50 transition-colors cursor-pointer border-slate-200">
                  <CardContent className="p-6 space-y-2">
                    <p className="font-bold text-slate-900">Start accepting orders</p>
                    <p className="text-sm text-slate-500">Create products or services, forms, and more necessary steps to start accepting orders from your customers.</p>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* ── Quickstart ── */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-slate-900">Quickstart</h3>
              <div className="grid grid-cols-4 gap-4">
                <QuickstartCard label="Manage orders" icon={ShoppingBag} />
                <QuickstartCard label="New order form" icon={FileText} />
                <QuickstartCard label="New customer" icon={Users} onClick={() => navigate({ to: '/customers/create' })} />
                <QuickstartCard label="New catalog item" icon={Cube} />
              </div>
            </div>

            {/* ── Performance Overview ── */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-900">Performance overview</h3>
                <div className="flex items-center gap-2">
                  <Select defaultValue="today">
                    <SelectTrigger className="w-[100px] h-9 text-sm">
                      <SelectValue placeholder="Today" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="today">Today</SelectItem>
                      <SelectItem value="week">Week</SelectItem>
                      <SelectItem value="month">Month</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="sm" className="gap-1.5 h-9 text-sm" onClick={() => navigate({ to: '/reports' })}>
                    View reports
                    <ArrowRight size={14} />
                  </Button>
                </div>
              </div>
              <div className="flex gap-4">
                <KpiCard label="Total Sales" value="₱950,000.00" icon={Receipt} />
                <KpiCard label="Total Collections" value="₱880,000.00" trend="+14.1%" icon={Wallet} />
                <KpiCard label="Pending Collections" value="₱72,600.00" trend="+14.1%" icon={Clock} />
                <KpiCard label="Overdue" value="₱57,400.00" trendType="destructive" subtext="34 bills overdue" icon={WarningCircle} />
              </div>
            </div>

            {/* ── Recent Transactions ── */}
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-slate-900 border-b border-slate-200 pb-2">Recent transactions</h3>

              {/* Invoices */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-lg font-bold text-slate-900">Invoices</h4>
                  <Button variant="outline" size="sm" className="gap-1.5 h-9 text-sm" onClick={() => navigate({ to: '/billings' })}>
                    View all invoices
                    <ArrowRight size={14} />
                  </Button>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50/50 border-b border-slate-100">
                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Invoice number</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Invoice amount</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Student name</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Paid via</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {INVOICES.map((inv) => (
                        <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4">
                            <Badge colorScheme={inv.status === 'OVERDUE' ? 'red' : inv.status === 'SENT' ? 'blue' : 'amber'} className="rounded-md font-bold px-2">
                              {inv.status}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 font-medium text-slate-700">{inv.id}</td>
                          <td className="px-6 py-4 font-bold text-slate-900">{inv.amount}</td>
                          <td className="px-6 py-4 text-slate-600">{inv.name}</td>
                          <td className="px-6 py-4 font-bold text-slate-900">{inv.method}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Orders */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-lg font-bold text-slate-900">Orders</h4>
                  <Button variant="outline" size="sm" className="gap-1.5 h-9 text-sm">
                    View order form
                    <ArrowRight size={14} />
                  </Button>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50/50 border-b border-slate-100">
                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Registration number</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider text-center">Registration status</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider text-center">Payment status</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Order form</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {ORDERS.map((order) => (
                        <tr key={order.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4 font-medium text-slate-700">{order.id}</td>
                          <td className="px-6 py-4 text-center">
                            <Badge colorScheme="emerald" className="rounded-md font-bold px-2">
                              {order.regStatus}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <Badge
                              colorScheme={
                                order.payStatus === 'OVERDUE' ? 'red' :
                                order.payStatus === 'SENT' ? 'blue' :
                                order.payStatus === 'FULLY PAID' ? 'emerald' : 'amber'
                              }
                              className="rounded-md font-bold px-2"
                            >
                              {order.payStatus}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 font-medium text-slate-700">{order.form}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
