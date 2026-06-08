import React, { useState, useEffect, useRef } from 'react';
import './BillingHeroSection.css';

const TAB_DURATION = 8000;

const featureCards = [
  {
    id: 1,
    title: 'Error-free, automated invoicing',
    description: 'Automate invoicing for your small business in the Philippines! Create and send invoices effortlessly, reducing manual work and errors.',
  },
  {
    id: 2,
    title: 'Provide options for digital payments',
    description: 'Ensure secure, safe, and fast transactions every time.',
  },
  {
    id: 3,
    title: 'Simplify order management',
    description: 'Ideal for businesses that handle bookings and payments. Manage your cash flow with Mochi\'s powerful tools for invoicing, reporting, and more.',
  },
  {
    id: 4,
    title: 'Never forget recurring billing',
    description: 'Set up recurring invoices for regular clients, ensuring timely payments without manual intervention.',
  },
  {
    id: 5,
    title: 'Effortless installment billing',
    description: 'Create a flexible payment plan for your customers! Deliver a seamless and convenient payment experience for your clients.',
  },
];

// ── Panel 1: Automated Invoicing ─────────────────────────────────────────────
const Panel1 = () => (
  <div className="fp-wrap">
    {/* Mochi header bar */}
    <div className="fp-bar">
      <div className="fp-bar__logo"><span className="fp-bar__m">m</span>ochi</div>
    </div>

    {/* Create Single Invoice card */}
    <div className="fp-create-card">
      <div className="fp-create-card__text">
        <div className="fp-create-card__title">Create Single Invoice</div>
        <div className="fp-create-card__sub">Send a one-time billing to a customer</div>
      </div>
      <div className="fp-create-card__art">
        <div className="fp-art-doc">
          <div className="fp-art-line" />
          <div className="fp-art-line fp-art-line--short" />
          <div className="fp-art-line" />
          <div className="fp-art-line fp-art-line--short" />
        </div>
        <div className="fp-art-sparkle">✦</div>
      </div>
    </div>

    {/* Billing form preview */}
    <div className="fp-billing-form">
      <div className="fp-billing-form__header">
        <span className="fp-billing-form__title">Billing</span>
        <div className="fp-bar__logo fp-bar__logo--sm"><span className="fp-bar__m">m</span>ochi</div>
      </div>
      <div className="fp-billing-form__row">
        <div className="fp-field-box">
          <div className="fp-field-label">BILL TO</div>
          <div className="fp-field-bar fp-field-bar--lg" />
          <div className="fp-field-bar" />
          <div className="fp-field-bar fp-field-bar--sm" />
        </div>
        <div className="fp-field-box">
          <div className="fp-field-label">FROM</div>
          <div className="fp-field-bar fp-field-bar--lg" />
          <div className="fp-field-bar fp-field-bar--sm" />
        </div>
      </div>
      <div className="fp-billing-form__row fp-billing-form__row--4">
        {['Invoice number','Date of Issue','Purchase order number','Due Date','Order Number','Payment Terms'].map((f) => (
          <div key={f} className="fp-mini-field">
            <div className="fp-mini-label">{f}</div>
            <div className="fp-field-bar fp-field-bar--sm" />
          </div>
        ))}
      </div>
    </div>

    {/* Status card */}
    <div className="fp-status-card">
      <div className="fp-status-card__title">STATUS</div>
      {[
        { label: 'Draft',     cls: 'badge-draft'     },
        { label: 'OVERDUE',   cls: 'badge-overdue'   },
        { label: 'PAID',      cls: 'badge-paid'      },
        { label: 'Scheduled', cls: 'badge-scheduled' },
        { label: 'SENT',      cls: 'badge-sent'      },
        { label: 'Verifying', cls: 'badge-verifying' },
      ].map((s) => (
        <span key={s.label} className={`bhs__badge ${s.cls} fp-status-badge`}>{s.label}</span>
      ))}
    </div>

    {/* Billing table */}
    <div className="fp-billing-table">
      <div className="fp-billing-table__title">Billing</div>
      <table className="fp-table">
        <thead>
          <tr>
            <th>Status</th>
            <th>Invoice No.</th>
            <th>Invoice Amount</th>
            <th>Date of Issue</th>
            <th>Due Date</th>
          </tr>
        </thead>
        <tbody>
          {[
            { status: 'VERIFYING', cls: 'badge-verifying', inv: 'INV-00005', amt: 'PHP 20,000', issue: 'Aug 6, 2025',  due: 'Sep 5, 2025'  },
            { status: 'DRAFT',     cls: 'badge-draft',     inv: 'INV-00004', amt: 'PHP 2,000',  issue: '—',            due: 'Sep 4, 2025'  },
            { status: 'PAID',      cls: 'badge-paid',      inv: 'INV-00004', amt: 'PHP 12,000', issue: '—',            due: 'Aug 22, 2025' },
            { status: 'SENT',      cls: 'badge-sent',      inv: 'INV-00003', amt: 'PHP 10,000', issue: '—',            due: 'Aug 20, 2025' },
          ].map((r) => (
            <tr key={r.inv + r.status}>
              <td><span className={`bhs__badge ${r.cls}`}>{r.status}</span></td>
              <td className="fp-inv-id">{r.inv}</td>
              <td>{r.amt}</td>
              <td>{r.issue}</td>
              <td>{r.due}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

// ── Panel 2: Digital Payments ────────────────────────────────────────────────
const Panel2 = () => (
  <div className="fp-wrap">
    <div className="fp-bar">
      <div className="fp-bar__logo"><span className="fp-bar__m">m</span>ochi</div>
    </div>
    <div className="fp-create-card">
      <div className="fp-create-card__text">
        <div className="fp-create-card__title">Payment Methods</div>
        <div className="fp-create-card__sub">Activate payment channels for your customers</div>
      </div>
    </div>
    <div className="fp-billing-form" style={{ padding: '18px 20px' }}>
      <div className="fp-billing-form__title" style={{ marginBottom: 14 }}>Active Channels</div>
      <div className="fp-pay-grid">
        {[
          { name: 'GCash',        color: '#0070f3', active: true  },
          { name: 'Credit Card',  color: '#7c3aed', active: true  },
          { name: 'QR PH',        color: '#059669', active: true  },
          { name: 'PayMongo',     color: '#6d28d9', active: false },
          { name: 'Bank Transfer',color: '#1d4ed8', active: true  },
          { name: 'BDO Online',   color: '#c2410c', active: false },
        ].map((p) => (
          <div key={p.name} className={`fp-pay-card ${p.active ? 'fp-pay-card--on' : ''}`}>
            <div className="fp-pay-icon" style={{ background: p.color }}>{p.name[0]}</div>
            <div className="fp-pay-name">{p.name}</div>
            <div className={`fp-toggle ${p.active ? 'fp-toggle--on' : ''}`} />
          </div>
        ))}
      </div>
    </div>
    <div className="fp-status-card">
      <div className="fp-status-card__title">STATUS</div>
      {[
        { label: 'Draft',     cls: 'badge-draft'     },
        { label: 'OVERDUE',   cls: 'badge-overdue'   },
        { label: 'PAID',      cls: 'badge-paid'      },
        { label: 'Scheduled', cls: 'badge-scheduled' },
        { label: 'SENT',      cls: 'badge-sent'      },
        { label: 'Verifying', cls: 'badge-verifying' },
      ].map((s) => (
        <span key={s.label} className={`bhs__badge ${s.cls} fp-status-badge`}>{s.label}</span>
      ))}
    </div>
  </div>
);

// ── Panel 3: Order Management ────────────────────────────────────────────────
const Panel3 = () => (
  <div className="fp-wrap">
    <div className="fp-bar">
      <div className="fp-bar__logo"><span className="fp-bar__m">m</span>ochi</div>
    </div>
    <div className="fp-create-card">
      <div className="fp-create-card__text">
        <div className="fp-create-card__title">Order Management</div>
        <div className="fp-create-card__sub">Track bookings, payments, and reports in one place</div>
      </div>
    </div>
    <div className="fp-billing-table" style={{ top: 'auto', right: 'auto', position: 'relative', maxWidth: '100%' }}>
      <div className="fp-billing-table__title">Orders</div>
      <table className="fp-table">
        <thead>
          <tr>
            <th>Status</th>
            <th>Order ID</th>
            <th>Customer</th>
            <th>Amount</th>
            <th>Due Date</th>
          </tr>
        </thead>
        <tbody>
          {[
            { status: 'PAID',      cls: 'badge-paid',      id: 'ORD-0041', cust: 'Travel & Tours', amt: 'PHP 25,000', due: 'Jun 1, 2026'  },
            { status: 'PENDING',   cls: 'badge-scheduled', id: 'ORD-0040', cust: 'Princess Acad.', amt: 'PHP 8,500',  due: 'Jun 5, 2026'  },
            { status: 'PAID',      cls: 'badge-paid',      id: 'ORD-0039', cust: 'Ana Villanueva', amt: 'PHP 44,050', due: 'Jun 10, 2026' },
            { status: 'CANCELLED', cls: 'badge-overdue',   id: 'ORD-0038', cust: 'ADASD Corp',     amt: 'PHP 3,200',  due: '—'            },
          ].map((r) => (
            <tr key={r.id}>
              <td><span className={`bhs__badge ${r.cls}`}>{r.status}</span></td>
              <td className="fp-inv-id">{r.id}</td>
              <td>{r.cust}</td>
              <td>{r.amt}</td>
              <td>{r.due}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    <div className="fp-status-card">
      <div className="fp-status-card__title">STATUS</div>
      {[
        { label: 'Draft',     cls: 'badge-draft'     },
        { label: 'OVERDUE',   cls: 'badge-overdue'   },
        { label: 'PAID',      cls: 'badge-paid'      },
        { label: 'Scheduled', cls: 'badge-scheduled' },
        { label: 'SENT',      cls: 'badge-sent'      },
        { label: 'Verifying', cls: 'badge-verifying' },
      ].map((s) => (
        <span key={s.label} className={`bhs__badge ${s.cls} fp-status-badge`}>{s.label}</span>
      ))}
    </div>
  </div>
);

// ── Panel 4: Recurring Billing ───────────────────────────────────────────────
const Panel4 = () => (
  <div className="fp-wrap">
    <div className="fp-bar">
      <div className="fp-bar__logo"><span className="fp-bar__m">m</span>ochi</div>
    </div>
    <div className="fp-create-card">
      <div className="fp-create-card__text">
        <div className="fp-create-card__title">Recurring Billing</div>
        <div className="fp-create-card__sub">Auto-send invoices on schedule, every time</div>
      </div>
    </div>
    <div className="fp-billing-form" style={{ padding: '16px 20px' }}>
      <div className="fp-billing-form__title" style={{ marginBottom: 12 }}>Active Schedules</div>
      {[
        { client: 'Travel & Tours Co.',  amount: '₱5,000/mo',  next: 'Jun 1, 2026',  status: 'Active', cls: 'badge-paid'  },
        { client: 'Princess Academy',    amount: '₱12,000/mo', next: 'Jun 5, 2026',  status: 'Active', cls: 'badge-paid'  },
        { client: 'Ana Villanueva',      amount: '₱44,050/mo', next: 'Jun 10, 2026', status: 'Paused', cls: 'badge-draft' },
        { client: 'ADASD Corp',          amount: '₱3,500/mo',  next: 'Jun 15, 2026', status: 'Active', cls: 'badge-paid'  },
      ].map((r) => (
        <div key={r.client} className="fp-recur-row">
          <div className="fp-recur-avatar">{r.client[0]}</div>
          <div className="fp-recur-info">
            <div className="fp-recur-name">{r.client}</div>
            <div className="fp-recur-next">Next: {r.next}</div>
          </div>
          <div className="fp-recur-right">
            <div className="fp-recur-amount">{r.amount}</div>
            <span className={`bhs__badge ${r.cls}`}>{r.status}</span>
          </div>
        </div>
      ))}
    </div>
    <div className="fp-status-card">
      <div className="fp-status-card__title">STATUS</div>
      {[
        { label: 'Draft',     cls: 'badge-draft'     },
        { label: 'OVERDUE',   cls: 'badge-overdue'   },
        { label: 'PAID',      cls: 'badge-paid'      },
        { label: 'Scheduled', cls: 'badge-scheduled' },
        { label: 'SENT',      cls: 'badge-sent'      },
        { label: 'Verifying', cls: 'badge-verifying' },
      ].map((s) => (
        <span key={s.label} className={`bhs__badge ${s.cls} fp-status-badge`}>{s.label}</span>
      ))}
    </div>
  </div>
);

// ── Panel 5: Installment Billing ─────────────────────────────────────────────
const Panel5 = () => (
  <div className="fp-wrap">
    <div className="fp-bar">
      <div className="fp-bar__logo"><span className="fp-bar__m">m</span>ochi</div>
    </div>
    <div className="fp-create-card">
      <div className="fp-create-card__text">
        <div className="fp-create-card__title">Installment Plan</div>
        <div className="fp-create-card__sub">Split payments into flexible schedules</div>
      </div>
    </div>
    <div className="fp-billing-form" style={{ padding: '16px 20px' }}>
      <div className="fp-instalment-head">
        <span className="fp-billing-form__title">Billing Statement</span>
        <span className="fp-instalment-total">Total: PHP 44,050.00</span>
      </div>
      <div className="fp-plan-tabs">
        {['2 months', '3 months', '6 months'].map((p, i) => (
          <span key={p} className={`fp-plan-tab ${i === 1 ? 'fp-plan-tab--active' : ''}`}>{p}</span>
        ))}
      </div>
      {[
        { n: 1, date: 'May 30, 2026', amt: 'PHP 14,683.34', cls: 'badge-scheduled' },
        { n: 2, date: 'Jun 30, 2026', amt: 'PHP 14,683.33', cls: 'badge-scheduled' },
        { n: 3, date: 'Jul 30, 2026', amt: 'PHP 14,683.33', cls: 'badge-scheduled' },
      ].map((s) => (
        <div key={s.n} className="fp-inst-row">
          <div className="fp-inst-num">{s.n}</div>
          <div className="fp-inst-date">{s.date}</div>
          <div className="fp-inst-amt">{s.amt}</div>
          <span className={`bhs__badge ${s.cls}`}>Upcoming</span>
        </div>
      ))}
      <div className="fp-inst-summary">
        <span>Per installment</span><strong>PHP 14,683.33</strong>
      </div>
    </div>
    <div className="fp-status-card">
      <div className="fp-status-card__title">STATUS</div>
      {[
        { label: 'Draft',     cls: 'badge-draft'     },
        { label: 'OVERDUE',   cls: 'badge-overdue'   },
        { label: 'PAID',      cls: 'badge-paid'      },
        { label: 'Scheduled', cls: 'badge-scheduled' },
        { label: 'SENT',      cls: 'badge-sent'      },
        { label: 'Verifying', cls: 'badge-verifying' },
      ].map((s) => (
        <span key={s.label} className={`bhs__badge ${s.cls} fp-status-badge`}>{s.label}</span>
      ))}
    </div>
  </div>
);

const PANELS = [Panel1, Panel2, Panel3, Panel4, Panel5];

// ── Main component ────────────────────────────────────────────────────────────
const BillingHeroSection: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [progress, setProgress] = useState(0);
  const startTimeRef = useRef<number>(Date.now());
  const rafRef = useRef<number>(0);

  const goToTab = (index: number) => {
    setActiveTab(index);
    setProgress(0);
    startTimeRef.current = Date.now();
  };

  useEffect(() => {
    const tick = () => {
      const elapsed = Date.now() - startTimeRef.current;
      const pct = Math.min((elapsed / TAB_DURATION) * 100, 100);
      setProgress(pct);
      if (pct >= 100) {
        const next = (activeTab + 1) % featureCards.length;
        setActiveTab(next);
        setProgress(0);
        startTimeRef.current = Date.now();
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [activeTab]);

  const ActivePanel = PANELS[activeTab];

  return (
    <section className="bhs">
      {/* ── Header ── */}
      <div className="bhs__header">
        <h2 className="bhs__headline">Best billing software for Filipino entrepreneurs.</h2>
        <p className="bhs__subheadline">
          Get paid on time, every time. Mochi helps you manage your finances with ease.
        </p>
      </div>

      {/* ── Two-column body ── */}
      <div className="bhs__body">

        {/* Left: cards */}
        <div className="bhs__cards">
          {featureCards.map((card, i) => {
            const isActive = i === activeTab;
            return (
              <button
                key={card.id}
                className={`bhs__card ${isActive ? 'bhs__card--active' : ''}`}
                onClick={() => goToTab(i)}
              >
                {/* Progress bar strip on left edge */}
                <div className="bhs__card-bar-track">
                  <div
                    className="bhs__card-bar-fill"
                    style={{ height: isActive ? `${progress}%` : '0%' }}
                  />
                </div>

                <div className="bhs__card-body">
                  <h3 className="bhs__card-title">{card.title}</h3>
                  <p className="bhs__card-desc">{card.description}</p>
                  <span className="bhs__card-link">Learn more</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Right: panel */}
        <div className="bhs__visual">
          <div className="bhs__panel-wrap">
            <ActivePanel />
          </div>
        </div>

      </div>
    </section>
  );
};

export default BillingHeroSection;
