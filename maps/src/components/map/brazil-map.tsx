import '@/lib/leaflet-icon-fix';
import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import * as L from 'leaflet';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';

const BRAZIL_BOUNDS: L.LatLngBoundsExpression = [[-33.75, -73.99], [5.27, -28.85]];
const BRAZIL_GEOJSON_URL = 'https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson';

export interface BrazilMapHandle {
  zoomIn: () => void;
  zoomOut: () => void;
  fitBrazil: () => void;
}

function BrazilLayer() {
  const map = useMap();
  const layerRef = useRef<L.GeoJSON | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(BRAZIL_GEOJSON_URL)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        const brazil = {
          ...data,
          features: data.features.filter((f: any) => f.properties.ADMIN === 'Brazil'),
        };
        if (layerRef.current) map.removeLayer(layerRef.current);
        layerRef.current = L.geoJSON(brazil, {
          style: { color: '#1D3557', weight: 2, fillOpacity: 0.05 },
        }).addTo(map);
        map.fitBounds(BRAZIL_BOUNDS);
      });
    return () => { cancelled = true; };
  }, [map]);

  return null;
}

function MapController({ mapRef }: { mapRef: React.MutableRefObject<L.Map | null> }) {
  const map = useMap();
  useEffect(() => { mapRef.current = map; }, [map, mapRef]);
  return null;
}

export const BrazilMap = forwardRef<BrazilMapHandle>((_, ref) => {
  const mapRef = useRef<L.Map | null>(null);

  useImperativeHandle(ref, () => ({
    zoomIn:    () => mapRef.current?.zoomIn(),
    zoomOut:   () => mapRef.current?.zoomOut(),
    fitBrazil: () => mapRef.current?.fitBounds(BRAZIL_BOUNDS),
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
      <BrazilLayer />
      <MapController mapRef={mapRef} />
    </MapContainer>
  );
});
