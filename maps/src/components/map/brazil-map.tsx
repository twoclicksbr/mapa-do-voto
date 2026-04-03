import '@/lib/leaflet-icon-fix';
import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import * as L from 'leaflet';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import api from '@/lib/api';
import { type Candidate } from '@/components/map/candidate-search';

const BRAZIL_BOUNDS: L.LatLngBoundsExpression = [[-33.75, -73.99], [5.27, -28.85]];
const BRAZIL_GEOJSON_URL = 'https://servicodados.ibge.gov.br/api/v3/malhas/paises/BR?formato=application/vnd.geo+json&resolucao=5';

const MUNICIPAL_ROLES = ['PREFEITO', 'PREFEITA', 'VICE-PREFEITO', 'VICE-PREFEITA', 'VEREADOR', 'VEREADORA'];
const STATE_ROLES = ['DEPUTADO ESTADUAL', 'DEPUTADA ESTADUAL', 'DEPUTADO FEDERAL', 'DEPUTADA FEDERAL', 'SENADOR', 'SENADORA', 'GOVERNADOR', 'GOVERNADORA'];

const UF_TO_IBGE: Record<string, string> = {
  AC: '12', AL: '27', AP: '16', AM: '13', BA: '29',
  CE: '23', DF: '53', ES: '32', GO: '52', MA: '21',
  MT: '51', MS: '50', MG: '31', PA: '15', PB: '25',
  PR: '41', PE: '26', PI: '22', RJ: '33', RN: '24',
  RS: '43', RO: '11', RR: '14', SC: '42', SP: '35',
  SE: '28', TO: '17',
};

function normalizeName(s: string): string {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().trim();
}

export interface BrazilMapHandle {
  zoomIn: () => void;
  zoomOut: () => void;
  fitBrazil: () => void;
  fitState: () => void;
  focusCity: (name: string) => void;
}

