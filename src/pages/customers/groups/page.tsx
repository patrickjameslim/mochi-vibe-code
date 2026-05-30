import React, { useState } from 'react';
import {
  CaretDown,
  DownloadSimple,
  Copy,
  DotsThreeVertical,
  PencilSimple,
  UsersThree,
  Archive,
} from '@phosphor-icons/react';
import { Customer } from '#/data/customers';
import { GROUP_STATS, GroupStat } from '#/data/customerGroups';
import { Tooltip, TooltipTrigger, TooltipContent } from '#/components/atoms/Tooltip';
import { SortTh } from '#/components/molecules/SortTh';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '#/components/atoms/DropdownMenu';

// ─── Shared helpers ───────────────────────────────────────────────────────────
function Highlight({ text, query }: { text: string; query: string }) {
  const q = query.trim().toLowerCase();
  if (!q) return <>{text}</>;

  const parts: { str: string; match: boolean }[] = [];
  const lower = text.toLowerCase();
  let last = 0;
  let idx = lower.indexOf(q, last);
  while (idx !== -1) {
    if (idx > last) parts.push({ str: text.slice(last, idx), match: false });
    parts.push({ str: text.slice(idx, idx + q.length), match: true });
    last = idx + q.length;
    idx = lower.indexOf(q, last);
  }
  if (last < text.length) parts.push({ str: text.slice(last), match: false });

  return (
    <>
      {parts.map((p, i) =>
        p.match ? (
          <mark key={i} className="bg-yellow-200 text-yellow-900 rounded px-0.5 not-italic">
            {p.str}
          </mark>
        ) : (
          <span key={i}>{p.str}</span>
        )
      )}
    </>
  );
}

