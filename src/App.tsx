import { useState } from 'react';
import './index.css';
import { Customer, CUSTOMERS } from './data/customers';
import CustomersTable from './components/CustomersTable';
import CreateCustomerPage from './components/CreateCustomerPage';
import CustomerDetailPage from './components/CustomerDetailPage';

type Page = 'list' | 'create' | 'detail';

function App() {
  const [page, setPage] = useState<Page>('list');
  const [customers, setCustomers] = useState<Customer[]>(CUSTOMERS);
  const [pendingBanner, setPendingBanner] = useState<string | null>(null);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [editingGroups, setEditingGroups] = useState<string[]>([]);

  function handleCustomerCreated(customer: Customer) {
    setCustomers((prev) => [customer, ...prev]);
    setPendingBanner(`${customer.name} has been added successfully.`);
    setPage('list');
  }

  function handleEdit(customer: Customer, groups: string[]) {
    setEditingCustomer(customer);
    setEditingGroups(groups);
    setPage('detail');
  }

  function handleCustomerUpdated(updated: Customer) {
    setCustomers((prev) => prev.map((c) => c.id === updated.id ? updated : c));
    setPendingBanner(`${updated.name} has been updated successfully.`);
    setPage('list');
  }

  if (page === 'create') {
    return (
      <CreateCustomerPage
        onBack={() => setPage('list')}
        onSubmit={handleCustomerCreated}
      />
    );
  }

  if (page === 'detail' && editingCustomer) {
    return (
      <CustomerDetailPage
        customer={editingCustomer}
        groups={editingGroups}
        onBack={() => setPage('list')}
        onSave={handleCustomerUpdated}
      />
    );
  }

  return (
    <CustomersTable
      customers={customers}
      initialBanner={pendingBanner}
      onBannerShown={() => setPendingBanner(null)}
      onCreateCustomer={() => setPage('create')}
      onEdit={handleEdit}
    />
  );
}

export default App;
