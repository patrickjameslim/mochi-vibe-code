import { useState } from 'react';

export function useTableSort<K extends string>() {
  const [sortKey, setSortKey] = useState<K | null>(null);
  const [sortAsc, setSortAsc] = useState(false);

  function toggleSort(key: K) {
    if (sortKey !== key) {
      setSortKey(key);
      setSortAsc(false);
    } else if (!sortAsc) {
      setSortAsc(true);
    } else {
      setSortKey(null);
    }
  }

  return { sortKey, sortAsc, toggleSort };
}
