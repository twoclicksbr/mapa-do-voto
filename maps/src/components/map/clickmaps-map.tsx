import '@/lib/leaflet-icon-fix';
import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import * as L from 'leaflet';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import { useActiveCandidate } from '@/components/map/active-candidate-context';
import { Plus, Minus, Crosshair, X } from 'lucide-react';
import { getPartyColors } from '@/lib/party-colors';
import { CandidateSearch, type Candidate } from '@/components/map/candidate-search';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { Frame, FrameHeader, FramePanel, FrameTitle } from '@/components/reui/frame';
import { ChevronRightIcon } from 'lucide-react';
import api from '@/lib/api';

interface StatsRound {
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
interface StatsData {
  rounds: number[];
  default_round: number | null;
  stats: Record<string, StatsRound>;
}

interface CityOption {
  id: number;
  name: string;
  ibge_code: string;
  qty_votes?: number;
}

function CitySearch({ candidacyId, onSelect, onClear, selected }: {
  candidacyId: string;
  onSelect: (city: CityOption) => void;
  onClear: () => void;
  selected: CityOption | null;
}) {
  const [query, setQuery] = useState('');
  const [allCities, setAllCities] = useState<CityOption[]>([]);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});

  useEffect(() => {
    setAllCities([]);
    if (!candidacyId) return;
    api.get<CityOption[]>(`/candidacies/${candidacyId}/cities`)
      .then((res) => setAllCities(res.data))
      .catch((err) => console.error('[CitySearch] erro:', err));
  }, [candidacyId]);

  const filtered = query.length >= 2
    ? allCities.filter((c) => c.name.toLowerCase().includes(query.toLowerCase()))
    : allCities;

  const withVotes    = filtered.filter((c) => (c.qty_votes ?? 0) > 0);
  const withoutVotes = query.length >= 2 ? filtered.filter((c) => (c.qty_votes ?? 0) === 0) : [];

  const handleOpen = () => {
    if (allCities.length === 0) return;
    if (inputRef.current) {
      const r = inputRef.current.getBoundingClientRect();
      setDropdownStyle({ position: 'fixed', top: r.bottom + 4, left: r.left, width: r.width, zIndex: 9999 });
    }
    setOpen(true);
  };

  const handleSelect = (city: CityOption) => {
    setQuery(''); setOpen(false);
    onSelect(city);
  };

  const handleClear = () => {
    setQuery(''); setOpen(false);
    onClear();
  };

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const showDropdown = open && (withVotes.length > 0 || withoutVotes.length > 0);

  const dropdownEl = showDropdown ? createPortal(
    <div
      style={dropdownStyle}
      className="bg-white border border-gray-200 rounded-xl shadow-md overflow-hidden max-h-64 overflow-y-auto"
    >
      {withVotes.length > 0 && (
        <>
          <div className="px-3 py-1.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wide bg-gray-50 border-b border-gray-100">
            Com votos
          </div>
          {withVotes.map((city) => (
            <button
              key={city.id}
              onMouseDown={(e) => { e.preventDefault(); handleSelect(city); }}
              className="w-full px-3 py-2 text-left text-xs hover:bg-gray-50 transition-colors flex items-center justify-between"
            >
              <span>{city.name}</span>
              <span className="text-[10px] text-gray-400 shrink-0 ml-2">
                {(city.qty_votes ?? 0).toLocaleString('pt-BR')}
              </span>
            </button>
          ))}
        </>
      )}
      {withoutVotes.length > 0 && (
        <>
          <div className="px-3 py-1.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wide bg-gray-50 border-b border-gray-100 border-t border-gray-100">
            Sem votos
          </div>
          {withoutVotes.map((city) => (
            <button
              key={city.id}
              onMouseDown={(e) => { e.preventDefault(); handleSelect(city); }}
              className="w-full px-3 py-2 text-left text-xs hover:bg-gray-50 transition-colors text-gray-500"
            >
              {city.name}
            </button>
          ))}
        </>
      )}
    </div>,
    document.body,
  ) : null;

  return (
    <div ref={containerRef} className="relative">
      {selected ? (
        <div className="border border-gray-200 rounded-lg px-3 py-2 bg-white flex items-center justify-between gap-2">
          <span className="text-xs font-medium truncate">{selected.name}</span>
          <button onMouseDown={(e) => { e.preventDefault(); handleClear(); }} className="flex-shrink-0 text-gray-400 hover:text-gray-600">
            <X className="size-3" />
          </button>
        </div>
      ) : (
        <>
          <div className="border border-gray-200 rounded-lg px-3 py-2 bg-white">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => { setQuery(e.target.value); handleOpen(); }}
              onFocus={handleOpen}
              placeholder="Filtrar por cidade..."
              className="w-full text-xs outline-none placeholder:text-gray-400 bg-transparent"
            />
          </div>
          {dropdownEl}
        </>
      )}
    </div>
  );
}

