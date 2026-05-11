import React, { useState } from 'react';
import {
  Question,
  DownloadSimple,
  CaretDown,
  CaretRight,
  CalendarBlank,
  ChartBar,
} from '@phosphor-icons/react';
import { Card, CardContent } from './ui/Card';

// ─── SVG Charts ───────────────────────────────────────────────────────────────

function GaugeChart({ percent }: { percent: number }) {
  return (
    <svg width="148" height="90" viewBox="0 0 148 90">
      {/* Track */}
      <path
        d="M 17 76 A 57 57 0 0 1 131 76"
        fill="none"
        stroke="#e2e8f0"
        strokeWidth="11"
        strokeLinecap="round"
      />
      {/* Progress — sweep-flag 1 = clockwise = through top (rainbow arc) */}
      <path
        d="M 17 76 A 57 57 0 0 1 131 76"
        fill="none"
        stroke="#7c3aed"
        strokeWidth="11"
        strokeLinecap="round"
        strokeDasharray={`${(Math.PI * 57 * percent) / 100} ${Math.PI * 57}`}
      />
      {/* Labels */}
      <text x="74" y="63" textAnchor="middle" fontSize="18" fontWeight="700" fill="#1e293b">
        {percent}%
      </text>
      <text x="74" y="78" textAnchor="middle" fontSize="9.5" fill="#94a3b8">
        Amount collected
      </text>
    </svg>
  );
}

