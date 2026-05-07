import React from 'react';
import { CaretRight, CaretDown, BellSimple, Plus } from '@phosphor-icons/react';
import { Sidebar } from './Sidebar';
import ReceivablesTable from './ReceivablesTable';
import { BILLS } from '../data/bills';
import { useNavigation } from '../context/NavigationContext';

export default function ManageBillsPage() {
  const { navigate } = useNavigation();

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* ── Header ── */}
        <header className="shrink-0 bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
          <nav className="flex items-center gap-1.5 text-sm text-gray-500">
            <span>Dashboard</span>
            <CaretRight size={12} />
            <span className="text-gray-900 font-medium">Billing</span>
            <CaretRight size={12} />
            <span className="text-gray-900 font-medium">Manage bills</span>
          </nav>
          <button className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors">
            <BellSimple size={16} />
          </button>
        </header>

        {/* ── Content ── */}
        <main className="flex-1 overflow-y-auto px-6 py-5">
          <div className="flex items-center justify-between mb-5">
            <h1 className="text-xl font-semibold text-gray-900">Manage bills</h1>
            <div className="flex items-center gap-2">
              <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                Export data
                <CaretDown size={13} />
              </button>
              <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
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
