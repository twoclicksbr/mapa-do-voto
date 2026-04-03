import { useState, useRef, useEffect, useCallback } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SidebarHeader } from "@/components/layouts/layout-33/components/sidebar-header";
import { SidebarFooter } from "@/components/layouts/layout-33/components/sidebar-footer";
import { useLayout } from "@/components/layouts/layout-33/components/context";
import { useActiveCandidate } from "@/components/map/active-candidate-context";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ChevronLeft, Columns2, MonitorCloud, X, XIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import axios from "axios";
import api from "@/lib/api";
import { CandidateSearch, type Candidate } from "@/components/map/candidate-search";
import { getPartyColors } from "@/lib/party-colors";

interface RoundStat {
  qty_votes: number;
  percentage: number;
  total_valid: number;
  qty_blank: number;
  qty_null: number;
  qty_legend: number;
  qty_party_total: number;
  qty_total: number;
  status: string | null;
}

interface StatsResponse {
  rounds: number[];
  default_round: number | null;
  stats: Record<string, RoundStat>;
}

interface CityOption {
  id: number;
  name: string;
  ibge_code: string;
}

const STATUS_MAP: Record<string, { label: string; color: 'green' | 'yellow' | 'red' }> = {
  'ELEITO':            { label: 'ELEITO',            color: 'green'  },
  'ELEITO POR QP':     { label: 'ELEITO POR QP',     color: 'green'  },
  'ELEITO POR MÉDIA':  { label: 'ELEITO POR MÉDIA',  color: 'green'  },
  '2º TURNO':          { label: 'ELEITO (2° TURNO)', color: 'green'  },
  'NÃO ELEITO':        { label: 'NÃO ELEITO',        color: 'red'    },
  'SUPLENTE':          { label: 'SUPLENTE',           color: 'yellow' },
};

function resolveStatus(raw: string | null): { label: string; color: 'green' | 'yellow' | 'red' } {
  if (!raw) return { label: '—', color: 'red' };
  const key = raw.toUpperCase().trim();
  return STATUS_MAP[key] ?? { label: raw, color: 'red' };
}

const STATE_ROLES = [
  'DEPUTADO ESTADUAL', 'DEPUTADA ESTADUAL',
  'DEPUTADO FEDERAL',  'DEPUTADA FEDERAL',
  'SENADOR',           'SENADORA',
  'GOVERNADOR',        'GOVERNADORA',
];

function isStateLevelRole(role: string | undefined): boolean {
  return STATE_ROLES.includes((role ?? '').toUpperCase());
}

