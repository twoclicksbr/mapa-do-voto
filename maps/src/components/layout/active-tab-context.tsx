import { createContext, useContext, useState } from 'react';

const STORAGE_KEY = 'mapadovoto:activeTab';

interface ActiveTabContextValue {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const ActiveTabContext = createContext<ActiveTabContextValue | null>(null);

export function ActiveTabProvider({ children }: { children: React.ReactNode }) {
  const [activeTab, setActiveTabState] = useState(
    () => localStorage.getItem(STORAGE_KEY) ?? 'overview'
  );

  const setActiveTab = (tab: string) => {
    localStorage.setItem(STORAGE_KEY, tab);
    setActiveTabState(tab);
  };

  return (
    <ActiveTabContext.Provider value={{ activeTab, setActiveTab }}>
      {children}
    </ActiveTabContext.Provider>
  );
}

export function useActiveTab() {
  const ctx = useContext(ActiveTabContext);
  if (!ctx) throw new Error('useActiveTab must be used within ActiveTabProvider');
  return ctx;
}
