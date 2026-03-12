import { createContext, useContext, useState } from 'react';
import type { Candidate } from '@/components/map/candidate-search';

interface ActiveCandidateContextValue {
  activeCandidate: Candidate | null;
  setActiveCandidate: (c: Candidate | null) => void;
  showCities: boolean;
  setShowCities: (v: boolean) => void;
  mapClickedCity: { name: string; ibge_code: string } | null;
  setMapClickedCity: (v: { name: string; ibge_code: string } | null) => void;
  focusCityOnMap: { name: string } | null;
  setFocusCityOnMap: (v: { name: string } | null) => void;
}

const ActiveCandidateContext = createContext<ActiveCandidateContextValue | null>(null);

export function ActiveCandidateProvider({ children }: { children: React.ReactNode }) {
  const [activeCandidate, setActiveCandidate] = useState<Candidate | null>(null);
  const [showCities, setShowCities] = useState(false);
  const [mapClickedCity, setMapClickedCity] = useState<{ name: string; ibge_code: string } | null>(null);
  const [focusCityOnMap, setFocusCityOnMap] = useState<{ ibge_code: string } | null>(null);

  return (
    <ActiveCandidateContext.Provider value={{ activeCandidate, setActiveCandidate, showCities, setShowCities, mapClickedCity, setMapClickedCity, focusCityOnMap, setFocusCityOnMap }}>
      {children}
    </ActiveCandidateContext.Provider>
  );
}

export function useActiveCandidate() {
  const ctx = useContext(ActiveCandidateContext);
  if (!ctx) throw new Error('useActiveCandidate must be used within ActiveCandidateProvider');
  return ctx;
}
