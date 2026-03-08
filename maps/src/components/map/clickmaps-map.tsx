import '@/lib/leaflet-icon-fix';
import { useCallback, useEffect, useRef, useState } from 'react';
import * as L from 'leaflet';
import { GeoJSON, MapContainer, TileLayer, useMap } from 'react-leaflet';
import { useLoginModal } from '@/components/auth/login-modal-context';
import { Plus, Minus, Crosshair, X } from 'lucide-react';
import { getPartyColors } from '@/lib/party-colors';
import { Skeleton } from '@/components/ui/skeleton';
import { CandidateSearch, type Candidate } from '@/components/map/candidate-search';

const BRAZIL_BOUNDS: L.LatLngBoundsExpression = [
  [-33.75, -73.99],
  [5.27, -28.85],
];

const SP_IBGE = '3550308';
const SP_GEOJSON_URL =
  'https://raw.githubusercontent.com/tbrugz/geodata-br/master/geojson/geojs-35-mun.json';

function CandidateCard() {
  const { loggedIn } = useLoginModal();
  const party = 'PL';
  const partyColors = getPartyColors(party);

  return (
    <div className="absolute top-4 left-4 z-[1000]">
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-3 flex items-center gap-3 min-w-[200px]">
        {loggedIn ? (
          <>
            <div className="relative shrink-0">
              <img
                src="https://randomuser.me/api/portraits/men/32.jpg"
                alt="Candidato"
                className="w-10 h-10 rounded-full object-cover"
              />
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-sm text-gray-900 truncate">Neto Bota</span>
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${partyColors.gradient ? '' : `${partyColors.bg} ${partyColors.text}`}`}
                  style={partyColors.gradient ? { background: partyColors.gradient, color: 'white', textShadow: '0 1px 3px rgba(0,0,0,0.8), 0 0 6px rgba(0,0,0,0.5)', fontWeight: 'bold' } : undefined}
                >
                  {party}
                </span>
              </div>
              <span className="text-xs text-gray-500 truncate">Deputado Estadual</span>
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

function MapResizer() {
  const map = useMap();
  useEffect(() => {
    const handler = () => map.invalidateSize();
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
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
 * boundsRef e map (via useMap) são totalmente internos — sem prop-passing para handlers.
 * Gerencia: GeoJSON de São Paulo, clique na cidade, crosshair e zoom.
 */
function MapCore({
  onCityBoundsReady,
  cityBounds,
  isSyncingRef,
  syncRef,
  isCompare,
}: {
  onCityBoundsReady?: (bounds: L.LatLngBounds) => void;
  cityBounds?: L.LatLngBounds | null;
  isSyncingRef: React.RefObject<boolean>;
  syncRef?: React.RefObject<L.Map | null>;
  isCompare?: boolean;
}) {
  const map = useMap();
  const { loggedIn } = useLoginModal();
  const [geoData, setGeoData] = useState<GeoJSON.FeatureCollection | null>(null);

  useEffect(() => {
    if (!loggedIn || geoData) return;
    fetch(SP_GEOJSON_URL)
      .then((r) => r.json())
      .then((data: GeoJSON.FeatureCollection) => {
        const feature = data.features.find(
          (f) => f.properties?.id === SP_IBGE,
        );
        if (!feature) return;
        const collection: GeoJSON.FeatureCollection = {
          type: 'FeatureCollection',
          features: [feature],
        };
        setGeoData(collection);
        map.invalidateSize();
        const bounds = L.geoJSON(collection).getBounds();
        onCityBoundsReady?.(bounds);
        const center = bounds.getCenter();
        map.flyTo([center.lat, center.lng], 10, { duration: 2 });
        map.once('moveend', () => {
          map.fitBounds(bounds, { padding: [40, 40], animate: true, duration: 1 });
        });
      });
  }, [loggedIn, geoData, map, onCityBoundsReady]);

  const fitToCity = useCallback(() => {
    if (!cityBounds) return;
    isSyncingRef.current = true;
    map.flyToBounds(cityBounds, { padding: [40, 40], duration: 1 });
    syncRef?.current?.flyToBounds(cityBounds, { padding: [40, 40], duration: 1 });
    setTimeout(() => {
      isSyncingRef.current = false;
    }, 1500);
  }, [cityBounds, map, isSyncingRef, syncRef]);

  const fitToCityRef = useRef<() => void>(() => {});
  useEffect(() => {
    fitToCityRef.current = fitToCity;
  }, [fitToCity]);

  const onEachFeature = useCallback(
    (_feature: GeoJSON.Feature, layer: L.Layer) => {
      layer.on('click', () => fitToCityRef.current());
    },
    [],
  );

  return (
    <>
      {loggedIn && geoData && (
        <GeoJSON
          key="sp-boundary"
          data={geoData}
          style={{ color: '#1D3557', weight: 2, fillOpacity: 0.05 }}
          onEachFeature={onEachFeature}
        />
      )}

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

function CompareOverlay() {
  const [selected, setSelected] = useState<Candidate | null>(null);

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
                onClick={() => setSelected(null)}
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

  return <CandidateSearch onSelect={setSelected} />;
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
      {isCompare ? <CompareOverlay /> : <CandidateCard />}
      <MapResizer />
      <MinZoomController />
      {mapRef && <MapCapture mapRef={mapRef} />}
      {syncRef && <MapSync syncRef={syncRef} isSyncingRef={isSyncingRef} />}
      <MapCore onCityBoundsReady={onCityBoundsReady} cityBounds={cityBounds} isSyncingRef={isSyncingRef} syncRef={syncRef} isCompare={isCompare} />
    </MapContainer>
  );
}
