import React, { useRef, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Bar } from 'react-chartjs-2';
import type { DateRange } from 'react-day-picker';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip as ChartTooltip,
  Legend,
} from 'chart.js';
import {
  BellSimple,
  CalendarBlank,
  CaretDown,
  CaretRight,
  ChartBar,
  DownloadSimple,
  MagnifyingGlass,
  FileCsv,
  FileXls,
  Receipt,
  UsersThree,
  X,
} from '@phosphor-icons/react';
import { AppSidebar } from '#/pages/shared/AppSidebar';
import { Card, CardContent } from '#/components/atoms/Card';
import { SortTh } from '#/components/molecules/SortTh';
import { useTableSort } from '#/hooks/useTableSort';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/atoms/Select';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuSeparator,
} from '#/components/atoms/DropdownMenu';
import { Popover, PopoverTrigger, PopoverContent } from '#/components/atoms/Popover';
import { Calendar } from '#/components/atoms/Calendar';
import { cn } from '#/components/utils';

ChartJS.register(CategoryScale, LinearScale, BarElement, ChartTooltip, Legend);

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PeriodStat {
  label: string;
  billed: number;
  collected: number;
}

export interface GroupBvcData {
  name: string;
  periods: PeriodStat[];
}

export interface CustomerBvcData {
  id: string;
  name: string;
  initials: string;
  avatarColor: string;
  group: string;
  periods: PeriodStat[];
}

// ─── Mock data ─────────────────────────────────────────────────────────────────

const BVC_PERIODS: PeriodStat[] = [
  { label: 'Jan 2026', billed: 80_000,  collected: 80_000 },
  { label: 'Feb 2026', billed: 160_000, collected: 80_000 },
  { label: 'Mar 2026', billed: 80_000,  collected: 0       },
  { label: 'Apr 2026', billed: 80_000,  collected: 0       },
  { label: 'May 2026', billed: 0,       collected: 0       },
];

const BVC_GROUPS: GroupBvcData[] = [
  {
    name: 'Metroview Axis Tower',
    periods: [
      { label: 'Jan 2026', billed: 24_000, collected: 24_000 },
      { label: 'Feb 2026', billed: 48_000, collected: 24_000 },
      { label: 'Mar 2026', billed: 24_000, collected: 0       },
      { label: 'Apr 2026', billed: 24_000, collected: 0       },
      { label: 'May 2026', billed: 0,      collected: 0       },
    ],
  },
  {
    name: 'Glasshouse Tower',
    periods: [
      { label: 'Jan 2026', billed: 20_000, collected: 20_000 },
      { label: 'Feb 2026', billed: 40_000, collected: 20_000 },
      { label: 'Mar 2026', billed: 20_000, collected: 0       },
      { label: 'Apr 2026', billed: 20_000, collected: 0       },
      { label: 'May 2026', billed: 0,      collected: 0       },
    ],
  },
  {
    name: 'Sterling Tower',
    periods: [
      { label: 'Jan 2026', billed: 16_000, collected: 16_000 },
      { label: 'Feb 2026', billed: 32_000, collected: 16_000 },
      { label: 'Mar 2026', billed: 16_000, collected: 0       },
      { label: 'Apr 2026', billed: 16_000, collected: 0       },
      { label: 'May 2026', billed: 0,      collected: 0       },
    ],
  },
  {
    name: 'Azure Tower',
    periods: [
      { label: 'Jan 2026', billed: 12_000, collected: 12_000 },
      { label: 'Feb 2026', billed: 24_000, collected: 12_000 },
      { label: 'Mar 2026', billed: 12_000, collected: 0       },
      { label: 'Apr 2026', billed: 12_000, collected: 0       },
      { label: 'May 2026', billed: 0,      collected: 0       },
    ],
  },
  {
    name: 'Summit One Tower',
    periods: [
      { label: 'Jan 2026', billed: 8_000, collected: 8_000 },
      { label: 'Feb 2026', billed: 16_000, collected: 8_000 },
      { label: 'Mar 2026', billed: 8_000,  collected: 0     },
      { label: 'Apr 2026', billed: 8_000,  collected: 0     },
      { label: 'May 2026', billed: 0,      collected: 0     },
    ],
  },
];