function MapCore({ candidate, onCityClick, stateBoundsRef, focusCityRef }: {
  candidate: Candidate | null;
  onCityClick?: (name: string) => void;
  stateBoundsRef: React.MutableRefObject<L.LatLngBounds | null>;
  focusCityRef: React.MutableRefObject<((name: string) => void) | null>;
}) {
  const map = useMap();
  const brazilLayerRef  = useRef<L.GeoJSON | null>(null);
  const polygonLayerRef = useRef<L.GeoJSON | null>(null);
  const citiesLayerRef  = useRef<L.GeoJSON | null>(null);

  // Carrega o contorno do Brasil uma única vez
  useEffect(() => {
    let cancelled = false;
    fetch(BRAZIL_GEOJSON_URL)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        const layer = L.geoJSON(data, {
          style: { color: '#1D3557', weight: 2, fillOpacity: 0.05 },
        });
        brazilLayerRef.current = layer;
        layer.addTo(map);
        map.invalidateSize();
        map.fitBounds(BRAZIL_BOUNDS);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [map]);

  // Reage ao candidato selecionado
  useEffect(() => {
    let cancelled = false;

    // Limpa camadas anteriores do candidato
    if (polygonLayerRef.current) { polygonLayerRef.current.remove(); polygonLayerRef.current = null; }
    if (citiesLayerRef.current)  { citiesLayerRef.current.remove();  citiesLayerRef.current  = null; }

    if (!candidate) {
      // Sem candidato → mostra Brasil
      if (brazilLayerRef.current) brazilLayerRef.current.addTo(map);
      map.fitBounds(BRAZIL_BOUNDS);
      return () => { cancelled = true; };
    }

    // Com candidato → esconde Brasil
    if (brazilLayerRef.current) brazilLayerRef.current.remove();

    const role = candidate.role?.toUpperCase() ?? '';

    if (MUNICIPAL_ROLES.includes(role)) {
      // Municipal → polígono da cidade via tbrugz
      const uf = candidate.state_uf?.toUpperCase();
      const stateCode = uf ? UF_TO_IBGE[uf] : null;
      const cityName = candidate.city;
      if (!stateCode || !cityName) return () => { cancelled = true; };

      fetch(`https://raw.githubusercontent.com/tbrugz/geodata-br/master/geojson/geojs-${stateCode}-mun.json`)
        .then((r) => r.json())
        .then((data: GeoJSON.FeatureCollection) => {
          if (cancelled) return;
          const normCity = normalizeName(cityName);
          const feature =
            data.features.find((f) => normalizeName(f.properties?.name ?? '') === normCity) ??
            data.features.find((f) => normalizeName(f.properties?.name ?? '').startsWith(normCity));
          if (!feature) return;
          const cityLabel = feature.properties?.name ?? cityName;
          const layer = L.geoJSON(feature as GeoJSON.GeoJsonObject, {
            style: { color: '#1D3557', weight: 2, fillOpacity: 0.05 },
            onEachFeature: (_f, lyr) => {
              (lyr as L.Path).bindTooltip(cityLabel, { permanent: false, sticky: true, direction: 'top' });
            },
          });
          polygonLayerRef.current = layer;
          layer.addTo(map);
          const bounds = layer.getBounds();
          if (bounds.isValid()) map.flyToBounds(bounds, { padding: [40, 40], duration: 1 });
        })
        .catch(() => {});

    } else if (STATE_ROLES.includes(role)) {
      // Estadual → polígono do estado + divisões de municípios
      const ufLower = candidate.state_uf?.toLowerCase();
      const ufUpper = candidate.state_uf?.toUpperCase();
      const stateCode = ufUpper ? UF_TO_IBGE[ufUpper] : null;
      if (!ufLower || !stateCode) return () => { cancelled = true; };

      Promise.all([
        api.get(`/states/${ufLower}/geometry`),
        fetch(`https://raw.githubusercontent.com/tbrugz/geodata-br/master/geojson/geojs-${stateCode}-mun.json`).then((r) => r.json()),
      ]).then(([stateRes, munData]) => {
        if (cancelled) return;

        // Divisões dos municípios (camada base)
        let citiesLayerLocal: L.GeoJSON;
        citiesLayerLocal = L.geoJSON(munData as GeoJSON.GeoJsonObject, {
          style: { color: '#1D3557', weight: 0.8, fillOpacity: 0.04, fillColor: '#1D3557' },
          onEachFeature: (feature, lyr) => {
            const name: string = feature.properties?.name ?? '';
            if (name) (lyr as L.Path).bindTooltip(name, { permanent: false, sticky: true, direction: 'top' });
            (lyr as L.Path).on('click', () => {
              const bounds = (lyr as L.Polygon).getBounds();
              if (!bounds.isValid()) return;
              // Destaca cidade clicada, reseta as demais
              citiesLayerLocal.eachLayer((l) => citiesLayerLocal.resetStyle(l as L.Layer));
              (lyr as L.Path).setStyle({ color: '#1D3557', weight: 2, fillColor: '#1D3557', fillOpacity: 0.18 });
              map.flyToBounds(bounds, { padding: [40, 40], duration: 1 });
              if (name) onCityClick?.(name);
            });
          },
        });
        citiesLayerLocal.addTo(map);
        citiesLayerRef.current = citiesLayerLocal;

        // Expõe função de foco por nome para o handle externo
        focusCityRef.current = (name: string) => {
          const normTarget = normalizeName(name);
          citiesLayerLocal.eachLayer((lyr) => {
            const feature = (lyr as L.GeoJSON).feature as GeoJSON.Feature | undefined;
            const featureName: string = feature?.properties?.name ?? '';
            if (normalizeName(featureName) !== normTarget) return;
            const bounds = (lyr as L.Polygon).getBounds();
            if (!bounds.isValid()) return;
            citiesLayerLocal.eachLayer((l) => citiesLayerLocal.resetStyle(l as L.Layer));
            (lyr as L.Path).setStyle({ color: '#1D3557', weight: 2, fillColor: '#1D3557', fillOpacity: 0.18 });
            map.flyToBounds(bounds, { padding: [40, 40], duration: 1 });
          });
        };

        // Contorno do estado por cima
        const stateLayer = L.geoJSON(stateRes.data.geometry as GeoJSON.GeoJsonObject, {
          style: { color: '#1D3557', weight: 2.5, fill: false },
        });
        stateLayer.addTo(map);
        polygonLayerRef.current = stateLayer;

        const bounds = stateLayer.getBounds();
        if (bounds.isValid()) {
          stateBoundsRef.current = bounds;
          map.flyToBounds(bounds, { paddingTopLeft: [0, 20], paddingBottomRight: [20, 20], maxZoom: 8, duration: 1 });
        }
      }).catch(() => {});
    }

    return () => { cancelled = true; };
  }, [candidate, map]);

  return null;
}

function MapController({ mapRef }: { mapRef: React.MutableRefObject<L.Map | null> }) {
  const map = useMap();
  useEffect(() => { mapRef.current = map; }, [map, mapRef]);
  return null;
}

export const BrazilMap = forwardRef<BrazilMapHandle, { candidate: Candidate | null; onCityClick?: (name: string) => void }>(
  ({ candidate, onCityClick }, ref) => {
    const mapRef         = useRef<L.Map | null>(null);
    const stateBoundsRef = useRef<L.LatLngBounds | null>(null);
    const focusCityRef   = useRef<((name: string) => void) | null>(null);

    useImperativeHandle(ref, () => ({
      zoomIn:    () => mapRef.current?.zoomIn(),
      zoomOut:   () => mapRef.current?.zoomOut(),
      fitBrazil: () => {
        mapRef.current?.invalidateSize();
        mapRef.current?.fitBounds(BRAZIL_BOUNDS);
      },
      fitState: () => {
        if (stateBoundsRef.current && mapRef.current) {
          mapRef.current.flyToBounds(stateBoundsRef.current, { paddingTopLeft: [0, 20], paddingBottomRight: [20, 20], maxZoom: 8, duration: 1 });
        }
      },
      focusCity: (name: string) => focusCityRef.current?.(name),
    }));

    return (
      <MapContainer
        center={[-14.235, -51.925]}
        zoom={4}
        zoomControl={false}
        scrollWheelZoom={true}
        className="w-full h-full rounded-lg"
        style={{ background: '#f8f8f8' }}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>'
        />
        <MapCore candidate={candidate} onCityClick={onCityClick} stateBoundsRef={stateBoundsRef} focusCityRef={focusCityRef} />
        <MapController mapRef={mapRef} />
      </MapContainer>
    );
  },
);
