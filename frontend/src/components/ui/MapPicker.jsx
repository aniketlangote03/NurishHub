import { useState, useRef, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import { MapPin } from 'lucide-react';
import L from 'leaflet';

// Create a custom icon because default leaflet marker icons are broken in react-leaflet without extra webpack config
const icon = L.divIcon({
  className: 'custom-leaflet-icon',
  html: `<div style="color: var(--primary-500); filter: drop-shadow(0 4px 6px rgba(0,0,0,0.3)); display: flex; align-items: center; justify-content: center;"><svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="currentColor" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path><circle cx="12" cy="10" r="3"></circle></svg></div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 36],
});

function LocationMarker({ position, setPosition }) {
  const map = useMapEvents({
    click(e) {
      setPosition(e.latlng);
      map.flyTo(e.latlng, map.getZoom());
    },
  });

  return position === null ? null : (
    <Marker position={position} icon={icon}></Marker>
  );
}

export default function MapPicker({ coordinates, onChange }) {
  // coordinates format: [lng, lat] for GeoJSON
  
  // Convert [lng, lat] to Leaflet's { lat, lng }
  const defaultPosition = useMemo(() => {
    if (coordinates && coordinates.length === 2) {
      return { lat: coordinates[1], lng: coordinates[0] };
    }
    return { lat: 28.6139, lng: 77.2090 }; // Default New Delhi
  }, [coordinates]);

  const [position, setPosition] = useState(defaultPosition);

  const handlePositionChange = (pos) => {
    setPosition(pos);
    onChange([pos.lng, pos.lat]);
  };

  return (
    <div style={{ position: 'relative', height: '300px', width: '100%', borderRadius: 'var(--radius-lg)', overflow: 'hidden', border: '1px solid var(--border-color)', zIndex: 0 }}>
      {/* Ensure Leaflet CSS doesn't bleed out and index is low enough */}
      <MapContainer 
        center={position} 
        zoom={13} 
        scrollWheelZoom={true} 
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />
        <LocationMarker position={position} setPosition={handlePositionChange} />
      </MapContainer>
      <div style={{ 
        position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)', 
        zIndex: 1000, background: 'var(--bg-primary)', padding: '0.4rem 0.8rem', 
        borderRadius: 'var(--radius-full)', fontSize: '0.8rem', fontWeight: 600,
        boxShadow: 'var(--shadow-md)', border: '1px solid var(--border-color)',
        display: 'flex', alignItems: 'center', gap: '0.5rem', pointerEvents: 'none'
      }}>
        <MapPin size={14} color="var(--primary-500)" /> Click map to set pin
      </div>
    </div>
  );
}
