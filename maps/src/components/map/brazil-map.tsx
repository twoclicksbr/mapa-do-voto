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


export interface Zone {
  id: number;
  zone_number: number | string;
  qty_votes: number;
  geometry?: GeoJSON.Geometry | null;
}

export interface AddressMarker {
  id: number;
  name: string;
  lat: number;
  lng: number;
}

export interface VotingLocation {
  id: number;
  name: string;
  tse_number: string | number;
  qty_votes: number;
  latitude: number | null;
  longitude: number | null;
}

export interface BrazilMapHandle {
  zoomIn: () => void;
  zoomOut: () => void;
  fitBrazil: () => void;
  fitState: () => void;
  focusCity: (name: string) => void;
  focusZone: () => void;
  invalidateSize: () => void;
}

function MapCore({
  candidate, showCities, selectedCityName, onCityClick,
  showZones, zones, selectedZoneId, onZoneClick,
  votingLocations, selectedVotingLocationId, onVotingLocationClick,
  pessoasMarkers, atendimentosMarkers,
  stateBoundsRef, focusCityRef, focusZoneRef,
}: {
  candidate: Candidate | null;
  showCities: boolean;
  selectedCityName?: string | null;
  onCityClick?: (name: string) => void;
  showZones?: boolean;
  zones?: Zone[];
  selectedZoneId?: number | null;
  onZoneClick?: (id: number) => void;
  votingLocations?: VotingLocation[];
  selectedVotingLocationId?: number | null;
  onVotingLocationClick?: (id: number) => void;
  pessoasMarkers?: AddressMarker[];
  atendimentosMarkers?: AddressMarker[];
  stateBoundsRef: React.MutableRefObject<L.LatLngBounds | null>;
  focusCityRef: React.MutableRefObject<((name: string) => void) | null>;
  focusZoneRef: React.MutableRefObject<(() => void) | null>;
}) {
  const map = useMap();
  const brazilLayerRef          = useRef<L.GeoJSON | null>(null);
  const polygonLayerRef         = useRef<L.GeoJSON | null>(null);
  const citiesLayerRef          = useRef<L.GeoJSON | null>(null);
  const selectedCityLayerRef    = useRef<L.GeoJSON | null>(null);
  const zonesLayerRef           = useRef<L.GeoJSON | null>(null);
  const vlMarkersRef            = useRef<L.LayerGroup | null>(null);
  const pessoasMarkersRef       = useRef<L.LayerGroup | null>(null);
  const atendimentosMarkersRef  = useRef<L.LayerGroup | null>(null);
  const showCitiesRef        = useRef(showCities);
  useEffect(() => { showCitiesRef.current = showCities; }, [showCities]);

  // Adiciona/remove camadas quando showCities muda
  useEffect(() => {
    if (!citiesLayerRef.current && !polygonLayerRef.current) return;
    if (showCities) {
      if (!selectedCityName) citiesLayerRef.current?.addTo(map);
      polygonLayerRef.current?.remove();
    } else {
      citiesLayerRef.current?.remove();
      selectedCityLayerRef.current?.remove();
      selectedCityLayerRef.current = null;
      polygonLayerRef.current?.addTo(map);
      if (stateBoundsRef.current) {
        map.flyToBounds(stateBoundsRef.current, { padding: [20, 20], duration: 1 });
      }
    }
  }, [showCities, map]);

  // Quando cidade selecionada muda: esconde todas as cidades, mostra só a selecionada
  useEffect(() => {
    selectedCityLayerRef.current?.remove();
    selectedCityLayerRef.current = null;

    if (!showCities) return;

    if (selectedCityName && citiesLayerRef.current) {
      citiesLayerRef.current.remove();
      const normTarget = normalizeName(selectedCityName);
      citiesLayerRef.current.eachLayer((lyr) => {
        const feature = (lyr as L.GeoJSON).feature as GeoJSON.Feature | undefined;
        const name: string = feature?.properties?.name ?? '';
        if (normalizeName(name) !== normTarget) return;
        const singleLayer = L.geoJSON(feature as GeoJSON.GeoJsonObject, {
          style: { color: '#1D3557', weight: 2, fillColor: '#1D3557', fillOpacity: 0.18 },
          onEachFeature: (_f, l) => {
            if (name) (l as L.Path).bindTooltip(name, { permanent: false, sticky: true, direction: 'top' });
            (l as L.Path).on('click', () => onCityClick?.(name));
          },
        });
        singleLayer.addTo(map);
        selectedCityLayerRef.current = singleLayer;
        const bounds = singleLayer.getBounds();
        if (bounds.isValid()) map.flyToBounds(bounds, { padding: [40, 40], duration: 1 });
      });
    } else if (!selectedCityName && citiesLayerRef.current) {
      citiesLayerRef.current.eachLayer((l) => citiesLayerRef.current!.resetStyle(l as L.Layer));
      citiesLayerRef.current.addTo(map);
      if (stateBoundsRef.current) {
        map.flyToBounds(stateBoundsRef.current, { padding: [20, 20], duration: 1 });
      }
    }
  }, [selectedCityName, showCities, map]);

  // Render de zonas eleitorais — cidade some quando zonas aparecem
  useEffect(() => {
    zonesLayerRef.current?.remove();
    zonesLayerRef.current = null;

    if (!showZones || !zones || zones.length === 0) {
      // Zonas desligadas → restaura cidade selecionada se existir
      if (selectedCityLayerRef.current) selectedCityLayerRef.current.addTo(map);
      return;
    }

    const withGeometry = zones.filter((z) => z.geometry);
    if (withGeometry.length === 0) return;

    // Esconde a cidade — zona substitui
    selectedCityLayerRef.current?.remove();

    const featureCollection: GeoJSON.FeatureCollection = {
      type: 'FeatureCollection',
      features: withGeometry.map((z) => ({
        type: 'Feature',
        properties: { id: z.id, zone_number: z.zone_number, qty_votes: z.qty_votes },
        geometry: z.geometry as GeoJSON.Geometry,
      })),
    };

    const layer = L.geoJSON(featureCollection, {
      style: (feature) => {
        const zoneId = feature?.properties?.id;
        const isSelected = selectedZoneId != null && zoneId === selectedZoneId;
        return isSelected
          ? { color: '#1D3557', weight: 2, fillColor: '#1D3557', fillOpacity: 0.18 }
          : { color: '#1D3557', weight: 1, fillColor: '#1D3557', fillOpacity: 0.08 };
      },
      onEachFeature: (feature, lyr) => {
        const zoneNum = feature.properties?.zone_number;
        const zoneId  = feature.properties?.id;
        const city    = selectedCityName ?? '';
        const label   = `${city} - Zona: ${zoneNum}`;
        (lyr as L.Path).bindTooltip(label, { permanent: false, sticky: true, direction: 'top' });
        (lyr as L.Path).on('click', () => onZoneClick?.(zoneId));
      },
    });

    layer.addTo(map);
    zonesLayerRef.current = layer;

    const bounds = layer.getBounds();
    if (bounds.isValid()) map.flyToBounds(bounds, { padding: [30, 30], duration: 1 });
  }, [showZones, zones, map]);

  // Atualiza estilo da zona selecionada sem recriar a camada
  useEffect(() => {
    focusZoneRef.current = null;
    if (!zonesLayerRef.current) return;
    zonesLayerRef.current.eachLayer((lyr) => {
      const feature = (lyr as L.GeoJSON).feature as GeoJSON.Feature | undefined;
      const zoneId  = feature?.properties?.id;
      const isSelected = selectedZoneId != null && zoneId === selectedZoneId;
      (lyr as L.Path).setStyle(
        isSelected
          ? { color: '#1D3557', weight: 2, fillColor: '#1D3557', fillOpacity: 0.18 }
          : { color: '#1D3557', weight: 1, fillColor: '#1D3557', fillOpacity: 0.08 }
      );
      if (isSelected) {
        const bounds = (lyr as L.Polygon).getBounds();
        if (bounds.isValid()) {
          map.flyToBounds(bounds, { padding: [30, 30], duration: 1 });
          focusZoneRef.current = () => map.flyToBounds(bounds, { padding: [30, 30], duration: 1 });
        }
      }
    });
  }, [selectedZoneId, map]);

  // Markers de colégios eleitorais
  useEffect(() => {
    vlMarkersRef.current?.remove();
    vlMarkersRef.current = null;

    const valid = (votingLocations ?? []).filter((vl) => vl.latitude != null && vl.longitude != null);
    if (valid.length === 0) return;

    const group = L.layerGroup();

    valid.forEach((vl) => {
      const isSelected = selectedVotingLocationId != null && vl.id === selectedVotingLocationId;
      const color      = isSelected ? '#E63946' : '#2A9D8F';
      const size       = isSelected ? 36 : 30;

      const icon = L.divIcon({
        className: '',
        iconSize:  [size, size],
        iconAnchor: [size / 2, size / 2],
        html: `<div style="
          width:${size}px;height:${size}px;border-radius:50%;
          background:${color};
          border:2.5px solid #fff;
          box-shadow:0 1px 4px rgba(0,0,0,0.3);
          display:flex;align-items:center;justify-content:center;
        ">
          <svg xmlns="http://www.w3.org/2000/svg" width="${Math.round(size * 0.52)}" height="${Math.round(size * 0.52)}" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
        </div>`,
      });

      const marker = L.marker([vl.latitude as number, vl.longitude as number], { icon });

      marker.bindTooltip(vl.name, { sticky: true, direction: 'top' });

      marker.on('click', () => onVotingLocationClick?.(vl.id));
      group.addLayer(marker);
    });

    group.addTo(map);
    vlMarkersRef.current = group;
  }, [votingLocations, selectedVotingLocationId, map]);

  // Markers de pessoas (azul)
  useEffect(() => {
    pessoasMarkersRef.current?.remove();
    pessoasMarkersRef.current = null;
    if (!pessoasMarkers || pessoasMarkers.length === 0) return;
    const group = L.layerGroup();
    pessoasMarkers.forEach((m) => {
      const size = 28;
      const icon = L.divIcon({
        className: '',
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
        html: `<div style="width:${size}px;height:${size}px;border-radius:50%;background:#3B82F6;border:2.5px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;">
          <svg xmlns="http://www.w3.org/2000/svg" width="${Math.round(size*0.52)}" height="${Math.round(size*0.52)}" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
        </div>`,
      });
      L.marker([m.lat, m.lng], { icon }).bindTooltip(m.name, { sticky: true, direction: 'top' }).addTo(group);
    });
    group.addTo(map);
    pessoasMarkersRef.current = group;
  }, [pessoasMarkers, map]);

  // Markers de atendimentos (amarelo)
  useEffect(() => {
    atendimentosMarkersRef.current?.remove();
    atendimentosMarkersRef.current = null;
    if (!atendimentosMarkers || atendimentosMarkers.length === 0) return;
    const group = L.layerGroup();
    atendimentosMarkers.forEach((m) => {
      const size = 28;
      const icon = L.divIcon({
        className: '',
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
        html: `<div style="width:${size}px;height:${size}px;border-radius:50%;background:#F59E0B;border:2.5px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;">
          <svg xmlns="http://www.w3.org/2000/svg" width="${Math.round(size*0.52)}" height="${Math.round(size*0.52)}" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8"/><path d="M12 17v4"/><path d="M9.5 11.5 12 9l2.5 2.5"/><path d="M12 9v6"/>
          </svg>
        </div>`,
      });
      L.marker([m.lat, m.lng], { icon }).bindTooltip(m.name, { sticky: true, direction: 'top' }).addTo(group);
    });
    group.addTo(map);
    atendimentosMarkersRef.current = group;
  }, [atendimentosMarkers, map]);

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

    if (polygonLayerRef.current) { polygonLayerRef.current.remove(); polygonLayerRef.current = null; }
    if (citiesLayerRef.current)  { citiesLayerRef.current.remove();  citiesLayerRef.current  = null; }

    if (!candidate) {
      if (brazilLayerRef.current) brazilLayerRef.current.addTo(map);
      map.fitBounds(BRAZIL_BOUNDS);
      return () => { cancelled = true; };
    }

    if (brazilLayerRef.current) brazilLayerRef.current.remove();

    const role = candidate.role?.toUpperCase() ?? '';

    if (MUNICIPAL_ROLES.includes(role)) {
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
      const ufLower = candidate.state_uf?.toLowerCase();
      const ufUpper = candidate.state_uf?.toUpperCase();
      const stateCode = ufUpper ? UF_TO_IBGE[ufUpper] : null;
      if (!ufLower || !stateCode) return () => { cancelled = true; };

      Promise.all([
        api.get(`/states/${ufLower}/geometry`),
        fetch(`https://raw.githubusercontent.com/tbrugz/geodata-br/master/geojson/geojs-${stateCode}-mun.json`).then((r) => r.json()),
      ]).then(([stateRes, munData]) => {
        if (cancelled) return;

        let citiesLayerLocal: L.GeoJSON;
        citiesLayerLocal = L.geoJSON(munData as GeoJSON.GeoJsonObject, {
          style: { color: '#1D3557', weight: 0.8, fillOpacity: 0.04, fillColor: '#1D3557' },
          onEachFeature: (feature, lyr) => {
            const name: string = feature.properties?.name ?? '';
            if (name) (lyr as L.Path).bindTooltip(name, { permanent: false, sticky: true, direction: 'top' });
            (lyr as L.Path).on('click', () => {
              const bounds = (lyr as L.Polygon).getBounds();
              if (!bounds.isValid()) return;
              citiesLayerLocal.eachLayer((l) => citiesLayerLocal.resetStyle(l as L.Layer));
              (lyr as L.Path).setStyle({ color: '#1D3557', weight: 2, fillColor: '#1D3557', fillOpacity: 0.18 });
              map.flyToBounds(bounds, { padding: [40, 40], duration: 1 });
              if (name) onCityClick?.(name);
            });
          },
        });
        if (showCitiesRef.current) citiesLayerLocal.addTo(map);
        citiesLayerRef.current = citiesLayerLocal;

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

        const stateLabel = candidate.state_uf?.toUpperCase() ?? '';
        const stateLayer = L.geoJSON(stateRes.data.geometry as GeoJSON.GeoJsonObject, {
          style: { color: '#1D3557', weight: 2.5, fillColor: '#1D3557', fillOpacity: 0.04 },
          onEachFeature: (_f, lyr) => {
            if (stateLabel) (lyr as L.Path).bindTooltip(stateLabel, { permanent: false, sticky: true, direction: 'top' });
          },
        });
        if (!showCitiesRef.current) stateLayer.addTo(map);
        polygonLayerRef.current = stateLayer;

        const bounds = stateLayer.getBounds();
        if (bounds.isValid()) {
          stateBoundsRef.current = bounds;
          map.flyToBounds(bounds, { padding: [20, 20], duration: 1 });
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

export const BrazilMap = forwardRef<BrazilMapHandle, {
  candidate: Candidate | null;
  showCities?: boolean;
  selectedCityName?: string | null;
  onCityClick?: (name: string) => void;
  showZones?: boolean;
  zones?: Zone[];
  selectedZoneId?: number | null;
  onZoneClick?: (id: number) => void;
  votingLocations?: VotingLocation[];
  selectedVotingLocationId?: number | null;
  onVotingLocationClick?: (id: number) => void;
  pessoasMarkers?: AddressMarker[];
  atendimentosMarkers?: AddressMarker[];
}>(
  ({ candidate, showCities = false, selectedCityName, onCityClick, showZones, zones, selectedZoneId, onZoneClick, votingLocations, selectedVotingLocationId, onVotingLocationClick, pessoasMarkers, atendimentosMarkers }, ref) => {
    const mapRef         = useRef<L.Map | null>(null);
    const stateBoundsRef = useRef<L.LatLngBounds | null>(null);
    const focusCityRef   = useRef<((name: string) => void) | null>(null);
    const focusZoneRef   = useRef<(() => void) | null>(null);

    useImperativeHandle(ref, () => ({
      zoomIn:    () => mapRef.current?.zoomIn(),
      zoomOut:   () => mapRef.current?.zoomOut(),
      fitBrazil: () => {
        mapRef.current?.invalidateSize();
        mapRef.current?.fitBounds(BRAZIL_BOUNDS);
      },
      fitState: () => {
        if (stateBoundsRef.current && mapRef.current) {
          mapRef.current.flyToBounds(stateBoundsRef.current, { padding: [20, 20], duration: 1 });
        }
      },
      focusCity:      (name: string) => focusCityRef.current?.(name),
      focusZone:      () => focusZoneRef.current?.(),
      invalidateSize: () => mapRef.current?.invalidateSize(),
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
        <MapCore
          candidate={candidate}
          showCities={showCities}
          selectedCityName={selectedCityName}
          onCityClick={onCityClick}
          showZones={showZones}
          zones={zones}
          selectedZoneId={selectedZoneId}
          onZoneClick={onZoneClick}
          votingLocations={votingLocations}
          selectedVotingLocationId={selectedVotingLocationId}
          onVotingLocationClick={onVotingLocationClick}
          pessoasMarkers={pessoasMarkers}
          atendimentosMarkers={atendimentosMarkers}
          stateBoundsRef={stateBoundsRef}
          focusCityRef={focusCityRef}
          focusZoneRef={focusZoneRef}
        />
        <MapController mapRef={mapRef} />
      </MapContainer>
    );
  },
);
