import '@/lib/leaflet-icon-fix';
import { useCallback, useEffect, useRef, useState } from 'react';
import * as L from 'leaflet';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import { useLoginModal } from '@/components/auth/login-modal-context';
import { useActiveCandidate } from '@/components/map/active-candidate-context';
import { Plus, Minus, Crosshair, X } from 'lucide-react';
import { getPartyColors } from '@/lib/party-colors';
import { Skeleton } from '@/components/ui/skeleton';
import { CandidateSearch, type Candidate } from '@/components/map/candidate-search';
import api from '@/lib/api';

const BRAZIL_BOUNDS: L.LatLngBoundsExpression = [
  [-33.75, -73.99],
  [5.27, -28.85],
];

const POLYGON_STYLE = { color: '#1D3557', weight: 2, fillOpacity: 0.05 };
const CITIES_STYLE  = { color: '#1D3557', weight: 1, fillOpacity: 0.03 };

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


/* CandidateCard — desativado temporariamente, manter para uso futuro
function CandidateCard() {
  const { loggedIn } = useLoginModal();
  const { activeCandidate, setActiveCandidate } = useActiveCandidate();
  const [loading, setLoading] = useState(false);

  // Auto-load first candidate from API on login (fallback when no candidate in context yet)
  useEffect(() => {
    if (!loggedIn) { setActiveCandidate(null); return; }
    if (activeCandidate) return;
    setLoading(true);
    api.get('/candidates')
      .then((res) => {
        const raw = res.data[0];
        if (!raw) return;
        setActiveCandidate({
          id: String(raw.id),
          name: raw.name,
          ballot_name: raw.ballot_name,
          ballot_number: null,
          party: raw.party.abbreviation,
          role: raw.role,
          year: raw.year,
          state_id: null,
          state_uf: raw.state_uf,
          city_id: raw.city_id,
          city: raw.city_name ?? null,
          city_ibge_code: raw.city_ibge_code,
          photo_url: null,
          avatar: raw.avatar_url ?? undefined,
        });
      })
      .finally(() => setLoading(false));
  }, [loggedIn]);

  const partyColors = getPartyColors(activeCandidate?.party ?? '');

  return (
    <div className="absolute top-4 left-4 z-[1000]">
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-3 flex items-center gap-3 min-w-[200px]">
        {loggedIn && activeCandidate && !loading ? (
          <>
            <div className="relative shrink-0">
              <img
                src={activeCandidate.avatar || 'https://randomuser.me/api/portraits/men/32.jpg'}
                alt="Candidato"
                className="w-10 h-10 rounded-full object-cover"
              />
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
          </>
        ) : (
          <>
            <Skeleton className="w-10 h-10 rounded-full shrink-0" />
            <div className="flex flex-col gap-1.5 flex-1">
              <Skeleton className="h-3.5 w-28 rounded-full" />
              <Skeleton className="h-3 w-20 rounded-full" />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
*/

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
  const { showCities, setMapClickedCity, focusCityOnMap, setFocusCityOnMap } = useActiveCandidate();

  useEffect(() => {
    let cancelled = false;

    if (polygonLayerRef.current) {
      polygonLayerRef.current.remove();
      polygonLayerRef.current = null;
    }

    if (!activeCandidate) {
      // Restore Brazil outline
      if (!brazilLayerRef.current) {
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
      }
      return () => { cancelled = true; };
    }

    // Candidate selected — remove Brazil outline
    if (brazilLayerRef.current) {
      brazilLayerRef.current.remove();
      brazilLayerRef.current = null;
    }

    const applyLayer = (geoJsonData: GeoJSON.GeoJsonObject, flyOptions?: L.FitBoundsOptions) => {
      if (cancelled) return;
      const layer = L.geoJSON(geoJsonData, { style: POLYGON_STYLE });
      layer.addTo(map);
      polygonLayerRef.current = layer;
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
    if (citiesLayerRef.current) {
      citiesLayerRef.current.remove();
      citiesLayerRef.current = null;
    }
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
    fetch(`https://raw.githubusercontent.com/tbrugz/geodata-br/master/geojson/geojs-${stateCode}-mun.json`)
      .then((r) => r.json())
      .then((data: GeoJSON.FeatureCollection) => {
        const layer = L.geoJSON(data, {
          style: CITIES_STYLE,
          onEachFeature: (feature, lyr) => {
            const name: string | undefined = feature.properties?.name;
            const ibge_code: string | undefined = feature.properties?.id;
            if (name) {
              (lyr as L.Path).bindTooltip(name, { permanent: false, sticky: true, direction: 'top' });
            }
            (lyr as L.Path).on('click', () => {
              const bounds = (lyr as L.Polygon).getBounds();
              citiesLayerRef.current?.eachLayer((l) => (l as L.Path).setStyle(CITIES_STYLE));
              (lyr as L.Path).setStyle({ weight: 2, color: '#1D3557', fillOpacity: 0.15 });
              map.invalidateSize();
              map.flyToBounds(bounds, { paddingTopLeft: [0, 40], paddingBottomRight: [40, 40], duration: 1 });
              if (name && ibge_code) setMapClickedCity({ name, ibge_code });
            });
          },
        });
        layer.addTo(map);
        citiesLayerRef.current = layer;
      });
  }, [showCities, activeCandidate, map]);

  useEffect(() => {
    if (!focusCityOnMap || !citiesLayerRef.current) return;
    let found = false;
    citiesLayerRef.current.eachLayer((lyr) => {
      if (found) return;
      const feature = (lyr as L.GeoJSON).feature as GeoJSON.Feature | undefined;
      const featureName: string | undefined = feature?.properties?.name;
      if (featureName?.toUpperCase() === focusCityOnMap.name.toUpperCase()) {
        citiesLayerRef.current!.eachLayer((l) => (l as L.Path).setStyle(CITIES_STYLE));
        (lyr as L.Path).setStyle({ weight: 2, color: '#1D3557', fillOpacity: 0.15 });
        const bounds = (lyr as L.Polygon).getBounds();
        map.invalidateSize();
        map.flyToBounds(bounds, { paddingTopLeft: [0, 40], paddingBottomRight: [40, 40], duration: 1 });
        found = true;
      }
    });
    if (found) setFocusCityOnMap(null);
  }, [focusCityOnMap, map, setFocusCityOnMap]);

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
  const { activeCandidate, setActiveCandidate } = useActiveCandidate();

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
        : null /* <CandidateCard /> */
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
