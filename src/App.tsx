import { useState } from 'react';
import './index.css';
import { Customer, CUSTOMERS } from './data/customers';
import { NavigationContext, AppPage } from './context/NavigationContext';
import CustomersTable from './components/CustomersTable';
import CreateCustomerPage from './components/CreateCustomerPage';
import CustomerDetailPage from './components/CustomerDetailPage';
import CustomerViewPage from './components/CustomerViewPage';
import CreateBillPage from './components/CreateBillPage';
import ManageBillsPage from './components/ManageBillsPage';
import SettingsPage from './components/SettingsPage';

function App() {
  const [page, setPage] = useState<AppPage>('list');
  const [customers, setCustomers] = useState<Customer[]>(CUSTOMERS);
  const [pendingBanner, setPendingBanner] = useState<string | null>(null);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [editingGroups, setEditingGroups] = useState<string[]>([]);
  const [groupOverride, setGroupOverride] = useState<{ id: string; groups: string[] } | null>(null);
  const [detailStartInEditMode, setDetailStartInEditMode] = useState(false);

  // ── Navigation handler consumed by Sidebar via context ───────────────────
  function navigate(target: AppPage) {
    // Navigating to create-bill from the sidebar has no customer context
    if (target === 'bill') setEditingCustomer(null);
    setPage(target);
  }

  function handleCustomerCreated(customer: Customer) {
    setCustomers((prev) => [customer, ...prev]);
    setPendingBanner(`${customer.name} has been added successfully.`);
    setPage('list');
  }

  function handleView(customer: Customer, groups: string[]) {
    setEditingCustomer(customer);
    setEditingGroups(groups);
    setDetailStartInEditMode(false);
    setPage('view');
  }

  function handleEdit(customer: Customer, groups: string[]) {
    setEditingCustomer(customer);
    setEditingGroups(groups);
    setDetailStartInEditMode(true);
    setPage('detail');
  }

  function handleEditFromView() {
    setDetailStartInEditMode(true);
    setPage('detail');
  }

  function handleCreateBill() {
    setPage('bill');
  }

  function handleCustomerUpdated(updated: Customer, updatedGroups: string[]) {
    setCustomers((prev) => prev.map((c) => c.id === updated.id ? updated : c));
    setGroupOverride({ id: updated.id, groups: updatedGroups });
    setPendingBanner(`${updated.name} has been updated successfully.`);
    setPage('list');
  }

  // ── Page rendering ────────────────────────────────────────────────────────
  function renderPage() {
    if (page === 'create') {
      return (
        <CreateCustomerPage
          onBack={() => setPage('list')}
          onSubmit={handleCustomerCreated}
        />
      );
    }

    if (page === 'view' && editingCustomer) {
      return (
        <CustomerViewPage
          customer={editingCustomer}
          groups={editingGroups}
          onBack={() => setPage('list')}
          onEdit={handleEditFromView}
          onCreateBill={handleCreateBill}
        />
      );
    }

    if (page === 'detail' && editingCustomer) {
      return (
        <CustomerDetailPage
          key={`${editingCustomer.id}-${detailStartInEditMode}`}
          customer={editingCustomer}
          groups={editingGroups}
          onBack={() => setPage('list')}
          onSave={handleCustomerUpdated}
          onCreateBill={handleCreateBill}
          startInEditMode={detailStartInEditMode}
        />
      );
    }

    if (page === 'bill') {
      return (
        <CreateBillPage
          customer={editingCustomer ?? undefined}
          onBack={() => setPage(editingCustomer ? 'detail' : 'manage-bills')}
          onViewCustomer={editingCustomer ? () => setPage('view') : undefined}
        />
      );
    }

    if (page === 'manage-bills') {
      return <ManageBillsPage />;
    }

    if (page === 'settings') {
      return <SettingsPage />;
    }

    // Default: customers list
    return (
      <CustomersTable
        customers={customers}
        initialBanner={pendingBanner}
        onBannerShown={() => setPendingBanner(null)}
        onCreateCustomer={() => setPage('create')}
        onEdit={handleEdit}
        onViewCustomer={handleView}
        groupOverride={groupOverride}
        onGroupOverrideApplied={() => setGroupOverride(null)}
      />
    );
  }

  return (
    <NavigationContext.Provider value={{ currentPage: page, navigate }}>
      {renderPage()}
    </NavigationContext.Provider>
  );
}

export default App;
