import { useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Polyline } from 'react-leaflet';
import L from 'leaflet';

// Create custom icons
const pickupIcon = L.divIcon({
  className: 'custom-leaflet-icon-pickup',
  html: `<div style="color: hsl(var(--primary)); filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3)); display: flex; align-items: center; justify-content: center;"><svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="currentColor" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path><circle cx="12" cy="10" r="3"></circle></svg></div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 28],
});

const dropoffIcon = L.divIcon({
  className: 'custom-leaflet-icon-dropoff',
  html: `<div style="color: hsl(var(--accent)); filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3)); display: flex; align-items: center; justify-content: center;"><svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="currentColor" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path><circle cx="12" cy="10" r="3"></circle></svg></div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 28],
});

export default function RouteMap({ pickupLocation, dropoffLocation }) {
  // coordinates format: [lng, lat] for GeoJSON
  
  const p = pickupLocation || [77.2090, 28.6139];
  const d = dropoffLocation || [77.2190, 28.6239];

  const pickup = { lat: p[1], lng: p[0] };
  const dropoff = { lat: d[1], lng: d[0] };

  const center = {
    lat: (pickup.lat + dropoff.lat) / 2,
    lng: (pickup.lng + dropoff.lng) / 2
  };

  const polylineCoords = [
    [pickup.lat, pickup.lng],
    [dropoff.lat, dropoff.lng]
  ];

  return (
    <div style={{ position: 'relative', height: '100%', width: '100%', zIndex: 0 }}>
      {/* Ensure Leaflet CSS doesn't bleed out and index is low enough */}
      <MapContainer 
        center={center} 
        zoom={13} 
        scrollWheelZoom={false} 
        style={{ height: '100%', width: '100%' }}
        bounds={L.latLngBounds(pickup, dropoff).pad(0.2)}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />
        <Marker position={pickup} icon={pickupIcon} />
        <Marker position={dropoff} icon={dropoffIcon} />
        <Polyline positions={polylineCoords} pathOptions={{ color: 'hsl(var(--primary))', weight: 4, dashArray: '5, 10' }} />
      </MapContainer>
    </div>
  );
}
