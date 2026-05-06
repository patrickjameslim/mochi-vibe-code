import React from 'react';
import {
  CaretDown,
  House,
  Users,
  CreditCard,
  ShoppingBag,
  Cube,
  FileText,
  ChartLine,
  Graph,
  Gear,
} from '@phosphor-icons/react';
import mochiLogo from '../assets/mochi-logo.svg';

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

function NavItem({
  icon,
  label,
  active = false,
  expandable = false,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  expandable?: boolean;
}) {
  return (
    <button
      className={[
        'w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors',
        active
          ? 'bg-violet-50 text-violet-700 font-medium'
          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
      ].join(' ')}
    >
      <span className={active ? 'text-violet-600' : 'text-gray-400'}>{icon}</span>
      <span className="flex-1 text-left">{label}</span>
      {expandable && <CaretDown size={12} className="text-gray-400" />}
    </button>
  );
}

export function Sidebar() {
  return (
    <aside className="w-56 shrink-0 bg-white border-r border-gray-200 flex flex-col h-screen sticky top-0">
      <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100">
        <img src={mochiLogo} alt="Mochi" className="h-7 w-auto" />
        <CaretDown size={14} className="text-gray-400 shrink-0" />
      </div>

      <nav className="flex-1 overflow-y-auto p-2 space-y-0.5">
        <NavItem icon={<House size={16} />}      label="Dashboard" />
        <NavItem icon={<Users size={16} />}       label="Customers" active />
        <NavItem icon={<CreditCard size={16} />}  label="Billing"   expandable />
        <NavItem icon={<ShoppingBag size={16} />} label="Orders"    expandable />
        <NavItem icon={<Cube size={16} />}        label="Catalog"   expandable />
        <NavItem icon={<FileText size={16} />}    label="Forms" />
        <NavItem icon={<ChartLine size={16} />}   label="Reports" />
        <NavItem icon={<Graph size={16} />}       label="Workflows" />
        <NavItem icon={<Gear size={16} />}        label="Settings" />
      </nav>

      <div className="border-t border-gray-100 px-3 py-3 flex items-center gap-2">
        <Avatar initials="JD" color="#6366f1" size={30} />
        <div className="min-w-0">
          <p className="text-xs font-medium text-gray-900 truncate">Juan A. Dela Cruz</p>
          <p className="text-xs text-gray-500 truncate">juandelacruz@gmail.com</p>
        </div>
        <CaretDown size={14} className="ml-auto text-gray-400 shrink-0" />
      </div>
    </aside>
  );
}
