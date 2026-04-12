import React, { createContext, useContext, useMemo, useState } from 'react';

type SearchContextValue = {
  query: string;
  setQuery: (q: string) => void;
};

const SearchContext = createContext<SearchContextValue | null>(null);

export function SearchProvider({ children }: { children: React.ReactNode }) {
  const [query, setQuery] = useState('');
  const value = useMemo(() => ({ query, setQuery }), [query]);
  return <SearchContext.Provider value={value}>{children}</SearchContext.Provider>;
}

export function useSearchQuery() {
  const ctx = useContext(SearchContext);
  if (!ctx) {
    throw new Error('useSearchQuery must be used within SearchProvider');
  }
  return ctx;
}
