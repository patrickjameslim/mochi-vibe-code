import React from 'react';
import { CaretRight, CaretDown, BellSimple, Plus } from '@phosphor-icons/react';
import { Sidebar } from './Sidebar';
import ReceivablesTable from './ReceivablesTable';
import { BILLS } from '../data/bills';
import { useNavigation } from '../context/NavigationContext';

export default function ManageBillsPage() {
  const { navigate } = useNavigation();

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* ── Header ── */}
        <header className="shrink-0 relative z-10 bg-white border-b border-slate-200 px-6 h-14 flex items-center justify-between">
          <nav className="flex items-center gap-1.5 text-sm text-slate-500">
            <span>Dashboard</span>
            <CaretRight size={12} />
            <span className="text-slate-900 font-medium">Billing</span>
            <CaretRight size={12} />
            <span className="text-slate-900 font-medium">Manage bills</span>
          </nav>
          <button className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors">
            <BellSimple size={16} />
          </button>
        </header>

        {/* ── Content ── */}
        <main className="flex-1 overflow-y-auto px-6 py-5">
          <div className="flex items-center justify-between mb-5">
            <h1 className="text-[28px] font-bold tracking-tight text-slate-900">Manage bills</h1>
            <div className="flex items-center gap-2">
              <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">
                Export data
                <CaretDown size={13} />
              </button>
              <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">
                Bulk create bill(s)
              </button>
              <button
                onClick={() => navigate('bill')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-600 text-white text-sm font-medium hover:bg-violet-700 transition-colors"
              >
                <Plus size={15} weight="bold" />
                Create a new bill
              </button>
            </div>
          </div>
          <ReceivablesTable
            bills={BILLS}
            onCreateBill={() => navigate('bill')}
          />
        </main>
      </div>
    </div>
  );
}
