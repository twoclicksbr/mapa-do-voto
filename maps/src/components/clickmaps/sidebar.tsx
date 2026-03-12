import { useState, useRef, useEffect, useCallback } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SidebarHeader } from "@/components/layouts/layout-33/components/sidebar-header";
import { SidebarFooter } from "@/components/layouts/layout-33/components/sidebar-footer";
import { useLayout } from "@/components/layouts/layout-33/components/context";
import { CandidateSearch, type Candidate } from "@/components/map/candidate-search";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { XIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import axios from "axios";
import api from "@/lib/api";

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

function isStateLevel(role: string | undefined): boolean {
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
    setQuery('');
    setResults([]);
    setOpen(false);
    onSelect(city);
  };

  const handleClear = () => {
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
        <div className="border border-gray-200 rounded-lg px-3 py-2 bg-white flex items-center justify-between gap-2">
          <span className="text-sm font-medium truncate">{selected.name}</span>
          <button onClick={handleClear} className="flex-shrink-0 text-gray-400 hover:text-gray-600">
            <XIcon className="size-3.5" />
          </button>
        </div>
      ) : (
        <>
          <div className="border border-gray-200 rounded-lg px-3 py-2 bg-white">
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
                  onClick={() => handleSelect(city)}
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

export function ClickMapsSidebarContent() {
  const { isMobile } = useLayout();
  const [statsData, setStatsData] = useState<StatsResponse | null>(null);
  const [activeRound, setActiveRound] = useState<number | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
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

  const handleCandidateSelect = (candidate: Candidate) => {
    setSelectedCandidate(candidate);
    setSelectedCity(null);
    setStatsData(null);
    setActiveRound(null);
    fetchStats(candidate.id);
  };

  const handleCitySelect = (city: CityOption) => {
    setSelectedCity(city);
    if (selectedCandidate) fetchStats(selectedCandidate.id, city.id);
  };

  const handleCityClear = () => {
    setSelectedCity(null);
    if (selectedCandidate) fetchStats(selectedCandidate.id);
  };

  const currentStat = statsData && activeRound !== null
    ? statsData.stats[String(activeRound)] ?? null
    : null;

  const showCityFilter = selectedCandidate && isStateLevel(selectedCandidate.role);

  return (
    <div className="flex flex-col items-stretch grow">
      {!isMobile && <SidebarHeader />}
      <ScrollArea className="shrink-0 h-[calc(100vh-3.5rem)] lg:h-[calc(100vh-8.5rem)]">
        <div className="px-4 py-3 flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-500">Candidato:</label>
          <CandidateSearch variant="sidebar" onSelect={handleCandidateSelect} />
        </div>

        {showCityFilter && (
          <div className="px-4 flex flex-col gap-1 mt-1">
            <label className="text-xs font-medium text-gray-500">Cidade:</label>
            <CitySearch
              stateId={selectedCandidate.state_id!}
              selected={selectedCity}
              onSelect={handleCitySelect}
              onClear={handleCityClear}
            />
          </div>
        )}

        {statsData && statsData.rounds.length > 1 && (
          <div className="px-4 flex flex-col gap-1 mt-1">
            <label className="text-xs font-medium text-gray-500">Turno:</label>
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

        <div className="px-4 mt-3 pb-6">
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
          <Card>
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

                  {/* <span className="text-muted-foreground font-medium">Posição</span>
                  <span className="font-medium text-right">{currentStat.ranking_position}° de {currentStat.total_candidates}</span> */}

                  <span className="text-muted-foreground font-medium">Status TSE</span>
                  <span className="text-right">
                    {(() => {
                      const s = resolveStatus(currentStat.status);
                      return (
                        <span className={cn(
                          "text-[10px] px-1.5 py-0.5 rounded font-bold",
                          s.color === 'green'  && "bg-green-100 text-green-700",
                          s.color === 'yellow' && "bg-yellow-100 text-yellow-700",
                          s.color === 'red'    && "bg-red-100 text-red-600",
                        )}>
                          {s.label}
                        </span>
                      );
                    })()}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
          )}
        </div>

        <div className="px-4 mt-3 pb-6 flex flex-col gap-2">
          {[
            { id: "zonas", label: "Zonas Eleitorais" },
            { id: "colegio", label: "Colégio Eleitoral" },
            { id: "calor", label: "Mapa de Calor" },
          ].map((item) => (
            <label key={item.id} className="flex items-center gap-2 text-sm cursor-pointer">
              <Checkbox id={item.id} size="sm" />
              {item.label}
            </label>
          ))}
        </div>
      </ScrollArea>
      <SidebarFooter />
    </div>
  );
}
