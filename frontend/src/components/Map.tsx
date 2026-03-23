import { useCallback, useRef, useState } from 'react';
import MapGL, {
  Layer,
  Popup,
  Source,
  type MapRef,
  type MapLayerMouseEvent,
} from 'react-map-gl/maplibre';
import type { CircleLayerSpecification } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import StopPopup from './StopPopup';
import MapControls from './MapControls';

const MAP_STYLE = 'https://tiles.openfreemap.org/styles/liberty';

const HELSINKI_CENTER = { longitude: 24.9414, latitude: 60.1718, zoom: 12 };

interface StopProperties {
  gtfs_id: string;
  name: string;
  code: string | null;
  vehicle_type: number | null;
}

interface PopupInfo {
  longitude: number;
  latitude: number;
  gtfsId: string;
  name: string;
  code: string | null;
}

const stopsLayerCircle: CircleLayerSpecification = {
  id: 'stops-circle',
  type: 'circle',
  source: 'stops',
  paint: {
    'circle-radius': 6,
    'circle-color': '#22C55E',
    'circle-stroke-width': 1.5,
    'circle-stroke-color': '#0F172A',
    'circle-opacity': 0.9,
  },
};

export default function Map() {
  const mapRef = useRef<MapRef>(null);
  const [stopsGeoJSON, setStopsGeoJSON] = useState<GeoJSON.FeatureCollection>({
    type: 'FeatureCollection',
    features: [],
  });
  const [popup, setPopup] = useState<PopupInfo | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchStops = useCallback(async () => {
    const map = mapRef.current;
    if (!map) return;

    const bounds = map.getBounds();
    const bbox = [
      bounds.getWest(),
      bounds.getSouth(),
      bounds.getEast(),
      bounds.getNorth(),
    ].join(',');

    setLoading(true);
    try {
      const res = await fetch(`/api/stops?bbox=${bbox}`);
      if (!res.ok) throw new Error(`API error ${res.status}`);
      const data: GeoJSON.FeatureCollection = await res.json();
      setStopsGeoJSON(data);
    } catch (err) {
      console.error('Failed to fetch stops:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleClick = useCallback((e: MapLayerMouseEvent) => {
    const feature = e.features?.[0];
    if (!feature || feature.geometry.type !== 'Point') return;

    const props = feature.properties as StopProperties;
    const [longitude, latitude] = feature.geometry.coordinates;

    setPopup({
      longitude,
      latitude,
      gtfsId: props.gtfs_id,
      name: props.name,
      code: props.code,
    });

    // Pan so the marker sits in the lower portion of the canvas,
    // giving the popup (~260px tall) clearance above the 48px navbar.
    mapRef.current?.easeTo({
      center: [longitude, latitude],
      offset: [0, 120],
      duration: 300,
    });
  }, []);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <MapGL
        ref={mapRef}
        initialViewState={HELSINKI_CENTER}
        style={{ width: '100%', height: '100%' }}
        mapStyle={MAP_STYLE}
        onMoveEnd={fetchStops}
        onLoad={fetchStops}
        onClick={handleClick}
        interactiveLayerIds={['stops-circle']}
        cursor="pointer"
      >
        <Source id="stops" type="geojson" data={stopsGeoJSON}>
          <Layer {...stopsLayerCircle} />
        </Source>

        {popup && (
          <Popup
            longitude={popup.longitude}
            latitude={popup.latitude}
            anchor="bottom"
            onClose={() => setPopup(null)}
            closeOnClick={false}
            maxWidth="420px"
            style={{ padding: 0 }}
          >
            <StopPopup
              gtfsId={popup.gtfsId}
              stopName={popup.name}
              stopCode={popup.code}
            />
          </Popup>
        )}
      </MapGL>

      <MapControls mapRef={mapRef} />

      {loading && (
        <div style={{
          position: 'absolute',
          bottom: 24,
          right: 24,
          background: '#1E293B',
          border: '1px solid #334155',
          borderRadius: 6,
          padding: '6px 12px',
          fontSize: 12,
          color: '#22C55E',
          fontFamily: "'Fira Code', monospace",
          boxShadow: '0 4px 6px rgba(0,0,0,0.2)',
        }}>
          loading stops…
        </div>
      )}
    </div>
  );
}
