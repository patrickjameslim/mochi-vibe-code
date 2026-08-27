import { useState } from 'react';
import { CaretRight, CaretDown, BellSimple, Plus } from '@phosphor-icons/react';
import { useNavigate } from '@tanstack/react-router';
import { AppSidebar } from '#/pages/shared/AppSidebar';
import { RecurringCyclesTable } from '#/components/molecules/RecurringCyclesTable';
import { RecurringBillsTable } from '#/components/molecules/RecurringBillsTable';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '#/components/atoms/DropdownMenu';
import { cn } from '#/components/utils';

type PageTab = 'cycles' | 'bills';

export function RecurringBillingPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<PageTab>('cycles');

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <AppSidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* ── Header ── */}
        <header className="shrink-0 relative z-10 bg-white border-b border-slate-200 px-6 h-14 flex items-center justify-between">
          <nav className="flex items-center gap-1.5 text-sm text-slate-500">
            <span>Dashboard</span>
            <CaretRight size={12} />
            <span className="text-slate-900 font-medium">Billing</span>
            <CaretRight size={12} />
            <span className="text-slate-900 font-medium">Recurring billing</span>
          </nav>
          <button className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors">
            <BellSimple size={16} />
          </button>
        </header>

        {/* ── Content ── */}
        <main className="flex-1 overflow-y-auto px-6 py-5">
          <div className="flex items-center justify-between mb-5">
            <h1 className="text-[28px] font-bold tracking-tight text-slate-900">Recurring billing</h1>
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger className="inline-flex items-center gap-1.5 h-10 px-3 rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors outline-none">
                  Export data
                  <CaretDown size={13} />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuItem>All</DropdownMenuItem>
                  <DropdownMenuItem>Filtered view</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <button className="inline-flex items-center gap-1.5 h-10 px-3 rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">
                Import data
              </button>
              <button
                onClick={() => navigate({ to: '/billings/create' })}
                className="inline-flex items-center gap-1.5 h-10 px-3 rounded-lg bg-violet-600 text-white text-sm font-medium hover:bg-violet-700 transition-colors"
              >
                <Plus size={15} weight="bold" />
                Create a new cycle
              </button>
            </div>
          </div>

          {/* ── Page-level tabs — Recurring cycles / Recurring bills. These
               switch the entire table (different columns, different data),
               not a filter within one table, so it's a plain tab bar
               above the DataTable rather than DataTable's own tab prop. ── */}
          <div className="border-b border-slate-200 mb-5">
            <div className="flex items-center gap-1">
              <button
                onClick={() => setActiveTab('cycles')}
                className={cn(
                  'px-1 pb-3 -mb-px text-sm font-medium border-b-2 transition-colors mr-6',
                  activeTab === 'cycles'
                    ? 'border-violet-600 text-violet-700'
                    : 'border-transparent text-slate-500 hover:text-slate-700',
                )}
              >
                Recurring cycles
              </button>
              <button
                onClick={() => setActiveTab('bills')}
                className={cn(
                  'px-1 pb-3 -mb-px text-sm font-medium border-b-2 transition-colors',
                  activeTab === 'bills'
                    ? 'border-violet-600 text-violet-700'
                    : 'border-transparent text-slate-500 hover:text-slate-700',
                )}
              >
                Recurring bills
              </button>
            </div>
          </div>

          {activeTab === 'cycles' ? <RecurringCyclesTable /> : <RecurringBillsTable />}
        </main>
      </div>
    </div>
  );
}