function Avatar({ initials, color, size = 26 }: { initials: string; color: string; size?: number }) {
  return (
    <span
      className="inline-flex items-center justify-center rounded-full text-white font-semibold shrink-0"
      style={{ width: size, height: size, backgroundColor: color, fontSize: size * 0.38 }}
    >
      {initials}
    </span>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────
interface Props {
  customers: Customer[];
  customerGroups: Record<string, string[]>;
  onAssignGroups: (customer: Customer) => void;
  searchQuery?: string;
}

export function CustomerGroupsPage({
  customers,
  customerGroups,
  onAssignGroups,
  searchQuery = '',
}: Props) {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const q = searchQuery.trim().toLowerCase();

  function toggleGroup(name: string) {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      next.has(name) ? next.delete(name) : next.add(name);
      return next;
    });
  }

  function toggleAll() {
    const allExpanded = rows.length > 0 && rows.every((g) => expandedGroups.has(g.name));
    setExpandedGroups(allExpanded ? new Set() : new Set(rows.map((g) => g.name)));
  }

  function getGroupCustomers(groupName: string): Customer[] {
    return customers.filter((c) => {
      const groups = customerGroups[c.id] ?? [c.group];
      return groups.includes(groupName);
    });
  }

  function customerMatchesQuery(c: Customer): boolean {
    return (
      c.name.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      c.id.toLowerCase().includes(q)
    );
  }

  // Combine static stats with any dynamically added groups
  const allGroupNames = Array.from(
    new Set([
      ...GROUP_STATS.map((g) => g.name),
      ...Object.values(customerGroups).flat(),
    ])
  ).sort();

  const allRows: GroupStat[] = allGroupNames.map(
    (name) =>
      GROUP_STATS.find((g) => g.name === name) ?? {
        name,
        amountCollected: '—',
        totalAmountDue: '—',
      }
  );

  // Filter groups: show if group name contains query OR any customer inside matches
  const rows = q
    ? allRows.filter((group) => {
        const groupNameMatches = group.name.toLowerCase().includes(q);
        const hasMatchingCustomer = getGroupCustomers(group.name).some(customerMatchesQuery);
        return groupNameMatches || hasMatchingCustomer;
      })
    : allRows;

  // Auto-expand when group name matches OR a customer inside matches
  function isGroupExpanded(groupName: string): boolean {
    if (expandedGroups.has(groupName)) return true;
    if (!q) return false;
    if (groupName.toLowerCase().includes(q)) return true;
    return getGroupCustomers(groupName).some(customerMatchesQuery);
  }

  // When group name matched → show all customers; when customer matched → show only matching ones
  function getVisibleSubRows(groupName: string): Customer[] {
    const all = getGroupCustomers(groupName);
    if (!q) return all;
    if (groupName.toLowerCase().includes(q)) return all;
    return all.filter(customerMatchesQuery);
  }

  return (
    <div className="overflow-x-hidden">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 border-b border-slate-100">
          <tr>
            <th className="w-10 px-3 py-2.5 text-center">
              <button
                onClick={toggleAll}
                className="inline-flex items-center justify-center w-7 h-7 rounded text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
              >
                <CaretDown
                  size={14}
                  weight="bold"
                  className={[
                    'transition-transform duration-200',
                    rows.length > 0 && rows.every((g) => expandedGroups.has(g.name)) ? 'rotate-180' : '',
                  ].join(' ')}
                />
              </button>
            </th>
            <SortTh>Customer group</SortTh>
            <SortTh>Total customers</SortTh>
            <SortTh>Amount collected</SortTh>
            <SortTh>Total amount due</SortTh>
            <SortTh>Quick actions</SortTh>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.length === 0 && (
            <tr>
              <td colSpan={6} className="px-4 py-8 text-center text-sm text-slate-400">
                No customer groups match your search.
              </td>
            </tr>
          )}
          {rows.map((group) => {
            const expanded = isGroupExpanded(group.name);
            const groupCustomers = getGroupCustomers(group.name);
            const visibleSubRows = getVisibleSubRows(group.name);

            return (
              <React.Fragment key={group.name}>
                {/* Group row */}
                <tr
                  className={[
                    'transition-colors hover:bg-slate-50',
                    expanded ? 'bg-slate-50' : '',
                  ].join(' ')}
                >
                  {/* Caret toggle */}
                  <td className="px-3 py-2.5 text-center">
                    <button
                      onClick={() => toggleGroup(group.name)}
                      className="inline-flex items-center justify-center w-7 h-7 rounded text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                    >
                      <CaretDown
                        size={14}
                        weight="bold"
                        className={[
                          'transition-transform duration-200',
                          expanded ? 'rotate-180' : '',
                        ].join(' ')}
                      />
                    </button>
                  </td>

                  {/* Group name */}
                  <td className="px-4 py-2.5 font-medium text-slate-900 whitespace-nowrap">
                    <Highlight text={group.name} query={q} />
                  </td>

                  {/* Total customers */}
                  <td className="px-4 py-2.5 text-slate-600">
                    {groupCustomers.length}
                  </td>

                  {/* Amount collected */}
                  <td className="px-4 py-2.5 text-slate-600">
                    {group.amountCollected}
                  </td>

                  {/* Total amount due */}
                  <td className="px-4 py-2.5 text-slate-600 font-medium">
                    {group.totalAmountDue}
                  </td>

                  {/* Quick actions */}
                  <td className="px-4 py-2.5">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button className="inline-flex items-center justify-center w-7 h-7 rounded border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors">
                          <DownloadSimple size={15} />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>Download</TooltipContent>
                    </Tooltip>
                  </td>
                </tr>

                {/* Expanded: empty state */}
                {expanded && visibleSubRows.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-4 text-center text-sm text-slate-400 bg-slate-50/60"
                    >
                      No customers in this group yet.
                    </td>
                  </tr>
                )}

                {/* Expanded: customer sub-rows */}
                {expanded &&
                  visibleSubRows.map((customer) => (
                    <CustomerSubRow
                      key={`${group.name}-${customer.id}`}
                      customer={customer}
                      query={q}
                      onAssignGroups={() => onAssignGroups(customer)}
                    />
                  ))}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}


// ─── Expanded sub-row ─────────────────────────────────────────────────────────
function CustomerSubRow({
  customer,
  query = '',
  onAssignGroups,
}: {
  customer: Customer;
  query?: string;
  onAssignGroups: () => void;
}) {
  return (
    <tr className="bg-violet-50/30 border-l-2 border-l-violet-200 hover:bg-violet-50/50 transition-colors">
      <td className="w-10" />

      {/* Name + avatar */}
      <td className="px-4 py-2.5 whitespace-nowrap">
        <div className="flex items-center gap-2">
          <Avatar initials={customer.avatarInitials} color={customer.avatarColor} />
          <button className="text-violet-600 hover:text-violet-800 hover:underline font-medium text-sm">
            <Highlight text={customer.name} query={query} />
          </button>
        </div>
      </td>

      {/* Type */}
      <td className="px-4 py-2.5 text-slate-600 text-sm">{customer.type}</td>

      {/* Email */}
      <td className="px-4 py-2.5 text-slate-600 text-sm">
        <Highlight text={customer.email} query={query} />
      </td>

      {/* Phone */}
      <td className="px-4 py-2.5 text-slate-600 text-sm">
        <Highlight text={customer.phoneNumber} query={query} />
      </td>

      {/* Quick actions */}
      <td className="px-4 py-2.5">
        <div className="flex items-center gap-1.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <button className="inline-flex items-center justify-center w-7 h-7 rounded border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors">
                <Copy size={14} />
              </button>
            </TooltipTrigger>
            <TooltipContent>Duplicate</TooltipContent>
          </Tooltip>
          <DropdownMenu>
            <DropdownMenuTrigger className="inline-flex items-center justify-center w-7 h-7 rounded text-slate-500 hover:bg-slate-100 transition-colors outline-none">
              <DotsThreeVertical size={15} weight="bold" />
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem>
                <PencilSimple size={14} className="text-slate-400" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={onAssignGroups}>
                <UsersThree size={14} className="text-slate-400" />
                Assign groups
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Copy size={14} className="text-slate-400" />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem destructive>
                <Archive size={14} />
                Archive
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </td>
    </tr>
  );
}
