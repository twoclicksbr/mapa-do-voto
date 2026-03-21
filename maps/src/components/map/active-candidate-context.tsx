import { createContext, useContext, useState } from 'react';
import type { Candidate } from '@/components/map/candidate-search';

interface ActiveCandidateContextValue {
  activeCandidate: Candidate | null;
  setActiveCandidate: (c: Candidate | null) => void;
  showCities: boolean;
  setShowCities: (v: boolean) => void;
  showCard: boolean;
  setShowCard: (v: boolean) => void;
  isSplit: boolean;
  setIsSplit: (v: boolean) => void;
  mapClickedCity: { name: string; ibge_code: string; city_id?: number } | null;
  setMapClickedCity: (v: { name: string; ibge_code: string; city_id?: number } | null) => void;
  focusCityOnMap: { name: string } | null;
  setFocusCityOnMap: (v: { name: string } | null) => void;
  clearCityHighlight: boolean;
  setClearCityHighlight: (v: boolean) => void;
}

const ActiveCandidateContext = createContext<ActiveCandidateContextValue | null>(null);

export function ActiveCandidateProvider({ children }: { children: React.ReactNode }) {
  const [activeCandidate, setActiveCandidate] = useState<Candidate | null>(null);
  const [showCities, setShowCities] = useState(false);
  const [showCard, setShowCard] = useState(true);
  const [isSplit, setIsSplit] = useState(false);
  const [mapClickedCity, setMapClickedCity] = useState<{ name: string; ibge_code: string; city_id?: number } | null>(null);
  const [focusCityOnMap, setFocusCityOnMap] = useState<{ name: string } | null>(null);
  const [clearCityHighlight, setClearCityHighlight] = useState(false);

  return (
    <ActiveCandidateContext.Provider value={{ activeCandidate, setActiveCandidate, showCities, setShowCities, showCard, setShowCard, isSplit, setIsSplit, mapClickedCity, setMapClickedCity, focusCityOnMap, setFocusCityOnMap, clearCityHighlight, setClearCityHighlight }}>
      {children}
    </ActiveCandidateContext.Provider>
  );
}

export function useActiveCandidate() {
  const ctx = useContext(ActiveCandidateContext);
  if (!ctx) throw new Error('useActiveCandidate must be used within ActiveCandidateProvider');
  return ctx;
}
