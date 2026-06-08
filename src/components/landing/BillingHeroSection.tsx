import React from 'react';
import './BillingHeroSection.css';

const statusBadges: {
  label: string;
  className: string;
}[] = [
  { label: 'Paid', className: 'badge-paid' },
  { label: 'Overdue', className: 'badge-overdue' },
  { label: 'Draft', className: 'badge-draft' },
  { label: 'Sent', className: 'badge-sent' },
  { label: 'Scheduled', className: 'badge-scheduled' },
  { label: 'Verifying', className: 'badge-verifying' },
];

const mockBills = [
  { id: 'INV-000016', amount: '₱ 9.48',   issued: 'Nov 11, 2025', due: 'Nov 11, 2025', customer: 'ADASD SADSD', status: 'Verifying',  statusClass: 'badge-verifying'  },
  { id: 'INV-000020', amount: '₱ 12.00',  issued: 'Apr 27, 2026', due: 'May 27, 2026', customer: 'Princess',    status: 'Draft',      statusClass: 'badge-draft'      },
  { id: 'INV-000009', amount: '₱ 5,000',  issued: 'Aug 14, 2025', due: 'Sep 13, 2025', customer: 'travel & tours', status: 'Overdue', statusClass: 'badge-overdue'    },
  { id: 'INV-000015', amount: '₱ 2.52',   issued: 'Nov 11, 2025', due: 'Nov 11, 2025', customer: 'ADASD SADSD', status: 'Paid',       statusClass: 'badge-paid'       },
  { id: 'INV-000018', amount: '₱ 9.48',   issued: 'Nov 11, 2025', due: 'Nov 11, 2025', customer: 'ADASD SADSD', status: 'Sent',       statusClass: 'badge-sent'       },
  { id: 'INV-000010', amount: '₱ 5,000',  issued: 'Oct 9, 2025',  due: 'Nov 8, 2025',  customer: 'travel & tours', status: 'Scheduled', statusClass: 'badge-scheduled' },
];

const featureBullets = [
  'See bill status at a glance — Draft, Sent, Overdue, Paid, and more',
  'Filter and search across all your clients',
  'Create, send, and manage bills in minutes',
];

const BillingHeroSection: React.FC = () => {
  return (
    <section className="billing-hero">
      {/* ── Left: Copy ─────────────────────────────────────────── */}
      <div className="billing-hero__copy">
        <h1 className="billing-hero__headline">All your bills. One place.</h1>
        <p className="billing-hero__subheadline">
          Track every bill from draft to paid — no spreadsheets, no follow-up chaos.
        </p>

        <ul className="billing-hero__bullets">
          {featureBullets.map((b) => (
            <li key={b} className="billing-hero__bullet">
              <span className="billing-hero__bullet-dot" />
              {b}
            </li>
          ))}
        </ul>

        {/* Status badge legend */}
        <div className="billing-hero__badges">
          {statusBadges.map((s) => (
            <span key={s.label} className={`billing-badge ${s.className}`}>
              {s.label}
            </span>
          ))}
        </div>
      </div>

      {/* ── Right: Floating Dashboard Mock ─────────────────────── */}
      <div className="billing-hero__visual">
        <div className="billing-dashboard">
          {/* Action bar */}
          <div className="billing-dashboard__topbar">
            <div className="billing-dashboard__title-area">
              <span className="billing-dashboard__title">Billing</span>
              <div className="billing-dashboard__tabs">
                <span className="tab tab--active">All (19)</span>
                <span className="tab">Draft (1)</span>
                <span className="tab">Overdue (6)</span>
                <span className="tab">Paid (7)</span>
                <span className="tab">Sent (0)</span>
                <span className="tab">Verifying (4)</span>
              </div>
            </div>
            <div className="billing-dashboard__actions">
              <button className="btn-ghost">Export data</button>
              <button className="btn-ghost">Bulk create bills</button>
              <button className="btn-primary">Create a new bill</button>
            </div>
          </div>

          {/* Search bar */}
          <div className="billing-dashboard__search">
            <span className="search-icon">🔍</span>
            <span className="search-placeholder">Enter a billing ID or customer</span>
            <span className="filter-btn">⊟ Filter</span>
          </div>

          {/* Table */}
          <table className="billing-table">
            <thead>
              <tr>
                <th>Status</th>
                <th>Bill ID</th>
                <th>Amount</th>
                <th>Date of issue</th>
                <th>Due date</th>
                <th>Customer</th>
              </tr>
            </thead>
            <tbody>
              {mockBills.map((bill) => (
                <tr key={bill.id}>
                  <td>
                    <span className={`billing-badge ${bill.statusClass}`}>
                      {bill.status}
                    </span>
                  </td>
                  <td className="bill-id">{bill.id}</td>
                  <td>{bill.amount}</td>
                  <td>{bill.issued}</td>
                  <td>{bill.due}</td>
                  <td>{bill.customer}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          <div className="billing-dashboard__pagination">
            <span className="page-arrow">‹</span>
            <span className="page-num page-num--active">1</span>
            <span className="page-num">2</span>
            <span className="page-arrow">›</span>
          </div>
        </div>

        {/* Floating invoice card */}
        <div className="floating-invoice">
          <div className="invoice-header">
            <span className="invoice-label">Billing Statement</span>
            <span className="invoice-amount">PHP 44,050.00</span>
          </div>
          <div className="invoice-row">
            <span>Social Media Management</span>
            <span>PHP 10,000.00</span>
          </div>
          <div className="invoice-row">
            <span>Paid Ads Management</span>
            <span>PHP 14,250.00</span>
          </div>
          <div className="invoice-row">
            <span>Event Marketing &amp; Coverage</span>
            <span>PHP 20,000.00</span>
          </div>
          <div className="invoice-total">
            <span>Amount due</span>
            <span className="invoice-total-amount">PHP 44,050.00</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default BillingHeroSection;
