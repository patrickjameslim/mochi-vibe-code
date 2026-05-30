import { createContext, useContext, useState, type ReactNode } from 'react'
import { CUSTOMERS, type Customer } from '#/data/customers'

interface CustomersContextValue {
  customers: Customer[]
  setCustomers: (updater: (prev: Customer[]) => Customer[]) => void
  pendingBanner: string | null
  setPendingBanner: (banner: string | null) => void
  groupOverride: { id: string; groups: string[] } | null
  setGroupOverride: (override: { id: string; groups: string[] } | null) => void
}

const CustomersContext = createContext<CustomersContextValue | null>(null)

export function CustomersProvider({ children }: { children: ReactNode }) {
  const [customers, setCustomersState] = useState<Customer[]>(CUSTOMERS)
  const [pendingBanner, setPendingBanner] = useState<string | null>(null)
  const [groupOverride, setGroupOverride] = useState<{ id: string; groups: string[] } | null>(null)

  function setCustomers(updater: (prev: Customer[]) => Customer[]) {
    setCustomersState(updater)
  }

  return (
    <CustomersContext.Provider value={{ customers, setCustomers, pendingBanner, setPendingBanner, groupOverride, setGroupOverride }}>
      {children}
    </CustomersContext.Provider>
  )
}

export function useCustomers(): CustomersContextValue {
  const context = useContext(CustomersContext)
  if (!context) throw new Error('useCustomers must be used within CustomersProvider')
  return context
}
