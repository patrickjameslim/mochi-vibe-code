import React, { useState, useRef, useEffect } from 'react';
import {
  CaretDown,
  CaretRight,
  House,
  Users,
  CreditCard,
  ShoppingBag,
  Cube,
  FileText,
  ChartLine,
  Graph,
  Gear,
  Plus,
  ListBullets,
  AppWindow,
  Wallet,
  ArrowsClockwise,
} from '@phosphor-icons/react';
import mochiLogo from '#/assets/mochi-logo.svg';
import { useNavigate, useLocation } from '@tanstack/react-router';

// ─── Avatar ───────────────────────────────────────────────────────────────────

function Avatar({ initials, color, size = 28 }: { initials: string; color: string; size?: number }) {
  return (
    <span
      className="inline-flex items-center justify-center rounded-full text-white font-semibold shrink-0"
      style={{ width: size, height: size, backgroundColor: color, fontSize: size * 0.38 }}
    >
      {initials}
    </span>
  );
}

// ─── Nav items ────────────────────────────────────────────────────────────────

function NavItem({
  icon,
  label,
  active = false,
  expandable = false,
  expanded = false,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  expandable?: boolean;
  expanded?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={[
        'w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors',
        active
          ? 'bg-violet-50 text-violet-700 font-medium'
          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
      ].join(' ')}
    >
      <span className={active ? 'text-violet-600' : 'text-slate-400'}>{icon}</span>
      <span className="flex-1 text-left">{label}</span>
      {expandable && (
        expanded
          ? <CaretDown  size={12} className="text-slate-400 transition-transform" />
          : <CaretRight size={12} className="text-slate-400 transition-transform" />
      )}
    </button>
  );
}

function SubNavItem({
  icon,
  label,
  active = false,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={[
        'w-full flex items-center gap-2 pl-9 pr-3 py-1.5 rounded-lg text-sm transition-colors',
        active
          ? 'bg-violet-50 text-violet-700 font-medium'
          : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800',
      ].join(' ')}
    >
      <span className={active ? 'text-violet-500' : 'text-slate-400'}>{icon}</span>
      {label}
    </button>
  );
}

// ─── App Switcher Dropdown ────────────────────────────────────────────────────

function AppSwitcher() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 w-full px-5 h-14 border-b border-slate-100 hover:bg-slate-50 transition-colors"
      >
        <img src={mochiLogo} alt="Mochi" className="h-7 w-auto" />
        <CaretDown
          size={14}
          className={['text-slate-400 shrink-0 ml-auto transition-transform', open ? 'rotate-180' : ''].join(' ')}
        />
      </button>

      {open && (
        <div className="absolute top-full left-0 right-0 z-50 bg-white border border-slate-200 rounded-b-xl shadow-lg overflow-hidden">
          <button
            onClick={() => { navigate({ to: '/dashboard' }); setOpen(false); }}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-700 hover:bg-violet-50 hover:text-violet-700 transition-colors"
          >
            <AppWindow size={16} className="text-slate-400" />
            Mochi app
          </button>
          <button
            onClick={() => { navigate({ to: '/payment-portal' }); setOpen(false); }}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-700 hover:bg-violet-50 hover:text-violet-700 transition-colors border-t border-slate-100"
          >
            <Wallet size={16} className="text-slate-400" />
            Payment portal
          </button>
        </div>
      )}
    </div>
  );
}

// ─── AppSidebar ───────────────────────────────────────────────────────────────

export function AppSidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  const pathname = location.pathname;

  const customersActive = pathname.startsWith('/customers');
  const [customersOpen, setCustomersOpen] = useState(customersActive);

  const billingActive = pathname.startsWith('/billings');
  const [billingOpen, setBillingOpen] = useState(billingActive);

  const workflowsActive = pathname.startsWith('/workflows');
  const [workflowsOpen, setWorkflowsOpen] = useState(workflowsActive);

  return (
    <aside className="w-64 shrink-0 bg-white border-r border-slate-200 flex flex-col h-screen sticky top-0">
      <AppSwitcher />

      <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
        <NavItem
          icon={<House size={18} />}
          label="Dashboard"
          active={pathname === '/dashboard'}
          onClick={() => navigate({ to: '/dashboard' })}
        />

        {/* ── Customers (expandable) ── */}
        <NavItem
          icon={<Users size={18} />}
          label="Customers"
          active={customersActive}
          expandable
          expanded={customersOpen}
          onClick={() => setCustomersOpen((o) => !o)}
        />
        {customersOpen && (
          <div className="space-y-0.5">
            <SubNavItem
              icon={<ListBullets size={12} />}
              label="Manage customers"
              active={pathname === '/customers' || (pathname.startsWith('/customers/') && !pathname.endsWith('/create'))}
              onClick={() => navigate({ to: '/customers' })}
            />
            <SubNavItem
              icon={<Plus size={12} weight="bold" />}
              label="Create customer"
              active={pathname === '/customers/create'}
              onClick={() => navigate({ to: '/customers/create' })}
            />
          </div>
        )}

        {/* ── Bills (expandable) ── */}
        <NavItem
          icon={<CreditCard size={18} />}
          label="Bills"
          active={billingActive}
          expandable
          expanded={billingOpen}
          onClick={() => setBillingOpen((o) => !o)}
        />
        {billingOpen && (
          <div className="space-y-0.5">
            <SubNavItem
              icon={<ListBullets size={12} />}
              label="Billing"
              active={pathname === '/billings'}
              onClick={() => navigate({ to: '/billings' })}
            />
            <SubNavItem
              icon={<ArrowsClockwise size={12} />}
              label="Recurring billing"
              active={pathname === '/billings/recurring'}
              onClick={() => navigate({ to: '/billings/recurring' })}
            />
            <SubNavItem
              icon={<Plus size={12} weight="bold" />}
              label="Create bill"
              active={pathname === '/billings/create'}
              onClick={() => navigate({ to: '/billings/create' })}
            />
          </div>
        )}

        <NavItem icon={<ShoppingBag size={18} />} label="Orders"    expandable />
        <NavItem icon={<Cube size={18} />}        label="Catalog"   expandable />
        <NavItem icon={<FileText size={18} />}    label="Forms" />
        <NavItem
          icon={<ChartLine size={18} />}
          label="Reports"
          active={pathname === '/reports'}
          onClick={() => navigate({ to: '/reports' })}
        />
        {/* ── Workflows (expandable) ── */}
        <NavItem
          icon={<Graph size={18} />}
          label="Workflows"
          active={workflowsActive}
          expandable
          expanded={workflowsOpen}
          onClick={() => setWorkflowsOpen((o) => !o)}
        />
        {workflowsOpen && (
          <div className="space-y-0.5">
            <SubNavItem
              icon={<ListBullets size={12} />}
              label="Email Templates"
              active={pathname === '/workflows'}
              onClick={() => navigate({ to: '/workflows' })}
            />
          </div>
        )}
        <NavItem
          icon={<Gear size={18} />}
          label="Settings"
          active={pathname === '/settings'}
          onClick={() => navigate({ to: '/settings' })}
        />
      </nav>

      <div className="border-t border-slate-100 px-3 py-3 flex items-center gap-2">
        <Avatar initials="JD" color="#6D41E8" size={32} />
        <div className="min-w-0">
          <p className="text-xs font-medium text-slate-900 truncate">Juan A. Dela Cruz</p>
          <p className="text-xs text-slate-500 truncate">juandelacruz@gmail.com</p>
        </div>
        <CaretDown size={14} className="ml-auto text-slate-400 shrink-0" />
      </div>
    </aside>
  );
}