function SparklineChart() {
  const raw = [28, 42, 22, 55, 38, 62, 30, 52, 44, 68, 48, 72];
  const W = 148;
  const H = 68;
  const pad = 4;
  const mn = Math.min(...raw);
  const mx = Math.max(...raw);
  const xs = raw.map((_, i) => pad + (i / (raw.length - 1)) * (W - pad * 2));
  const ys = raw.map((v) => H - pad - ((v - mn) / (mx - mn)) * (H - pad * 2));

  const line = xs.map((x, i) => `${i === 0 ? 'M' : 'L'} ${x} ${ys[i]}`).join(' ');
  const area = `${line} L ${xs[xs.length - 1]} ${H} L ${xs[0]} ${H} Z`;

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
      <defs>
        <linearGradient id="sgGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#22c55e" stopOpacity="0.25" />
          <stop offset="60%" stopColor="#eab308" stopOpacity="0.12" />
          <stop offset="100%" stopColor="#eab308" stopOpacity="0.0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#sgGrad)" />
      <path
        d={line}
        fill="none"
        stroke="#22c55e"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ─── Mock data ─────────────────────────────────────────────────────────────────

const MONTHS = ['Sep 2025', 'Oct 2025', 'Nov 2025', 'Dec 2025'];

interface GroupRow {
  name: string;
  periodTotal: number;
  months: number[];
}

const GRAND_TOTAL_MONTHS = [50000, 50000, 50000, 50000];

const GROUP_ROWS: GroupRow[] = [
  { name: 'Metroview Axis Tower', periodTotal: 40000, months: [10000, 10000, 10000, 10000] },
  { name: 'Glasshouse Tower',     periodTotal: 40000, months: [10000, 10000, 10000, 10000] },
  { name: 'Sterling Tower',       periodTotal: 40000, months: [10000, 10000, 10000, 10000] },
  { name: 'Azure Tower',          periodTotal: 40000, months: [10000, 10000, 10000, 10000] },
  { name: 'Summit One Tower',     periodTotal: 40000, months: [10000, 10000, 10000, 10000] },
];

const GRAND_TOTAL_PERIOD = GROUP_ROWS.reduce((s, r) => s + r.periodTotal, 0);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return `₱${n.toLocaleString('en-PH')}`;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function MetricCard({
  label,
  value,
  note,
  chart,
}: {
  label: string;
  value: string;
  note: string;
  chart: React.ReactNode;
}) {
  return (
    <Card className="flex-1">
      <CardContent className="px-5 py-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-1">
              <p className="text-xs font-medium text-slate-500">{label}</p>
              <Question size={13} className="text-slate-400 shrink-0" />
            </div>
            <p className="text-2xl font-bold text-slate-900 leading-none mb-1">{value}</p>
            <p className="text-xs text-green-600 font-medium">{note}</p>
          </div>
          <div className="shrink-0">{chart}</div>
        </div>
      </CardContent>
    </Card>
  );
}

function CollectionsTable() {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50">
            {/* Expand toggle col */}
            <th className="w-10 px-3 py-3" />
            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Customer group
            </th>
            <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Period Total
            </th>
            {MONTHS.map((m) => (
              <th
                key={m}
                className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide"
              >
                {m}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {/* Grand total row */}
          <tr
            className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors"
            onClick={() => setExpanded((p) => !p)}
          >
            <td className="px-3 py-3 text-center text-slate-400">
              {expanded ? (
                <CaretDown size={13} weight="bold" />
              ) : (
                <CaretRight size={13} weight="bold" />
              )}
            </td>
            <td className="px-4 py-3 font-semibold text-slate-800">Grand total</td>
            <td className="px-4 py-3 text-right font-semibold text-slate-800">
              {fmt(GRAND_TOTAL_PERIOD)}
            </td>
            {GRAND_TOTAL_MONTHS.map((v, i) => (
              <td key={i} className="px-4 py-3 text-right font-semibold text-slate-800">
                {fmt(v)}
              </td>
            ))}
          </tr>

          {/* Expanded group rows */}
          {expanded &&
            GROUP_ROWS.map((row) => (
              <tr
                key={row.name}
                className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60 transition-colors"
              >
                <td className="px-3 py-3" />
                <td className="px-4 py-2.5 pl-8 text-slate-700">{row.name}</td>
                <td className="px-4 py-2.5 text-right text-slate-700">{fmt(row.periodTotal)}</td>
                {row.months.map((v, i) => (
                  <td key={i} className="px-4 py-2.5 text-right text-slate-700">
                    {fmt(v)}
                  </td>
                ))}
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Collections content ──────────────────────────────────────────────────────

function CollectionsView() {
  return (
    <div className="space-y-5">
      {/* Overview header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <h2 className="text-base font-semibold text-slate-800">Collections overview</h2>
          <Question size={14} className="text-slate-400" />
        </div>
        <div className="flex items-center gap-2">
          <button className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors shadow-sm">
            View by Month
            <CaretDown size={12} weight="bold" className="text-slate-400" />
          </button>
          <button className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors shadow-sm">
            <DownloadSimple size={13} />
            Excel
          </button>
        </div>
      </div>

      {/* Metric cards */}
      <div className="flex gap-4">
        <MetricCard
          label="Total collections — August 2025"
          value="₱510,000.00"
          note="No prior month to compare"
          chart={<GaugeChart percent={76} />}
        />
        <MetricCard
          label="Total number of invoices paid"
          value="12"
          note="No prior month to compare"
          chart={<SparklineChart />}
        />
      </div>

      {/* Report table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-800">Collections report</h3>
        </div>

        {/* Table controls */}
        <div className="flex items-center gap-2">
          <button className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors shadow-sm">
            <ChartBar size={13} />
            Group by Customer group
            <CaretDown size={12} weight="bold" className="text-slate-400" />
          </button>
          <button className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors shadow-sm">
            <CalendarBlank size={13} />
            Date range
            <CaretDown size={12} weight="bold" className="text-slate-400" />
          </button>
          <span className="text-xs text-slate-500 font-medium">August — December 2025</span>
        </div>

        <CollectionsTable />
      </div>
    </div>
  );
}

// ─── Placeholder sub-tab ──────────────────────────────────────────────────────

function PlaceholderView({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
      <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
        <ChartBar size={22} className="text-slate-300" />
      </div>
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="text-xs text-slate-400">This report is coming soon.</p>
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

const REPORT_TABS = ['Collections', 'Billed vs Collected', 'Aging', 'Expected Collections'] as const;
type ReportTab = (typeof REPORT_TABS)[number];

export default function CustomerReportsTab() {
  const [active, setActive] = useState<ReportTab>('Collections');

  return (
    <div className="space-y-5">
      {/* Sub-tab pill row */}
      <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-100 w-fit">
        {REPORT_TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActive(tab)}
            className={[
              'px-3.5 py-1.5 rounded-md text-xs font-medium transition-all',
              active === tab
                ? 'bg-white text-violet-700 shadow-sm border border-slate-200'
                : 'text-slate-500 hover:text-slate-700',
            ].join(' ')}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {active === 'Collections' && <CollectionsView />}
      {active === 'Billed vs Collected' && <PlaceholderView label="Billed vs Collected" />}
      {active === 'Aging' && <PlaceholderView label="Aging" />}
      {active === 'Expected Collections' && <PlaceholderView label="Expected Collections" />}
    </div>
  );
}
