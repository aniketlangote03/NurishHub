import { useState, useEffect, useRef, useMemo } from 'react';
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

const deliveryIcon = L.divIcon({
  className: 'custom-leaflet-icon-delivery',
  html: `<div style="width:36px; height:36px; background:#8b5cf6; border-radius:50%; border:3px solid white; box-shadow:0 4px 16px rgba(139,92,246,0.5); display:flex; align-items:center; justify-content:center; font-size:20px;">🚴</div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
});

// A small functional component for animated marker
function AnimatedMarker({ position }) {
  const markerRef = useRef(null);
  useEffect(() => {
    markerRef.current?.setLatLng(position);
  }, [position]);
  return <Marker ref={markerRef} position={position} icon={deliveryIcon} />;
}

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

  const [routeLine, setRouteLine] = useState([
    [pickup.lat, pickup.lng],
    [dropoff.lat, dropoff.lng]
  ]);
  const [livePos, setLivePos] = useState([pickup.lat, pickup.lng]);

  // Fetch true driving route from OSRM
  useEffect(() => {
    fetch(`https://router.project-osrm.org/route/v1/driving/${pickup.lng},${pickup.lat};${dropoff.lng},${dropoff.lat}?overview=full&geometries=geojson`)
      .then(res => res.json())
      .then(data => {
        if (data.routes && data.routes[0]) {
          const coords = data.routes[0].geometry.coordinates.map(c => [c[1], c[0]]);
          setRouteLine(coords);
          setLivePos(coords[0]);
        }
      })
      .catch(console.error);
  }, [pickup.lat, pickup.lng, dropoff.lat, dropoff.lng]);

  // Simple simulator to move marker along the route
  useEffect(() => {
    if (routeLine.length < 2) return;
    
    let step = 0;
    const STEPS = 100;
    
    const interval = setInterval(() => {
      step++;
      const progression = step / STEPS;
      const segIdx = Math.min(Math.floor(progression * (routeLine.length - 1)), routeLine.length - 2);
      const t = (progression * (routeLine.length - 1)) - segIdx;
      
      const from = routeLine[segIdx];
      const to = routeLine[segIdx + 1];
      const nextLat = from[0] + (to[0] - from[0]) * t;
      const nextLng = from[1] + (to[1] - from[1]) * t;
      
      setLivePos([nextLat, nextLng]);
      if (step >= STEPS) step = 0; // loop the simulation
    }, 1000);
    
    return () => clearInterval(interval);
  }, [routeLine]);

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
        <Polyline positions={routeLine} pathOptions={{ color: 'hsl(var(--primary))', weight: 4, dashArray: '5, 10' }} />
        <Marker position={pickup} icon={pickupIcon} zIndexOffset={10} />
        <Marker position={dropoff} icon={dropoffIcon} zIndexOffset={10} />
        <AnimatedMarker position={livePos} />
      </MapContainer>
    </div>
  );
}