/** Normaliza string: remove acentos e converte para maiúsculas */
function normalizeName(s: string): string {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().trim();
}

/** Distância de Levenshtein entre duas strings */
function levenshtein(a: string, b: string): number {
  const dp = Array.from({ length: a.length + 1 }, (_, i) =>
    Array.from({ length: b.length + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)),
  );
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[a.length][b.length];
}

const BRAZIL_BOUNDS: L.LatLngBoundsExpression = [
  [-33.75, -73.99],
  [5.27, -28.85],
];

const POLYGON_STYLE         = { color: '#1D3557', weight: 2, fillOpacity: 0.05 };
const CITIES_NO_VOTES_STYLE = { color: '#9CA3AF', weight: 1, fillOpacity: 0.08, fillColor: '#D1D5DB' };
const CITIES_HIGHLIGHT_STYLE = { weight: 2, color: '#1D3557', fillOpacity: 0.55 };

/** Paleta de calor: azul → verde → amarelo → vermelho */
const HEAT_STOPS = [
  { t: 0,    r: 74,  g: 144, b: 217 }, // #4A90D9 azul
  { t: 0.33, r: 82,  g: 201, b: 122 }, // #52C97A verde
  { t: 0.66, r: 245, g: 166, b: 35  }, // #F5A623 amarelo
  { t: 1,    r: 230, g: 57,  b: 70  }, // #E63946 vermelho
];

function lerpColor(t: number): string {
  const clamped = Math.max(0, Math.min(1, t));
  let lo = HEAT_STOPS[0], hi = HEAT_STOPS[HEAT_STOPS.length - 1];
  for (let i = 0; i < HEAT_STOPS.length - 1; i++) {
    if (clamped <= HEAT_STOPS[i + 1].t) { lo = HEAT_STOPS[i]; hi = HEAT_STOPS[i + 1]; break; }
  }
  const range = hi.t - lo.t;
  const f = range === 0 ? 0 : (clamped - lo.t) / range;
  const r = Math.round(lo.r + (hi.r - lo.r) * f);
  const g = Math.round(lo.g + (hi.g - lo.g) * f);
  const b = Math.round(lo.b + (hi.b - lo.b) * f);
  return `rgb(${r},${g},${b})`;
}

function getHeatColor(votes: number, max: number): { fillColor: string; fillOpacity: number } {
  if (votes <= 0 || max <= 0) return { fillColor: '#D1D5DB', fillOpacity: 0.15 };
  const t = Math.log(votes) / Math.log(max);
  return { fillColor: lerpColor(t), fillOpacity: 0.65 };
}

const MUNICIPAL_ROLES = ['PREFEITO', 'PREFEITA', 'VICE-PREFEITO', 'VICE-PREFEITA', 'VEREADOR', 'VEREADORA'];
const STATE_ROLES = ['DEPUTADO ESTADUAL', 'DEPUTADA ESTADUAL', 'DEPUTADO FEDERAL', 'DEPUTADA FEDERAL', 'SENADOR', 'SENADORA', 'GOVERNADOR', 'GOVERNADORA'];

// IBGE state codes keyed by UF
const UF_TO_IBGE: Record<string, string> = {
  AC: '12', AL: '27', AP: '16', AM: '13', BA: '29',
  CE: '23', DF: '53', ES: '32', GO: '52', MA: '21',
  MT: '51', MS: '50', MG: '31', PA: '15', PB: '25',
  PR: '41', PE: '26', PI: '22', RJ: '33', RN: '24',
  RS: '43', RO: '11', RR: '14', SC: '42', SP: '35',
  SE: '28', TO: '17',
};