function CitySearch({ stateId, onSelect, onClear, selected }: {
  stateId: number;
  onSelect: (city: CityOption) => void;
  onClear: () => void;
  selected: CityOption | null;
}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<CityOption[]>([]);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const search = useCallback((q: string) => {
    if (q.length < 2) { setResults([]); setOpen(false); return; }
    api.get<CityOption[]>('/cities/search', { params: { q, state_id: stateId } })
      .then((res) => { setResults(res.data); setOpen(true); });
  }, [stateId]);

  const handleChange = (value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(value), 300);
  };

  const handleSelect = (city: CityOption) => {
    if (debounceRef.current) { clearTimeout(debounceRef.current); debounceRef.current = null; }
    setQuery('');
    setResults([]);
    setOpen(false);
    onSelect(city);
  };

  const handleClear = () => {
    if (debounceRef.current) { clearTimeout(debounceRef.current); debounceRef.current = null; }
    setQuery('');
    setResults([]);
    setOpen(false);
    onClear();
  };

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      {selected ? (
        <div className="border border-gray-200 rounded-lg px-3 py-2 bg-background flex items-center justify-between gap-2">
          <span className="text-sm font-medium truncate">{selected.name}</span>
          <button onMouseDown={(e) => { e.preventDefault(); handleClear(); }} className="flex-shrink-0 text-gray-400 hover:text-gray-600">
            <XIcon className="size-3.5" />
          </button>
        </div>
      ) : (
        <>
          <div className="border border-gray-200 rounded-lg px-3 py-2 bg-background">
            <input
              type="text"
              value={query}
              onChange={(e) => handleChange(e.target.value)}
              placeholder="Filtrar por cidade..."
              className="w-full text-sm outline-none placeholder:text-gray-400 bg-transparent"
            />
          </div>
          {open && results.length > 0 && (
            <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-md overflow-hidden">
              {results.map((city) => (
                <button
                  key={city.id}
                  onMouseDown={(e) => { e.preventDefault(); handleSelect(city); }}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 transition-colors"
                >
                  {city.name}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function ActiveCandidateCard({ candidate, onClear }: { candidate: Candidate; onClear: () => void }) {
  const [imgError, setImgError] = useState(false);
  const colors = getPartyColors(candidate.party ?? '');
  const src = candidate.photo_url ?? candidate.avatar ?? null;
  const initial = ((candidate.ballot_name ?? candidate.name)?.[0] ?? '?').toUpperCase();
  const bgStyle = colors.gradient ? { background: colors.gradient } : { backgroundColor: colors.hex };

  return (
    <div className="border border-border rounded-lg px-3 py-2.5 bg-background flex items-center gap-3 relative">
      <div className="relative shrink-0">
        {src && !imgError ? (
          <img src={src} alt="" className="w-10 h-10 rounded-full object-cover" onError={() => setImgError(true)} />
        ) : (
          <div style={{ width: 40, height: 40, ...bgStyle }} className="rounded-full flex items-center justify-center text-white font-bold text-base">
            {initial}
          </div>
        )}
        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-background rounded-full" />
      </div>
      <div className="flex flex-col min-w-0 flex-1">
        <div className="flex items-center gap-1.5 overflow-hidden">
          <span className="font-semibold text-sm truncate">{candidate.ballot_name ?? candidate.name}</span>
          {candidate.party && (
            <span
              className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold shrink-0 ${colors.gradient ? '' : `${colors.bg} ${colors.text}`}`}
              style={colors.gradient ? { background: colors.gradient, color: 'white', textShadow: '0 1px 2px rgba(0,0,0,0.6)' } : undefined}
            >
              {candidate.party}
            </span>
          )}
        </div>
        <span className="text-xs text-muted-foreground truncate">{candidate.role}</span>
      </div>
      <button
        onClick={onClear}
        className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-background border border-border shadow-sm flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
      >
        <X size={11} />
      </button>
    </div>
  );
}

export function MapaDoVotoSidebarContent({ inline = false, onClose }: { inline?: boolean; onClose?: () => void }) {
  const { isMobile } = useLayout();
  const {
    activeCandidate, setActiveCandidate,
    showCities, setShowCities,
    showAttendances, setShowAttendances,
    isSplit, setIsSplit,
    mapClickedCity, setMapClickedCity,
    setFocusCityOnMap, setClearCityHighlight,
  } = useActiveCandidate();

  const isMasterUser = (() => {
    const parts = window.location.hostname.split('.');
    const slug = parts.length >= 3 ? parts[0] : (parts.length === 2 ? parts[0] : 'master');
    return slug.toLowerCase() === 'master';
  })();

  const [statsData, setStatsData] = useState<StatsResponse | null>(null);
  const [activeRound, setActiveRound] = useState<number | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [selectedCity, setSelectedCity] = useState<CityOption | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const fetchStats = useCallback((candidateId: string, cityId?: number) => {
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    setLoadingStats(true);
    setStatsData(null);
    const params = cityId ? { city_id: cityId } : {};
    api.get<StatsResponse>(`/candidacies/${candidateId}/stats`, { params, signal: abortRef.current.signal })
      .then((res) => {
        setStatsData(res.data);
        setActiveRound(res.data.default_round);
      })
      .catch((err) => {
        if (axios.isCancel(err)) return;
      })
      .finally(() => setLoadingStats(false));
  }, []);

  useEffect(() => {
    setSelectedCity(null);
    setStatsData(null);
    setActiveRound(null);
    if (!activeCandidate) return;
    fetchStats(activeCandidate.id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCandidate?.id]);

  useEffect(() => {
    if (!mapClickedCity || !activeCandidate) return;
    if (mapClickedCity.city_id) {
      const city: CityOption = { id: mapClickedCity.city_id, name: mapClickedCity.name, ibge_code: mapClickedCity.ibge_code ?? '' };
      setSelectedCity(city);
      fetchStats(activeCandidate.id, city.id);
      setMapClickedCity(null);
      return;
    }
    if (!activeCandidate.state_id) { setMapClickedCity(null); return; }
    api.get<CityOption[]>('/cities/search', { params: { q: mapClickedCity.name, state_id: activeCandidate.state_id } })
      .then((res) => {
        const city = res.data[0];
        if (city) {
          setSelectedCity(city);
          fetchStats(activeCandidate.id, city.id);
        }
      })
      .finally(() => setMapClickedCity(null));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapClickedCity]);

  const handleCandidateSelect = (c: Candidate) => {
    setActiveCandidate(c);
    setShowCities(false);
  };

  const handleCandidateClear = () => {
    setActiveCandidate(null);
    setShowCities(false);
  };

  const handleCitySelect = (city: CityOption) => {
    setSelectedCity(city);
    if (activeCandidate) fetchStats(activeCandidate.id, city.id);
    setFocusCityOnMap({ name: city.name });
  };

  const handleCityClear = () => {
    setSelectedCity(null);
    if (activeCandidate) fetchStats(activeCandidate.id);
    setClearCityHighlight(true);
  };

  const currentStat = statsData && activeRound !== null
    ? statsData.stats[String(activeRound)] ?? null
    : null;

  const isStateLevel = activeCandidate ? isStateLevelRole(activeCandidate.role) : false;

  const mainContent = (
    <div className="flex flex-col">
      {/* Candidato ativo ou busca */}
      <div className="px-3 pt-3 pb-3">
        {activeCandidate ? (
          <ActiveCandidateCard candidate={activeCandidate} onClear={handleCandidateClear} />
        ) : (
          <CandidateSearch
            variant="sidebar"
            onSelect={handleCandidateSelect}
            onClear={handleCandidateClear}
          />
        )}
      </div>

      {activeCandidate && (
        <>
          {/* Visualização */}
          <div className="px-3 pb-3 border-b border-border flex flex-col gap-2">
            {isMasterUser && (
              <label className="flex items-center gap-2.5 cursor-pointer">
                <Switch size="sm" checked={isSplit} onCheckedChange={setIsSplit} />
                <span className="text-sm flex items-center gap-1.5"><Columns2 className="size-3.5" /> Split view</span>
              </label>
            )}
            <label className="flex items-center gap-2.5 cursor-pointer">
              <Switch size="sm" checked={showAttendances} onCheckedChange={setShowAttendances} />
              <span className="text-sm flex items-center gap-1.5"><MonitorCloud className="size-3.5" /> Atendimentos</span>
            </label>
            {isStateLevel && (
              <label className="flex items-center gap-2.5 cursor-pointer">
                <Switch size="sm" checked={showCities} onCheckedChange={setShowCities} />
                <span className="text-sm">Exibir Cidades</span>
              </label>
            )}
          </div>

          {/* Filtro por cidade */}
          {isStateLevel && showCities && activeCandidate.state_id && (
            <div className="px-3 pt-3 pb-2">
              <CitySearch
                stateId={activeCandidate.state_id}
                selected={selectedCity}
                onSelect={handleCitySelect}
                onClear={handleCityClear}
              />
            </div>
          )}

          {/* Seletor de turno */}
          {statsData && statsData.rounds.length > 1 && (
            <div className="px-3 pt-3 pb-1 flex flex-col gap-1">
              <label className="text-xs font-medium text-muted-foreground">Turno:</label>
              <div className="flex w-full">
                {statsData.rounds.map((round, i) => (
                  <Button
                    key={round}
                    variant={activeRound === round ? 'primary' : 'outline'}
                    size="sm"
                    className={cn(
                      "flex-1",
                      i === 0 && "rounded-r-none border-r-0",
                      i === statsData.rounds.length - 1 && "rounded-l-none",
                    )}
                    onClick={() => setActiveRound(round)}
                  >
                    {round}° turno
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Stats */}
          <div className="px-3 pt-3 pb-6">
            {loadingStats ? (
              <Card>
                <CardHeader className="px-4 min-h-0 py-3">
                  <div className="animate-pulse bg-gray-200 rounded h-5 w-32" />
                </CardHeader>
                <CardContent className="px-4 py-3 space-y-4">
                  <div className="animate-pulse bg-gray-200 rounded h-10 w-full" />
                  <div className="space-y-2">
                    <div className="animate-pulse bg-gray-200 rounded h-4 w-full" />
                    <div className="animate-pulse bg-gray-200 rounded h-4 w-full" />
                    <div className="animate-pulse bg-gray-200 rounded h-4 w-full" />
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="relative">
                {currentStat && (() => {
                  const s = resolveStatus(currentStat.status);
                  return (
                    <span className={cn(
                      "absolute top-0 right-4 -translate-y-1/2 z-10",
                      "text-[10px] px-2 py-0.5 rounded-full font-bold shadow-sm",
                      s.color === 'green'  && "bg-green-100 text-green-700 border border-green-200",
                      s.color === 'yellow' && "bg-yellow-100 text-yellow-700 border border-yellow-200",
                      s.color === 'red'    && "bg-red-100 text-red-600 border border-red-200",
                    )}>
                      {s.label}
                    </span>
                  );
                })()}
                <CardHeader className="px-4 min-h-0 py-3">
                  <CardTitle className="text-sm font-medium">
                    <>Quantidade de Votos: <b>{(currentStat?.qty_votes ?? 0).toLocaleString('pt-BR')}</b></>
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 py-3 space-y-4">
                  <div className="bg-muted/60 border border-border rounded-lg space-y-2 p-3">
                    <div className="flex justify-between text-sm font-medium">
                      <span>{currentStat ? (currentStat.percentage < 0.1 ? currentStat.percentage.toFixed(2) : currentStat.percentage.toFixed(1)) : '0.0'}% dos votos válidos</span>
                    </div>
                    <Progress
                      value={currentStat?.percentage ?? 0}
                      className="h-1.5 bg-primary/20"
                    />
                  </div>
                  {currentStat && (
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                      <span className="text-muted-foreground font-medium">Votos válidos</span>
                      <span className="font-medium text-right">{currentStat.total_valid.toLocaleString('pt-BR')}</span>

                      <span className="text-muted-foreground font-medium">Votos brancos</span>
                      <span className="font-medium text-right">{currentStat.qty_blank.toLocaleString('pt-BR')}</span>

                      <span className="text-muted-foreground font-medium">Votos nulos</span>
                      <span className="font-medium text-right">{currentStat.qty_null.toLocaleString('pt-BR')}</span>

                      <span className="text-muted-foreground font-medium">Votos legenda</span>
                      <span className="font-medium text-right">{currentStat.qty_legend.toLocaleString('pt-BR')}</span>

                      <span className="text-muted-foreground font-medium">Total partido</span>
                      <span className="font-medium text-right">{currentStat.qty_party_total.toLocaleString('pt-BR')}</span>

                      <span className="text-muted-foreground font-medium">Comparecimento</span>
                      <span className="font-medium text-right">{currentStat.qty_total.toLocaleString('pt-BR')}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </>
      )}
    </div>
  );

  return (
    <div className="flex flex-col items-stretch grow overflow-hidden">
      {/* Header */}
      {inline ? (
        <div className="flex items-center justify-between px-3 py-2.5 border-b border-border shrink-0">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Mapa</span>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded hover:bg-muted"
          >
            <ChevronLeft className="size-4" />
          </button>
        </div>
      ) : (
        !isMobile && <SidebarHeader />
      )}

      {/* Content */}
      {inline ? (
        <div className="flex-1 overflow-y-auto min-h-0">
          {mainContent}
        </div>
      ) : (
        <ScrollArea className="shrink-0 h-[calc(100vh-3.5rem)] lg:h-[calc(100vh-8.5rem)]">
          {mainContent}
        </ScrollArea>
      )}

      {/* Footer */}
      {!inline && <SidebarFooter />}
    </div>
  );
}