const BVC_CUSTOMERS: CustomerBvcData[] = [
  {
    id: 'CST-2026-0001',
    name: 'Square C LLC',
    initials: 'SC',
    avatarColor: '#3b82f6',
    group: 'Metroview Axis Tower',
    periods: [
      { label: 'Jan 2026', billed: 12_000, collected: 12_000 },
      { label: 'Feb 2026', billed: 24_000, collected: 12_000 },
      { label: 'Mar 2026', billed: 12_000, collected: 0       },
      { label: 'Apr 2026', billed: 12_000, collected: 0       },
      { label: 'May 2026', billed: 0,      collected: 0       },
    ],
  },
  {
    id: 'CST-2026-0002',
    name: 'Premium Holdings Inc.',
    initials: 'PH',
    avatarColor: '#6d28d9',
    group: 'Metroview Axis Tower',
    periods: [
      { label: 'Jan 2026', billed: 12_000, collected: 12_000 },
      { label: 'Feb 2026', billed: 24_000, collected: 12_000 },
      { label: 'Mar 2026', billed: 12_000, collected: 0       },
      { label: 'Apr 2026', billed: 12_000, collected: 0       },
      { label: 'May 2026', billed: 0,      collected: 0       },
    ],
  },
  {
    id: 'CST-2026-0003',
    name: 'Meridian Properties Inc.',
    initials: 'MP',
    avatarColor: '#f59e0b',
    group: 'Glasshouse Tower',
    periods: [
      { label: 'Jan 2026', billed: 10_000, collected: 10_000 },
      { label: 'Feb 2026', billed: 20_000, collected: 10_000 },
      { label: 'Mar 2026', billed: 10_000, collected: 0       },
      { label: 'Apr 2026', billed: 10_000, collected: 0       },
      { label: 'May 2026', billed: 0,      collected: 0       },
    ],
  },
  {
    id: 'CST-2026-0004',
    name: 'Pacific Ventures Corp.',
    initials: 'PV',
    avatarColor: '#0ea5e9',
    group: 'Glasshouse Tower',
    periods: [
      { label: 'Jan 2026', billed: 10_000, collected: 10_000 },
      { label: 'Feb 2026', billed: 20_000, collected: 10_000 },
      { label: 'Mar 2026', billed: 10_000, collected: 0       },
      { label: 'Apr 2026', billed: 10_000, collected: 0       },
      { label: 'May 2026', billed: 0,      collected: 0       },
    ],
  },
  {
    id: 'CST-2026-0005',
    name: 'Grace Lim',
    initials: 'GL',
    avatarColor: '#ec4899',
    group: 'Sterling Tower',
    periods: [
      { label: 'Jan 2026', billed: 8_000, collected: 8_000 },
      { label: 'Feb 2026', billed: 16_000, collected: 8_000 },
      { label: 'Mar 2026', billed: 8_000,  collected: 0     },
      { label: 'Apr 2026', billed: 8_000,  collected: 0     },
      { label: 'May 2026', billed: 0,      collected: 0     },
    ],
  },
  {
    id: 'CST-2026-0006',
    name: 'Blue Star Corp.',
    initials: 'BS',
    avatarColor: '#14b8a6',
    group: 'Sterling Tower',
    periods: [
      { label: 'Jan 2026', billed: 8_000, collected: 8_000 },
      { label: 'Feb 2026', billed: 16_000, collected: 8_000 },
      { label: 'Mar 2026', billed: 8_000,  collected: 0     },
      { label: 'Apr 2026', billed: 8_000,  collected: 0     },
      { label: 'May 2026', billed: 0,      collected: 0     },
    ],
  },
  {
    id: 'CST-2026-0007',
    name: 'Daniel Rivera',
    initials: 'DR',
    avatarColor: '#8b5cf6',
    group: 'Azure Tower',
    periods: [
      { label: 'Jan 2026', billed: 6_000, collected: 6_000 },
      { label: 'Feb 2026', billed: 12_000, collected: 6_000 },
      { label: 'Mar 2026', billed: 6_000,  collected: 0     },
      { label: 'Apr 2026', billed: 6_000,  collected: 0     },
      { label: 'May 2026', billed: 0,      collected: 0     },
    ],
  },
  {
    id: 'CST-2026-0008',
    name: 'Maria Santos',
    initials: 'MS',
    avatarColor: '#f43f5e',
    group: 'Azure Tower',
    periods: [
      { label: 'Jan 2026', billed: 6_000, collected: 6_000 },
      { label: 'Feb 2026', billed: 12_000, collected: 6_000 },
      { label: 'Mar 2026', billed: 6_000,  collected: 0     },
      { label: 'Apr 2026', billed: 6_000,  collected: 0     },
      { label: 'May 2026', billed: 0,      collected: 0     },
    ],
  },
  {
    id: 'CST-2026-0009',
    name: 'Juan Dela Cruz',
    initials: 'JD',
    avatarColor: '#10b981',
    group: 'Summit One Tower',
    periods: [
      { label: 'Jan 2026', billed: 4_000, collected: 4_000 },
      { label: 'Feb 2026', billed: 8_000,  collected: 4_000 },
      { label: 'Mar 2026', billed: 4_000,  collected: 0     },
      { label: 'Apr 2026', billed: 4_000,  collected: 0     },
      { label: 'May 2026', billed: 0,      collected: 0     },
    ],
  },
  {
    id: 'CST-2026-0010',
    name: 'Liza Gomez',
    initials: 'LG',
    avatarColor: '#6366f1',
    group: 'Summit One Tower',
    periods: [
      { label: 'Jan 2026', billed: 4_000, collected: 4_000 },
      { label: 'Feb 2026', billed: 8_000,  collected: 4_000 },
      { label: 'Mar 2026', billed: 4_000,  collected: 0     },
      { label: 'Apr 2026', billed: 4_000,  collected: 0     },
      { label: 'May 2026', billed: 0,      collected: 0     },
    ],
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return `₱${n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtAxis(n: number) {
  if (n === 0) return 'PHP 0';
  if (n >= 1_000_000) return `PHP ${(n / 1_000_000).toFixed(1)}M`;
  return `PHP ${Math.round(n / 1_000)}k`;
}

export function sumBilled(periods: PeriodStat[]) {
  return periods.reduce((s, p) => s + p.billed, 0);
}

export function sumCollected(periods: PeriodStat[]) {
  return periods.reduce((s, p) => s + p.collected, 0);
}

export function collectionRate(billed: number, collected: number) {
  return billed > 0 ? Math.round((collected / billed) * 100) : 0;
}

function RateChip({ rate }: { rate: number }) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
        rate >= 80 ? 'bg-green-50 text-green-700' :
        rate >= 50 ? 'bg-amber-50 text-amber-700' :
                     'bg-red-50 text-red-700'
      )}
    >
      {rate}%
    </span>
  );
}

// ─── Reusable: Summary card ───────────────────────────────────────────────────

export function ReportSummaryCard({
  label,
  value,
  valueClassName,
  sub,
}: {
  label: string;
  value: string;
  // Optional override for the value's color (e.g. emerald for a "waived"
  // figure) — defaults to the same neutral slate-900 every other summary
  // card already uses, so existing callers are unaffected.
  valueClassName?: string;
  sub?: React.ReactNode;
}) {
  return (
    <Card className="flex-1">
      <CardContent className="px-6 py-5">
        <p className="text-sm font-medium text-slate-500 mb-1.5">{label}</p>
        <p className={cn('text-3xl font-bold leading-none mb-3', valueClassName ?? 'text-slate-900')}>{value}</p>
        {sub}
      </CardContent>
    </Card>
  );
}

// ─── Reusable: Bar chart (Chart.js) ──────────────────────────────────────────

export function BilledVsCollectedChart({ data }: { data: PeriodStat[] }) {
  const chartData = {
    labels: data.map((p) => p.label.split(' ')[0]),
    datasets: [
      {
        label: 'Billed',
        data: data.map((p) => p.billed),
        backgroundColor: '#3b82f6',
        borderRadius: 4,
        barPercentage: 0.8,
        categoryPercentage: 0.75,
      },
      {
        label: 'Collected',
        data: data.map((p) => p.collected),
        backgroundColor: '#f97316',
        borderRadius: 4,
        barPercentage: 0.8,
        categoryPercentage: 0.75,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: true,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1e293b',
        titleColor: '#94a3b8',
        bodyColor: '#f8fafc',
        padding: 12,
        cornerRadius: 8,
        bodySpacing: 6,
        callbacks: {
          title: (items: { label: string }[]) => {
            const idx = data.findIndex((p) => p.label.startsWith(items[0]?.label));
            return idx >= 0 ? data[idx].label : items[0]?.label;
          },
          label: (ctx: { dataset: { label: string }; raw: unknown }) => {
            const value = ctx.raw as number;
            return `  ${ctx.dataset.label}: ${fmt(value)}`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        border: { display: false },
        ticks: { color: '#94a3b8', font: { size: 11 } },
      },
      y: {
        beginAtZero: true,
        suggestedMax: 200_000,
        border: { display: false },
        grid: { color: '#f1f5f9' },
        ticks: {
          color: '#94a3b8',
          font: { size: 11 },
          callback: (val: string | number) => fmtAxis(Number(val)),
        },
      },
    },
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-end gap-4 text-xs text-slate-600 pr-1">
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-blue-500" />
          Billed
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-orange-400" />
          Collected
        </span>
      </div>
      <Bar data={chartData} options={options} />
    </div>
  );
}

// ─── Reusable: Group breakdown table ─────────────────────────────────────────

export function BilledVsCollectedTable({
  periods,
  groups,
}: {
  periods: PeriodStat[];
  groups: GroupBvcData[];
}) {
  const [expanded, setExpanded] = useState(true);

  const grandBilled    = sumBilled(periods);
  const grandCollected = sumCollected(periods);
  const grandRate      = collectionRate(grandBilled, grandCollected);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="w-10 px-3 py-3" />
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Customer group
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Total billed
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Total collected
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Rate
              </th>
              {periods.map((p) => (
                <th
                  key={p.label}
                  className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap"
                >
                  {p.label.split(' ')[0]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr
              className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors"
              onClick={() => setExpanded((e) => !e)}
            >
              <td className="px-3 py-3 text-center text-slate-400">
                {expanded
                  ? <CaretDown  size={13} weight="bold" />
                  : <CaretRight size={13} weight="bold" />}
              </td>
              <td className="px-4 py-3 font-semibold text-slate-800">Grand total</td>
              <td className="px-4 py-3 text-right font-semibold text-blue-600">{fmt(grandBilled)}</td>
              <td className="px-4 py-3 text-right font-semibold text-orange-500">{fmt(grandCollected)}</td>
              <td className="px-4 py-3 text-right"><RateChip rate={grandRate} /></td>
              {periods.map((p, i) => (
                <td key={i} className="px-4 py-3 text-right font-semibold text-slate-800 whitespace-nowrap">
                  {p.billed > 0 ? fmt(p.billed) : '—'}
                </td>
              ))}
            </tr>
            {expanded && groups.map((g) => {
              const gb = sumBilled(g.periods);
              const gc = sumCollected(g.periods);
              return (
                <tr
                  key={g.name}
                  className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60 transition-colors"
                >
                  <td className="px-3 py-2.5" />
                  <td className="px-4 py-2.5 pl-8 text-slate-700">{g.name}</td>
                  <td className="px-4 py-2.5 text-right text-blue-600">{fmt(gb)}</td>
                  <td className="px-4 py-2.5 text-right text-orange-500">{fmt(gc)}</td>
                  <td className="px-4 py-2.5 text-right">
                    <RateChip rate={collectionRate(gb, gc)} />
                  </td>
                  {g.periods.map((p, i) => (
                    <td key={i} className="px-4 py-2.5 text-right text-slate-700 whitespace-nowrap">
                      {p.billed > 0 ? fmt(p.billed) : '—'}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
    </div>
  );
}

// ─── Customer collections table ───────────────────────────────────────────────

type CustomerSortKey = 'name' | 'group' | 'billed' | 'collected' | 'rate';

function CustomerCollectionsTable({ customers }: { customers: CustomerBvcData[] }) {
  const [search, setSearch]     = useState('');
  const [sortKey, setSortKey]   = useState<CustomerSortKey>('billed');
  const [sortAsc, setSortAsc]   = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  function handleSort(key: string) {
    if (key === sortKey) {
      setSortAsc((a) => !a);
    } else {
      setSortKey(key as CustomerSortKey);
      setSortAsc(false);
    }
  }

  const q = search.toLowerCase();
  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(q) ||
      c.group.toLowerCase().includes(q) ||
      c.id.toLowerCase().includes(q)
  );

  const sorted = [...filtered].sort((a, b) => {
    let cmp = 0;
    if (sortKey === 'name')      cmp = a.name.localeCompare(b.name);
    if (sortKey === 'group')     cmp = a.group.localeCompare(b.group);
    if (sortKey === 'billed')    cmp = sumBilled(a.periods) - sumBilled(b.periods);
    if (sortKey === 'collected') cmp = sumCollected(a.periods) - sumCollected(b.periods);
    if (sortKey === 'rate') {
      const ra = collectionRate(sumBilled(a.periods), sumCollected(a.periods));
      const rb = collectionRate(sumBilled(b.periods), sumCollected(b.periods));
      cmp = ra - rb;
    }
    return sortAsc ? cmp : -cmp;
  });

  const sharedThProps = { activeSortKey: sortKey, sortAsc, onSort: handleSort };

  return (
    <>
      {/* Search toolbar */}
      <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2">
        <div className="relative flex-1 max-w-xs">
          <MagnifyingGlass
            size={14}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            ref={searchRef}
            type="text"
            placeholder="Search customers or groups…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`w-full pl-8 py-1.5 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-violet-200 focus:border-violet-400 ${search ? 'pr-7' : 'pr-3'}`}
          />
          {search && (
            <button
              onClick={() => { setSearch(''); searchRef.current?.focus(); }}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X size={14} weight="bold" />
            </button>
          )}
        </div>
        <span className="ml-auto text-xs text-slate-400">
          {sorted.length} customer{sorted.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        {sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-sm font-medium text-slate-500">No customers found</p>
            <p className="text-xs text-slate-400 mt-1">Try a different search term.</p>
          </div>
        ) : (
          <table className="w-full text-sm" style={{ borderSpacing: 0 }}>
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <SortTh colSortKey="name"      {...sharedThProps}>Customer</SortTh>
                <SortTh colSortKey="group"     {...sharedThProps}>Customer group</SortTh>
                <SortTh colSortKey="billed"    {...sharedThProps} align="right">Total billed</SortTh>
                <SortTh colSortKey="collected" {...sharedThProps} align="right">Total collected</SortTh>
                <SortTh colSortKey="rate"      {...sharedThProps} align="right">Rate</SortTh>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sorted.map((c) => {
                const billed    = sumBilled(c.periods);
                const collected = sumCollected(c.periods);
                const rate      = collectionRate(billed, collected);
                return (
                  <tr key={c.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2.5">
                        <span
                          className="inline-flex items-center justify-center rounded-full text-white text-xs font-semibold shrink-0"
                          style={{ width: 28, height: 28, backgroundColor: c.avatarColor }}
                        >
                          {c.initials}
                        </span>
                        <div className="min-w-0">
                          <p className="font-medium text-slate-800 truncate">{c.name}</p>
                          <p className="text-xs text-slate-400">{c.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-slate-600">{c.group}</td>
                    <td className="px-3 py-3 text-right font-medium text-blue-600">{fmt(billed)}</td>
                    <td className="px-3 py-3 text-right font-medium text-orange-500">{fmt(collected)}</td>
                    <td className="px-3 py-3 text-right">
                      <RateChip rate={rate} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}

// ─── Placeholder tab ──────────────────────────────────────────────────────────

export function ReportPlaceholderView({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center gap-3">
      <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
        <ChartBar size={22} className="text-slate-300" />
      </div>
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="text-xs text-slate-400">This report is coming soon.</p>
    </div>
  );
}

// ─── Billed vs Collected tab view ─────────────────────────────────────────────

type GroupByTime = 'day' | 'week' | 'month' | 'quarter' | 'year';
type TableTab = 'by-customer' | 'by-group';

const TABLE_TABS: { value: TableTab; label: string }[] = [
  { value: 'by-customer', label: 'By customer' },
  { value: 'by-group',    label: 'By customer group' },
];

function BilledVsCollectedView() {
  const [groupBy, setGroupBy]       = useState<GroupByTime>('month');
  const [tableTab, setTableTab]     = useState<TableTab>('by-customer');

  const totalBilled    = sumBilled(BVC_PERIODS);
  const totalCollected = sumCollected(BVC_PERIODS);
  const rate           = collectionRate(totalBilled, totalCollected);

  return (
    <div className="space-y-5">
      {/* Controls */}
      <div className="flex items-center gap-3 flex-wrap">
        <button className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors shadow-sm">
          <CalendarBlank size={14} className="text-slate-400" />
          01/01/2026 – 05/21/2026
        </button>

        <div className="flex items-center gap-1.5">
          <span className="text-sm text-slate-500">Group by</span>
          <Select value={groupBy} onValueChange={(v) => setGroupBy(v as GroupByTime)}>
            <SelectTrigger className="h-8 py-0 text-sm w-[110px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Day</SelectItem>
              <SelectItem value="week">Week</SelectItem>
              <SelectItem value="month">Month</SelectItem>
              <SelectItem value="quarter">Quarter</SelectItem>
              <SelectItem value="year">Year</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1" />

        <button className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors shadow-sm">
          <DownloadSimple size={14} />
          Export
        </button>
      </div>

      {/* Report heading */}
      <div className="text-center pt-1">
        <p className="text-base font-semibold text-slate-800">Billed and Collected Report</p>
        <p className="text-sm text-slate-400 mt-0.5">Jan 2026 – May 2026</p>
      </div>

      {/* Summary cards */}
      <div className="flex gap-4">
        <ReportSummaryCard label="Total billed" value={fmt(totalBilled)} />
        <ReportSummaryCard
          label="Total collected"
          value={fmt(totalCollected)}
          sub={
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-orange-400 transition-all"
                  style={{ width: `${rate}%` }}
                />
              </div>
              <span className="text-xs font-medium text-slate-500 whitespace-nowrap">
                {rate}% collected
              </span>
            </div>
          }
        />
      </div>

      {/* Chart */}
      <div className="rounded-xl border border-slate-200 bg-white px-5 pt-4 pb-3">
        <BilledVsCollectedChart data={BVC_PERIODS} />
      </div>

      {/* Table section with tab strip */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {/* Tab strip */}
        <div className="flex items-center border-b border-slate-200 px-4">
          {TABLE_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setTableTab(tab.value)}
              className={cn(
                'inline-flex items-center px-3 py-3 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap',
                tableTab === tab.value
                  ? 'border-violet-600 text-violet-700'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Table content */}
        {tableTab === 'by-customer' && (
          <CustomerCollectionsTable customers={BVC_CUSTOMERS} />
        )}
        {tableTab === 'by-group' && (
          <BilledVsCollectedTable periods={BVC_PERIODS} groups={BVC_GROUPS} />
        )}
      </div>
    </div>
  );
}

// ─── Penalty Summary report ─────────────────────────────────────────────────
// Note: per-bill penalty/waiver history isn't persisted in the core Bill model
// (penalties are computed live on the Bill Info page against the global rule
// in Settings). This report's rows are curated sample data reflecting
// realistic outcomes — same convention as the other mock report data above.

interface PenaltyReportRow {
  billId: string;
  customerName: string;
  customerInitials: string;
  customerAvatarColor: string;
  billDate: string;
  dueDate: string;
  // When the most recent penalty activity (a charge or a waiver) happened on
  // this bill — this is what the "Penalty date" filter checks, NOT the
  // bill's own issue date. A bill issued months ago still belongs in a given
  // period if a penalty was charged or waived on it during that period.
  penaltyActivityDate: string;
  amount: number;
  penaltyCharged: number;
  penaltyWaived: number;
  remainingBalance: number;
  status: 'Overdue' | 'Paid' | 'Fully waived' | 'Partially waived';
}

const PENALTY_REPORT_ROWS: PenaltyReportRow[] = [
  {
    billId: 'BNG-2025-0031', customerName: 'Square C LLC', customerInitials: 'SC', customerAvatarColor: '#3b82f6',
    billDate: 'Aug 10, 2025', dueDate: 'Sep 10, 2025', penaltyActivityDate: 'Sep 15, 2025',
    amount: 24000, penaltyCharged: 3600, penaltyWaived: 1200, remainingBalance: 27600, status: 'Partially waived',
  },
  {
    billId: 'BNG-2025-0019', customerName: 'Grace Lim', customerInitials: 'GL', customerAvatarColor: '#ec4899',
    billDate: 'Aug 10, 2025', dueDate: 'Sep 10, 2025', penaltyActivityDate: 'Sep 20, 2025',
    amount: 12000, penaltyCharged: 4200, penaltyWaived: 0, remainingBalance: 16200, status: 'Overdue',
  },
  {
    billId: 'BNG-2025-0028', customerName: 'Meridian Properties Inc.', customerInitials: 'MP', customerAvatarColor: '#f59e0b',
    billDate: 'Jul 21, 2025', dueDate: 'Aug 20, 2025', penaltyActivityDate: 'Aug 28, 2025',
    amount: 80000, penaltyCharged: 12000, penaltyWaived: 0, remainingBalance: 92000, status: 'Overdue',
  },
  {
    billId: 'BNG-2025-0021', customerName: 'Square C LLC', customerInitials: 'SC', customerAvatarColor: '#3b82f6',
    billDate: 'Aug 01, 2025', dueDate: 'Aug 31, 2025', penaltyActivityDate: 'Sep 05, 2025',
    amount: 18500, penaltyCharged: 925, penaltyWaived: 0, remainingBalance: 0, status: 'Paid',
  },
  {
    billId: 'BNG-2025-0009', customerName: 'Juan Dela Cruz', customerInitials: 'JD', customerAvatarColor: '#10b981',
    billDate: 'Aug 10, 2025', dueDate: 'Sep 10, 2025', penaltyActivityDate: 'Sep 12, 2025',
    amount: 3800, penaltyCharged: 190, penaltyWaived: 190, remainingBalance: 3800, status: 'Fully waived',
  },
  {
    billId: 'BNG-2025-0014', customerName: 'Liza Gomez', customerInitials: 'LG', customerAvatarColor: '#6366f1',
    billDate: 'Jul 11, 2025', dueDate: 'Aug 10, 2025', penaltyActivityDate: 'Aug 18, 2025',
    amount: 22000, penaltyCharged: 800, penaltyWaived: 300, remainingBalance: 22800, status: 'Partially waived',
  },
];

// Same badge shape as the Bills table's own status pills (bordered
// rounded-full, fixed width) — Overdue/Paid reuse the exact colors the Bills
// table already uses for those two statuses, so this report never invents a
// second visual meaning for a status that already exists elsewhere.
const PENALTY_STATUS_CFG: Record<PenaltyReportRow['status'], { label: string; className: string }> = {
  Overdue:            { label: 'Overdue',          className: 'bg-red-50 text-red-700 border-red-300' },
  Paid:                { label: 'Paid',             className: 'bg-emerald-50 text-emerald-700 border-emerald-300' },
  'Fully waived':      { label: 'Fully waived',     className: 'bg-violet-50 text-violet-700 border-violet-300' },
  'Partially waived':  { label: 'Partially waived', className: 'bg-amber-50 text-amber-700 border-amber-300' },
};

function formatPenaltyDate(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// Trigger label for the "Penalty date" filter button — named for what it
// actually filters (when penalty activity happened), not a generic "Date
// range", since a bill's own issue/due dates are shown elsewhere in the row.
function penaltyDateRangeLabel(range?: DateRange): string {
  if (!range?.from) return 'Penalty date';
  if (!range.to) return formatPenaltyDate(range.from);
  return `${formatPenaltyDate(range.from)} – ${formatPenaltyDate(range.to)}`;
}

// A descriptive filename suffix for the exported file, e.g. "_Aug 1-31 2025"
// when the selected range sits within one month, "_Jul 21 - Sep 5 2025"
// across months, or nothing at all when no Penalty date filter is active.
function penaltyDateFileLabel(range?: DateRange): string {
  if (!range?.from) return '';
  const from = range.from;
  const to = range.to ?? range.from;
  const sameMonth = from.getMonth() === to.getMonth() && from.getFullYear() === to.getFullYear();
  if (sameMonth) {
    const month = from.toLocaleDateString('en-US', { month: 'short' });
    return `_${month} ${from.getDate()}-${to.getDate()} ${from.getFullYear()}`;
  }
  const fromLabel = from.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const toLabel = to.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  return `_${fromLabel} - ${toLabel}`;
}

function downloadPenaltyReportFile(content: string, mimeType: string, fileName: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

const PENALTY_REPORT_EXPORT_COLUMNS = [
  'Status', 'Bill ID', 'Customer', 'Amount', 'Bill date', 'Due date', 'Penalty charged', 'Penalty waived', 'Remaining balance',
];

function penaltyReportExportRows(rows: PenaltyReportRow[]): (string | number)[][] {
  return rows.map((r) => [
    r.status, r.billId, r.customerName, r.amount, r.billDate, r.dueDate, r.penaltyCharged, r.penaltyWaived, r.remainingBalance,
  ]);
}

// ─── Customer filter — supports selecting several customers at once (a user
// comparing a handful of accounts' penalty history shouldn't have to re-run
// the report once per customer). No reusable multi-select dropdown exists
// elsewhere in the app yet, so this is a small, purpose-built one: checkbox
// items that call preventDefault() on select so the menu stays open across
// multiple picks, closing only on an explicit outside click or Escape. ──
function PenaltyCustomerFilter({
  customers,
  selected,
  onChange,
}: {
  customers: string[];
  selected: string[];
  onChange: (next: string[]) => void;
}) {
  const label =
    selected.length === 0 ? 'All customers' : selected.length === 1 ? selected[0] : `${selected.length} customers`;

  function toggle(name: string) {
    onChange(selected.includes(name) ? selected.filter((c) => c !== name) : [...selected, name]);
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 h-9 text-sm text-slate-700 hover:bg-slate-50 transition-colors shadow-sm outline-none max-w-[220px]">
        <UsersThree size={14} className="text-slate-400 shrink-0" />
        <span className="truncate">{label}</span>
        <CaretDown size={12} className="text-slate-400 shrink-0 ml-auto" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[220px]">
        <DropdownMenuItem onSelect={(e) => { e.preventDefault(); onChange([]); }}>
          All customers
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {customers.map((c) => (
          <DropdownMenuCheckboxItem
            key={c}
            checked={selected.includes(c)}
            onSelect={(e) => e.preventDefault()}
            onCheckedChange={() => toggle(c)}
          >
            {c}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

type PenaltySortKey = 'billId' | 'customer' | 'amount' | 'billDate' | 'dueDate' | 'penaltyCharged' | 'penaltyWaived' | 'remainingBalance';

function PenaltySummaryReportView() {
  const navigate = useNavigate();
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const { sortKey, sortAsc, toggleSort } = useTableSort<PenaltySortKey>();

  const customers = [...new Set(PENALTY_REPORT_ROWS.map((r) => r.customerName))].sort();

  const hasActiveFilters = selectedCustomers.length > 0 || !!dateRange?.from;

  function resetFilters() {
    setSelectedCustomers([]);
    setDateRange(undefined);
  }

  // A bill can be issued months before a penalty is ever charged or waived
  // on it — so this filters on penaltyActivityDate (when the activity this
  // report is about actually happened), never on the bill's own issue date.
  const filtered = PENALTY_REPORT_ROWS.filter((r) => {
    if (selectedCustomers.length > 0 && !selectedCustomers.includes(r.customerName)) return false;
    if (dateRange?.from || dateRange?.to) {
      const activityDate = new Date(r.penaltyActivityDate);
      if (dateRange.from && activityDate < dateRange.from) return false;
      if (dateRange.to && activityDate > dateRange.to) return false;
    }
    return true;
  });

  const sorted = sortKey === null ? filtered : [...filtered].sort((a, b) => {
    let cmp = 0;
    if (sortKey === 'billId') cmp = a.billId.localeCompare(b.billId);
    else if (sortKey === 'customer') cmp = a.customerName.localeCompare(b.customerName);
    else if (sortKey === 'amount') cmp = a.amount - b.amount;
    else if (sortKey === 'billDate') cmp = new Date(a.billDate).getTime() - new Date(b.billDate).getTime();
    else if (sortKey === 'dueDate') cmp = new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    else if (sortKey === 'penaltyCharged') cmp = a.penaltyCharged - b.penaltyCharged;
    else if (sortKey === 'penaltyWaived') cmp = a.penaltyWaived - b.penaltyWaived;
    else if (sortKey === 'remainingBalance') cmp = a.remainingBalance - b.remainingBalance;
    return sortAsc ? cmp : -cmp;
  });

  const totalCharged = filtered.reduce((s, r) => s + r.penaltyCharged, 0);
  const totalWaived  = filtered.reduce((s, r) => s + r.penaltyWaived, 0);

  const exportFileName = (ext: string) => `Penalty Summary${penaltyDateFileLabel(dateRange)}.${ext}`;

  const handleExportCsv = () => {
    const csv = [PENALTY_REPORT_EXPORT_COLUMNS, ...penaltyReportExportRows(sorted)]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    downloadPenaltyReportFile(csv, 'text/csv;charset=utf-8;', exportFileName('csv'));
  };

  const handleExportExcel = () => {
    const html = `<table><thead><tr>${PENALTY_REPORT_EXPORT_COLUMNS.map((c) => `<th>${c}</th>`).join('')}</tr></thead><tbody>${penaltyReportExportRows(
      sorted
    )
      .map((row) => `<tr>${row.map((cell) => `<td>${cell}</td>`).join('')}</tr>`)
      .join('')}</tbody></table>`;
    downloadPenaltyReportFile(html, 'application/vnd.ms-excel', exportFileName('xls'));
  };

  return (
    <div className="space-y-5">
      {/* Page title */}
      <h1 className="text-[28px] font-bold tracking-tight text-slate-900">Penalty Summary</h1>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <PenaltyCustomerFilter customers={customers} selected={selectedCustomers} onChange={setSelectedCustomers} />

        <Popover>
          <PopoverTrigger asChild>
            <button className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 h-9 text-sm text-slate-700 hover:bg-slate-50 transition-colors shadow-sm">
              <CalendarBlank size={14} className="text-slate-400" />
              {penaltyDateRangeLabel(dateRange)}
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="range"
              defaultMonth={dateRange?.from}
              selected={dateRange}
              onSelect={setDateRange}
              numberOfMonths={2}
            />
          </PopoverContent>
        </Popover>

        <div className="flex-1" />

        <DropdownMenu>
          <DropdownMenuTrigger className="inline-flex items-center gap-1.5 rounded-lg bg-violet-600 hover:bg-violet-700 px-3 h-9 text-sm font-medium text-white transition-colors outline-none shadow-sm">
            <DownloadSimple size={14} />
            Export
            <CaretDown size={12} />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleExportCsv}>
              <FileCsv size={14} className="text-slate-400" />
              Export CSV
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleExportExcel}>
              <FileXls size={14} className="text-slate-400" />
              Export Excel
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Summary cards — answer "how much charged / how much waived / how
          many bills" at a glance, before a user reads a single table row. */}
      <div className="flex gap-4">
        <ReportSummaryCard label="Total penalty charged" value={fmt(totalCharged)} />
        <ReportSummaryCard label="Total penalty waived" value={fmt(totalWaived)} valueClassName="text-emerald-600" />
        <ReportSummaryCard label="Bills with penalty activity" value={String(filtered.length)} />
      </div>

      {/* Table — same visual language as the Bills table: bordered status
          pill, violet Bill ID link, avatar+name customer cell, right-aligned
          tabular amounts, same row height/padding/hover/border treatment. */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        {sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
              <Receipt size={22} className="text-slate-300" />
            </div>
            <p className="text-sm font-medium text-slate-500">No penalty activity found</p>
            <p className="text-xs text-slate-400 max-w-xs">
              {PENALTY_REPORT_ROWS.length === 0
                ? 'No bills have incurred a late payment penalty yet.'
                : 'Try changing your customer or penalty date filters.'}
            </p>
            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="mt-1 inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
              >
                <X size={13} />
                Reset filters
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm" style={{ borderSpacing: 0 }}>
              <thead className="bg-white border-b border-slate-200">
                <tr>
                  <SortTh>Status</SortTh>
                  <SortTh colSortKey="billId" activeSortKey={sortKey} sortAsc={sortAsc} onSort={toggleSort as (key: string) => void}>
                    Bill ID
                  </SortTh>
                  <SortTh colSortKey="customer" activeSortKey={sortKey} sortAsc={sortAsc} onSort={toggleSort as (key: string) => void}>
                    Customer
                  </SortTh>
                  <SortTh colSortKey="amount" activeSortKey={sortKey} sortAsc={sortAsc} onSort={toggleSort as (key: string) => void} align="right">
                    Amount
                  </SortTh>
                  <SortTh colSortKey="billDate" activeSortKey={sortKey} sortAsc={sortAsc} onSort={toggleSort as (key: string) => void}>
                    Bill date
                  </SortTh>
                  <SortTh colSortKey="dueDate" activeSortKey={sortKey} sortAsc={sortAsc} onSort={toggleSort as (key: string) => void}>
                    Due date
                  </SortTh>
                  <SortTh colSortKey="penaltyCharged" activeSortKey={sortKey} sortAsc={sortAsc} onSort={toggleSort as (key: string) => void} align="right">
                    Penalty charged
                  </SortTh>
                  <SortTh colSortKey="penaltyWaived" activeSortKey={sortKey} sortAsc={sortAsc} onSort={toggleSort as (key: string) => void} align="right">
                    Penalty waived
                  </SortTh>
                  <SortTh colSortKey="remainingBalance" activeSortKey={sortKey} sortAsc={sortAsc} onSort={toggleSort as (key: string) => void} align="right">
                    Remaining balance
                  </SortTh>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sorted.map((r) => {
                  const status = PENALTY_STATUS_CFG[r.status];
                  return (
                    <tr key={r.billId} className="hover:bg-slate-50 transition-colors">
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        <span className={cn('inline-flex items-center justify-center w-[124px] rounded-full border py-1 text-xs font-semibold', status.className)}>
                          {status.label}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        <button
                          onClick={() => navigate({ to: '/billings/$id/info', params: { id: r.billId } })}
                          className="text-violet-600 hover:text-violet-800 hover:underline font-medium text-sm"
                        >
                          {r.billId}
                        </button>
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        <div className="flex items-center gap-2.5">
                          <span
                            className="inline-flex items-center justify-center rounded-full text-white text-xs font-semibold shrink-0"
                            style={{ width: 26, height: 26, backgroundColor: r.customerAvatarColor, fontSize: 10 }}
                          >
                            {r.customerInitials}
                          </span>
                          <span className="text-slate-700 text-sm max-w-[160px] truncate">{r.customerName}</span>
                        </div>
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap text-right text-sm font-medium text-slate-700 tabular-nums">
                        {fmt(r.amount)}
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap text-sm text-slate-600">{r.billDate}</td>
                      <td className="px-3 py-2.5 whitespace-nowrap text-sm text-slate-600">{r.dueDate}</td>
                      <td className="px-3 py-2.5 whitespace-nowrap text-right text-sm text-slate-700 tabular-nums">
                        {r.penaltyCharged > 0 ? fmt(r.penaltyCharged) : '—'}
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap text-right text-sm tabular-nums">
                        {r.penaltyWaived > 0 ? <span className="text-emerald-600 font-medium">{fmt(r.penaltyWaived)}</span> : <span className="text-slate-400">—</span>}
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap text-right text-sm font-medium text-slate-800 tabular-nums">
                        {fmt(r.remainingBalance)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Page tab config ──────────────────────────────────────────────────────────

const REPORT_TABS = [
  { value: 'billed-vs-collected',    label: 'Billed vs collected' },
  { value: 'total-aging-report',     label: 'Total aging report' },
  { value: 'expected-collections',   label: 'Expected collections' },
  { value: 'late-payment-penalties', label: 'Penalty Summary' },
] as const;

type ReportTabValue = (typeof REPORT_TABS)[number]['value'];

// ─── Page ─────────────────────────────────────────────────────────────────────

export function ReportsPage() {
  const [activeTab, setActiveTab] = useState<ReportTabValue>('billed-vs-collected');

  const activeLabel = REPORT_TABS.find((t) => t.value === activeTab)?.label ?? '';

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <AppSidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top nav bar */}
        <header className="shrink-0 relative z-10 bg-white border-b border-slate-200 px-6 h-14 flex items-center justify-between">
          <nav className="flex items-center gap-1.5 text-sm text-slate-500">
            <span>Dashboard</span>
            <CaretRight size={12} />
            <span className="text-slate-900 font-medium">Reports</span>
            <CaretRight size={12} />
            <span className="text-slate-900 font-medium">{activeLabel}</span>
          </nav>
          <button className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors">
            <BellSimple size={16} />
          </button>
        </header>

        {/* Scrollable content */}
        <main className="flex-1 overflow-y-auto">
          {/* Tab strip */}
          <div className="bg-white border-b border-slate-200 px-6 flex items-center">
            {REPORT_TABS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                className={cn(
                  'inline-flex items-center px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap',
                  activeTab === tab.value
                    ? 'border-violet-600 text-violet-700'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="px-6 py-5">
            {activeTab === 'billed-vs-collected'    && <BilledVsCollectedView />}
            {activeTab === 'total-aging-report'     && <ReportPlaceholderView label="Total aging report" />}
            {activeTab === 'expected-collections'   && <ReportPlaceholderView label="Expected collections" />}
            {activeTab === 'late-payment-penalties' && <PenaltySummaryReportView />}
          </div>
        </main>
      </div>
    </div>
  );
}