function CardAvatar({ candidate, partyColors }: { candidate: Candidate; partyColors: ReturnType<typeof getPartyColors> }) {
  const [imgError, setImgError] = useState(false);
  const src = candidate.photo_url ?? candidate.avatar ?? null;
  const initial = ((candidate.ballot_name ?? candidate.name)?.[0] ?? '?').toUpperCase();
  const bgStyle = partyColors.gradient ? { background: partyColors.gradient } : { backgroundColor: partyColors.hex };

  if (!src || imgError) {
    return (
      <div
        style={{ width: 40, height: 40, ...bgStyle }}
        className="rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold text-base"
      >
        {initial}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt="Candidato"
      className="w-10 h-10 rounded-full object-cover"
      onError={() => setImgError(true)}
    />
  );
}

function CandidateCard() {
  const { activeCandidate, setActiveCandidate, setShowCities } = useActiveCandidate();

  const handleSelect = (candidate: Candidate) => {
    setActiveCandidate(candidate);
    setShowCities(false);
  };

  const handleClear = () => {
    setActiveCandidate(null);
    setShowCities(false);
  };

  if (!activeCandidate) {
    return <CandidateSearch variant="sidebar" onSelect={handleSelect} />;
  }

  const partyColors = getPartyColors(activeCandidate.party ?? '');

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-3 flex items-center gap-3 relative">
        <div className="relative shrink-0">
          <CardAvatar candidate={activeCandidate} partyColors={partyColors} />
          <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
        </div>
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-sm text-gray-900 truncate">
              {activeCandidate.ballot_name ?? activeCandidate.name}
            </span>
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${partyColors.gradient ? '' : `${partyColors.bg} ${partyColors.text}`}`}
              style={partyColors.gradient ? { background: partyColors.gradient, color: 'white', textShadow: '0 1px 3px rgba(0,0,0,0.8), 0 0 6px rgba(0,0,0,0.5)', fontWeight: 'bold' } : undefined}
            >
              {activeCandidate.party}
            </span>
          </div>
          <span className="text-xs text-gray-500 truncate">{activeCandidate.role}</span>
        </div>
        <button
          onClick={handleClear}
          className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-white border border-gray-300 shadow-sm flex items-center justify-center text-gray-500 hover:text-gray-700 hover:border-gray-400 transition-colors"
        >
          <X size={12} />
        </button>
      </div>
  );
}

const STATUS_COLORS: Record<string, string> = {
  'ELEITO':           'bg-green-100 text-green-700 border-green-200',
  'ELEITO POR QP':    'bg-green-100 text-green-700 border-green-200',
  'ELEITO POR MÉDIA': 'bg-green-100 text-green-700 border-green-200',
  '2º TURNO':         'bg-green-100 text-green-700 border-green-200',
  'NÃO ELEITO':       'bg-red-100 text-red-600 border-red-200',
  'SUPLENTE':         'bg-yellow-100 text-yellow-700 border-yellow-200',
};

function StatsCard() {
  const { activeCandidate, showCities, setShowCities, setFocusCityOnMap, mapClickedCity, setMapClickedCity, setClearCityHighlight } = useActiveCandidate();
  const [statsData, setStatsData] = useState<StatsData | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [activeRound, setActiveRound] = useState<number | null>(null);
  const [selectedCity, setSelectedCity] = useState<CityOption | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const fetchStats = useCallback((candidacyId: string, cityId?: number) => {
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    const params = cityId ? { city_id: cityId } : {};
    api.get<StatsData>(`/candidacies/${candidacyId}/stats`, { params, signal: abortRef.current.signal })
      .then((res) => { setStatsData(res.data); setActiveRound(res.data.default_round); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    setStatsData(null);
    setActiveRound(null);
    setSelectedCity(null);
    setIsOpen(false);
    if (!activeCandidate) return;
    fetchStats(activeCandidate.id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCandidate?.id]);

  useEffect(() => {
    if (!mapClickedCity || !activeCandidate) return;
    // Caminho rápido: city_id já resolvido no MapCore via lookup DB
    if (mapClickedCity.city_id) {
      const city: CityOption = { id: mapClickedCity.city_id, name: mapClickedCity.name, ibge_code: mapClickedCity.ibge_code };
      setSelectedCity(city);
      fetchStats(activeCandidate.id, city.id);
      setMapClickedCity(null);
      return;
    }
    // Fallback: busca por nome (para casos sem match no lookup)
    if (!activeCandidate.state_id) { setMapClickedCity(null); return; }
    api.get<CityOption[]>('/cities/search', { params: { q: mapClickedCity.name, state_id: activeCandidate.state_id } })
      .then((res) => {
        const needle = normalizeName(mapClickedCity.name);
        const city = res.data.find((c) => normalizeName(c.name) === needle) ?? null;
        if (city) {
          setSelectedCity(city);
          fetchStats(activeCandidate.id, city.id);
        }
      })
      .finally(() => setMapClickedCity(null));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapClickedCity]);

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

  if (!activeCandidate || !statsData) return null;

  const stat = activeRound !== null ? (statsData.stats[String(activeRound)] ?? null) : null;
  if (!stat) return null;

  const pct = stat.percentage < 0.1
    ? stat.percentage.toFixed(2)
    : stat.percentage.toFixed(1);

  const statusKey = stat.status?.toUpperCase().trim() ?? '';
  const statusLabel = statusKey === '2º TURNO' ? 'ELEITO (2° TURNO)' : (stat.status ?? '—');

  const isStateLevel = STATE_ROLES.includes((activeCandidate.role ?? '').toUpperCase());

  // const details = [
  //   { label: 'Votos válidos',  value: stat.total_valid.toLocaleString('pt-BR') },
  //   { label: 'Brancos',        value: stat.qty_blank.toLocaleString('pt-BR') },
  //   { label: 'Nulos',          value: stat.qty_null.toLocaleString('pt-BR') },
  //   { label: 'Legenda',        value: stat.qty_legend.toLocaleString('pt-BR') },
  //   { label: 'Total partido',  value: stat.qty_party_total.toLocaleString('pt-BR') },
  //   { label: 'Comparecimento', value: stat.qty_total.toLocaleString('pt-BR') },
  // ];

  return (
    <>
      {isStateLevel && (
        <div className="w-full max-w-xs">
          <Frame stacked dense spacing="sm" className="w-full" style={{ overflow: 'visible' }}>
            <Collapsible defaultOpen={false}>
              <CollapsibleTrigger className="flex w-full">
                <FrameHeader className="flex grow flex-row items-center justify-between gap-2">
                  <FrameTitle className="text-sm font-medium">
                    Visualização
                  </FrameTitle>
                  <ChevronRightIcon aria-hidden="true" className="text-muted-foreground size-4 transition-transform in-data-open:rotate-90" />
                </FrameHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <FramePanel>
                  <div className="flex flex-col gap-2">
                    <label className="flex items-center gap-2.5 cursor-pointer">
                      <Switch size="sm" checked={showCities} onCheckedChange={setShowCities} />
                      <span className="text-sm">Exibir Cidades</span>
                    </label>
                    {showCities && (
                      <CitySearch
                        candidacyId={activeCandidate.id}
                        selected={selectedCity}
                        onSelect={handleCitySelect}
                        onClear={handleCityClear}
                      />
                    )}
                  </div>
                </FramePanel>
              </CollapsibleContent>
            </Collapsible>
          </Frame>
        </div>
      )}
      <Collapsible open={isOpen} onOpenChange={setIsOpen} className="relative pb-3.5">
      <div className="relative bg-white border border-gray-200 rounded-xl shadow-sm px-3 py-3">
        {statsData.rounds.length > 1 && (
          <div className="flex w-full mb-3">
            {statsData.rounds.map((round, i) => (
              <Button
                key={round}
                variant={activeRound === round ? 'primary' : 'outline'}
                size="sm"
                className={cn(
                  "flex-1 text-xs",
                  i === 0 && "rounded-r-none border-r-0",
                  i === statsData.rounds.length - 1 && "rounded-l-none",
                )}
                onClick={() => setActiveRound(round)}
              >
                {round}° turno
              </Button>
            ))}
          </div>
        )}
        <div className="bg-muted/60 border border-border rounded-lg space-y-2 p-3">
          <div className="flex justify-between text-sm font-medium">
            <span>{stat.qty_votes.toLocaleString('pt-BR')} votos</span>
            <span>{pct}%</span>
          </div>
          <Progress value={stat.percentage} className="h-1.5 bg-primary/20" />
          <span className={`block w-full text-center text-[10px] px-2 py-0.5 rounded font-bold border ${STATUS_COLORS[statusKey] ?? 'bg-red-100 text-red-600 border-red-200'}`}>
            {statusLabel}
          </span>
        </div>

        {/* <CollapsibleContent>
          <div className="flex flex-col gap-2 pt-3">
            {details.map((item) => (
              <div key={item.label} className="flex justify-between text-xs">
                <span className="text-muted-foreground font-medium">{item.label}</span>
                <span className="font-medium">{item.value}</span>
              </div>
            ))}
          </div>
        </CollapsibleContent> */}
      </div>

      {/* <div className="absolute bottom-0 left-1/2 -translate-x-1/2">
        <CollapsibleTrigger asChild>
          <button className="w-7 h-7 bg-white border border-gray-200 rounded-full shadow-sm flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors">
            <ChevronDown size={14} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
          </button>
        </CollapsibleTrigger>
      </div> */}
    </Collapsible>
    </>
  );
}


function MapResizer() {
  const map = useMap();
  useEffect(() => {
    // Remeça após o CSS de padding da sidebar ser aplicado
    const t = setTimeout(() => map.invalidateSize(), 50);
    const handler = () => map.invalidateSize();
    window.addEventListener('resize', handler);
    return () => { clearTimeout(t); window.removeEventListener('resize', handler); };
  }, [map]);
  return null;
}

function MinZoomController() {
  const map = useMap();
  useEffect(() => {
    const updateMinZoom = () => {
      map.setMinZoom(map.getBoundsZoom(BRAZIL_BOUNDS));
    };
    updateMinZoom();
    map.on('resize', updateMinZoom);
    return () => { map.off('resize', updateMinZoom); };
  }, [map]);
  return null;
}

function MapSync({
  syncRef,
  isSyncingRef,
}: {
  syncRef?: React.RefObject<L.Map | null>;
  isSyncingRef: React.RefObject<boolean>;
}) {
  const map = useMap();

  useEffect(() => {
    if (!syncRef) return;

    const handler = () => {
      if (isSyncingRef.current || !syncRef.current) return;
      isSyncingRef.current = true;
      syncRef.current.setView(map.getCenter(), map.getZoom(), { animate: false });
      isSyncingRef.current = false;
    };

    map.on('move', handler);
    return () => { map.off('move', handler); };
  }, [map, syncRef, isSyncingRef]);

  return null;
}

function MapCapture({ mapRef }: { mapRef: React.RefObject<L.Map | null> }) {
  const map = useMap();
  useEffect(() => { mapRef.current = map; }, [map, mapRef]);
  return null;
}

/**
 * MapCore — vive dentro do MapContainer.
 * Gerencia: polígono do candidato ativo, crosshair e zoom.
 */
function MapCore({
  activeCandidate,
  onCityBoundsReady,
  cityBounds,
  isSyncingRef,
  syncRef,
  isCompare,
}: {
  activeCandidate: Candidate | null;
  onCityBoundsReady?: (bounds: L.LatLngBounds) => void;
  cityBounds?: L.LatLngBounds | null;
  isSyncingRef: React.RefObject<boolean>;
  syncRef?: React.RefObject<L.Map | null>;
  isCompare?: boolean;
}) {
  const map = useMap();
  const polygonLayerRef = useRef<L.GeoJSON | null>(null);
  const citiesLayerRef  = useRef<L.GeoJSON | null>(null);
  const brazilLayerRef  = useRef<L.GeoJSON | null>(null);
  const { showCities, setMapClickedCity, focusCityOnMap, setFocusCityOnMap, clearCityHighlight, setClearCityHighlight } = useActiveCandidate();
  const showCitiesRef = useRef(showCities);
  useEffect(() => { showCitiesRef.current = showCities; }, [showCities]);
  const [maxVotes, setMaxVotes] = useState(0);

  useEffect(() => {
    let cancelled = false;

    if (polygonLayerRef.current) {
      polygonLayerRef.current.remove();
      polygonLayerRef.current = null;
    }

    // Remove Brazil outline unconditionally — must happen before any async operation
    if (brazilLayerRef.current) {
      brazilLayerRef.current.remove();
      brazilLayerRef.current = null;
    }

    if (!activeCandidate) {
      // Restore Brazil outline (ref was just cleared above, so fetch always runs)
      fetch('https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson')
        .then((r) => r.json())
        .then((data: GeoJSON.FeatureCollection) => {
          if (cancelled) return;
          const feature = data.features.find((f) => f.properties?.name === 'Brazil');
          if (!feature) return;
          const layer = L.geoJSON(feature, { style: POLYGON_STYLE });
          layer.addTo(map);
          brazilLayerRef.current = layer;
          const bounds = layer.getBounds();
          if (bounds.isValid()) {
            map.flyToBounds(bounds, { padding: [40, 40], duration: 1 });
          }
        });
      return () => { cancelled = true; };
    }

    const applyLayer = (geoJsonData: GeoJSON.GeoJsonObject, flyOptions?: L.FitBoundsOptions) => {
      if (cancelled) return;
      const layer = L.geoJSON(geoJsonData, { style: POLYGON_STYLE });
      polygonLayerRef.current = layer;
      if (!showCitiesRef.current) {
        layer.addTo(map);
      }
      const bounds = layer.getBounds();
      if (!bounds.isValid()) return;
      map.flyToBounds(bounds, { paddingTopLeft: [0, 40], paddingBottomRight: [40, 40], duration: 1, ...flyOptions });
      onCityBoundsReady?.(bounds);
    };

    const role = activeCandidate.role?.toUpperCase() ?? '';

    if (MUNICIPAL_ROLES.includes(role)) {
      // Cargo municipal — polígono do município via tbrugz
      const uf = activeCandidate.state_uf?.toUpperCase();
      if (!uf) return () => { cancelled = true; };
      const stateCode = UF_TO_IBGE[uf];
      if (!stateCode) return () => { cancelled = true; };
      const ibge = activeCandidate.city_ibge_code;
      const cityName = activeCandidate.city;
      if (!ibge && !cityName) return () => { cancelled = true; };
      fetch(
        `https://raw.githubusercontent.com/tbrugz/geodata-br/master/geojson/geojs-${stateCode}-mun.json`,
      )
        .then((r) => r.json())
        .then((data: GeoJSON.FeatureCollection) => {
          const feature = ibge
            ? data.features.find((f) => f.properties?.id === ibge)
            : data.features.find((f) => f.properties?.name?.toUpperCase() === cityName!.toUpperCase());
          if (!feature) return;
          applyLayer(feature as GeoJSON.GeoJsonObject);
        });
    } else if (STATE_ROLES.includes(role)) {
      // Cargo estadual/federal — polígono do estado via API
      const uf = activeCandidate.state_uf?.toLowerCase();
      if (!uf) return () => { cancelled = true; };
      api.get(`/states/${uf}/geometry`)
        .then((res) => applyLayer(res.data.geometry as GeoJSON.GeoJsonObject, { paddingTopLeft: [0, 20], paddingBottomRight: [20, 20], maxZoom: 7 }));
    }

    return () => { cancelled = true; };
  }, [activeCandidate, map, onCityBoundsReady]);

  useEffect(() => {
    if (brazilLayerRef.current) {
      brazilLayerRef.current.remove();
      brazilLayerRef.current = null;
    }
    if (citiesLayerRef.current) {
      citiesLayerRef.current.remove();
      citiesLayerRef.current = null;
    }
    if (!showCities) setMaxVotes(0);
    if (polygonLayerRef.current) {
      if (showCities) {
        polygonLayerRef.current.remove();
      } else {
        polygonLayerRef.current.addTo(map);
      }
    }
    if (!showCities || !activeCandidate) return;
    const role = activeCandidate.role?.toUpperCase() ?? '';
    if (!STATE_ROLES.includes(role)) return;
    const uf = activeCandidate.state_uf?.toUpperCase();
    if (!uf) return;
    const stateCode = UF_TO_IBGE[uf];
    if (!stateCode) return;

    let cancelled = false;

    Promise.all([
      fetch(`https://raw.githubusercontent.com/tbrugz/geodata-br/master/geojson/geojs-${stateCode}-mun.json`).then((r) => r.json()) as Promise<GeoJSON.FeatureCollection>,
      api.get<CityOption[]>(`/candidacies/${activeCandidate.id}/cities`).then((res) => res.data),
    ]).then(([geoData, citiesData]) => {
      if (cancelled) return;

      // Lookup: GeoJSON name → CityOption do banco (exact → normalized → Levenshtein ≤ 2)
      const exactMap = new Map<string, CityOption>();
      const normalizedMap = new Map<string, CityOption>();
      citiesData.forEach((c) => {
        exactMap.set(c.name.toUpperCase(), c);
        normalizedMap.set(normalizeName(c.name), c);
      });
      const findDbCity = (geoName: string): CityOption | null => {
        const found = exactMap.get(geoName.toUpperCase()) ?? normalizedMap.get(normalizeName(geoName));
        if (found) return found;
        const normGeo = normalizeName(geoName);
        // Prefix: nome do GeoJSON é prefixo único do nome no banco (ex: "Embu" → "Embu das Artes")
        const prefixMatches = citiesData.filter((c) => normalizeName(c.name).startsWith(normGeo + ' '));
        if (prefixMatches.length === 1) return prefixMatches[0];
        // Fuzzy: Levenshtein ≤ 2 (cobre variações como "Moji" vs "Mogi")
        let best: CityOption | null = null;
        let bestDist = 3;
        citiesData.forEach((c) => {
          const dist = levenshtein(normalizeName(c.name), normGeo);
          if (dist < bestDist) { bestDist = dist; best = c; }
        });
        return best;
      };

      const voteMap = new Map<string, number>();
      citiesData.forEach((c) => voteMap.set(c.name.toUpperCase(), c.qty_votes ?? 0));
      const localMax = Math.max(0, ...Array.from(voteMap.values()));
      setMaxVotes(localMax);

      const layer = L.geoJSON(geoData, {
        style: (feature) => {
          const geoName: string = feature?.properties?.name ?? '';
          const dbCity = findDbCity(geoName);
          const votes = dbCity ? (dbCity.qty_votes ?? 0) : (voteMap.get(geoName.toUpperCase()) ?? 0);
          if (votes === 0) return CITIES_NO_VOTES_STYLE;
          return { color: '#1D3557', weight: 1, ...getHeatColor(votes, localMax) };
        },
        onEachFeature: (feature, lyr) => {
          const geoName: string = feature.properties?.name ?? '';
          const ibge_code: string | undefined = feature.properties?.id;
          const dbCity = findDbCity(geoName);
          const displayName = dbCity?.name ?? geoName;
          if (displayName) {
            (lyr as L.Path).bindTooltip(displayName, { permanent: false, sticky: true, direction: 'top' });
          }
          (lyr as L.Path).on('click', () => {
            const bounds = (lyr as L.Polygon).getBounds();
            citiesLayerRef.current?.eachLayer((l) => citiesLayerRef.current!.resetStyle(l as L.Layer));
            (lyr as L.Path).setStyle(CITIES_HIGHLIGHT_STYLE);
            if (bounds.isValid()) {
              map.flyToBounds(bounds, { paddingTopLeft: [0, 40], paddingBottomRight: [40, 40], duration: 1 });
            }
            if (dbCity) {
              setMapClickedCity({ name: dbCity.name, ibge_code: dbCity.ibge_code ?? '', city_id: dbCity.id });
            } else if (geoName) {
              setMapClickedCity({ name: geoName, ibge_code: ibge_code ?? '' });
            }
          });
        },
      });
      layer.addTo(map);
      citiesLayerRef.current = layer;
    });

    return () => { cancelled = true; };
  }, [showCities, activeCandidate, map]);

  useEffect(() => {
    if (!focusCityOnMap || !citiesLayerRef.current) return;
    let found = false;
    citiesLayerRef.current.eachLayer((lyr) => {
      if (found) return;
      const feature = (lyr as L.GeoJSON).feature as GeoJSON.Feature | undefined;
      const featureName: string | undefined = feature?.properties?.name;
      if (featureName?.toUpperCase() === focusCityOnMap.name.toUpperCase()) {
        citiesLayerRef.current!.eachLayer((l) => citiesLayerRef.current!.resetStyle(l as L.Layer));
        (lyr as L.Path).setStyle(CITIES_HIGHLIGHT_STYLE);
        const bounds = (lyr as L.Polygon).getBounds();
        map.invalidateSize();
        map.flyToBounds(bounds, { paddingTopLeft: [0, 40], paddingBottomRight: [40, 40], duration: 1 });
        found = true;
      }
    });
    if (found) setFocusCityOnMap(null);
  }, [focusCityOnMap, map, setFocusCityOnMap]);

  useEffect(() => {
    if (!clearCityHighlight) return;
    if (citiesLayerRef.current) {
      citiesLayerRef.current.eachLayer((l) => citiesLayerRef.current!.resetStyle(l as L.Layer));
      const bounds = citiesLayerRef.current.getBounds();
      if (bounds.isValid()) {
        map.flyToBounds(bounds, { paddingTopLeft: [0, 40], paddingBottomRight: [40, 40], duration: 1 });
      }
    }
    setClearCityHighlight(false);
  }, [clearCityHighlight, map, setClearCityHighlight]);

  const fitToCity = useCallback(() => {
    if (!cityBounds) return;
    isSyncingRef.current = true;
    map.flyToBounds(cityBounds, { paddingTopLeft: [0, 40], paddingBottomRight: [40, 40], duration: 1 });
    syncRef?.current?.flyToBounds(cityBounds, { paddingTopLeft: [0, 40], paddingBottomRight: [40, 40], duration: 1 });
    setTimeout(() => {
      isSyncingRef.current = false;
    }, 1500);
  }, [cityBounds, map, isSyncingRef, syncRef]);

  return (
    <>
      {!isCompare && (
        <div className="absolute bottom-6 right-4 z-[1000] flex flex-col items-center gap-2">
          {showCities && maxVotes > 0 && (
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm px-2.5 py-2">
              <div
                className="w-2.5 rounded-full"
                style={{ background: 'linear-gradient(to bottom, #E63946, #F5A623, #52C97A, #4A90D9)', minHeight: 160 }}
              />
            </div>
          )}
          <button
            onClick={fitToCity}
            className="w-10 h-10 bg-white border border-gray-200 rounded-xl shadow-sm flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors"
          >
            <Crosshair size={16} />
          </button>

          <div className="flex flex-col bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            <button
              onClick={() => map.zoomIn()}
              className="w-10 h-10 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors"
            >
              <Plus size={16} />
            </button>
            <div className="h-px bg-gray-200 mx-2" />
            <button
              onClick={() => map.zoomOut()}
              className="w-10 h-10 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors"
            >
              <Minus size={16} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}

function CompareOverlay({ onCandidateChange }: { onCandidateChange: (c: Candidate | null) => void }) {
  const [selected, setSelected] = useState<Candidate | null>(null);

  const handleSelect = (c: Candidate) => {
    setSelected(c);
    onCandidateChange(c);
  };

  const handleClear = () => {
    setSelected(null);
    onCandidateChange(null);
  };

  if (selected) {
    const partyColors = getPartyColors(selected.party);
    return (
      <div className="absolute top-4 left-4 z-[1000]">
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-3 flex items-center gap-3 min-w-[200px]">
          <div className="relative shrink-0">
            <img src={selected.avatar} alt={selected.name} className="w-10 h-10 rounded-full object-cover" />
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
          </div>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-sm text-gray-900 truncate">{selected.name}</span>
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${partyColors.gradient ? '' : `${partyColors.bg} ${partyColors.text}`}`}
                style={partyColors.gradient ? { background: partyColors.gradient, color: 'white', textShadow: '0 1px 3px rgba(0,0,0,0.8), 0 0 6px rgba(0,0,0,0.5)', fontWeight: 'bold' } : undefined}
              >
                {selected.party}
              </span>
              <button
                onClick={handleClear}
                className="rounded-full bg-gray-100 hover:bg-gray-200 w-5 h-5 flex items-center justify-center text-gray-500 transition-colors shrink-0"
              >
                <X size={12} />
              </button>
            </div>
            <span className="text-xs text-gray-500 truncate">{selected.role}</span>
          </div>
        </div>
      </div>
    );
  }

  return <CandidateSearch onSelect={handleSelect} />;
}

interface ClickMapsMapProps {
  mapRef?: React.RefObject<L.Map | null>;
  syncRef?: React.RefObject<L.Map | null>;
  initialView?: { center: L.LatLngTuple; zoom: number };
  onCityBoundsReady?: (bounds: L.LatLngBounds) => void;
  cityBounds?: L.LatLngBounds | null;
  isCompare?: boolean;
}

export function ClickMapsMap({ mapRef, syncRef, initialView, onCityBoundsReady, cityBounds, isCompare }: ClickMapsMapProps) {
  const center: L.LatLngTuple = initialView?.center ?? [-15.7801, -47.9292];
  const zoom = initialView?.zoom ?? 4;
  const isSyncingRef = useRef(false);
  const { activeCandidate, setActiveCandidate, showCard } = useActiveCandidate();

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      zoomControl={false}
      maxBounds={BRAZIL_BOUNDS}
      maxBoundsViscosity={1.0}
      className="h-full w-full"
      style={{ zIndex: 0 }}
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        attribution='© <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors © <a href="https://carto.com/">CARTO</a>'
      />
      {isCompare
        ? <CompareOverlay onCandidateChange={setActiveCandidate} />
        : (
          <div className={`absolute top-4 left-4 z-[1000] w-64 flex flex-col gap-2 transition-opacity duration-200 ${showCard ? 'opacity-100' : 'opacity-20 hover:opacity-100'}`}>
            <CandidateCard />
            <StatsCard />
          </div>
        )
      }
      <MapResizer />
      <MinZoomController />
      {mapRef && <MapCapture mapRef={mapRef} />}
      {syncRef && <MapSync syncRef={syncRef} isSyncingRef={isSyncingRef} />}
      <MapCore
        activeCandidate={activeCandidate}
        onCityBoundsReady={onCityBoundsReady}
        cityBounds={cityBounds}
        isSyncingRef={isSyncingRef}
        syncRef={syncRef}
        isCompare={isCompare}
      />
    </MapContainer>
  );
}
