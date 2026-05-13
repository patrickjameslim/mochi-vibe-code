import { createContext, useContext, useState } from 'react';
import type { SavedCustomField } from '../types/customFields';

interface CustomFieldsContextValue {
  savedCustomFields: SavedCustomField[];
  saveCustomFields: (fields: SavedCustomField[]) => void;
}

const CustomFieldsContext = createContext<CustomFieldsContextValue>({
  savedCustomFields: [],
  saveCustomFields: () => {},
});

export function CustomFieldsProvider({ children }: { children: React.ReactNode }) {
  const [savedCustomFields, setSavedCustomFields] = useState<SavedCustomField[]>([]);

  return (
    <CustomFieldsContext.Provider value={{ savedCustomFields, saveCustomFields: setSavedCustomFields }}>
      {children}
    </CustomFieldsContext.Provider>
  );
}

export function useCustomFields() {
  return useContext(CustomFieldsContext);
}
