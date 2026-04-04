import { useState } from 'react';
import { MapPin } from 'lucide-react';

export default function LocationPicker({ value, onChange, style }) {
  const [selectedPoint, setSelectedPoint] = useState(value || null);

  const handleClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width);
    const y = ((e.clientY - rect.top) / rect.height);
    // Simulate lat/lng from click position
    const lat = 28.4 + (1 - y) * 0.5;
    const lng = 77.0 + x * 0.5;
    const point = {
      lat: parseFloat(lat.toFixed(4)),
      lng: parseFloat(lng.toFixed(4)),
      address: `${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E — New Delhi area`,
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
    setSelectedPoint(point);
    onChange?.(point);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', ...style }}>
      <label style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-secondary)' }}>
        📍 Click to set pickup location
      </label>
      <div
        onClick={handleClick}
        style={{
          width: '100%', height: '250px', borderRadius: 'var(--radius-lg)',
          background: 'linear-gradient(135deg, #1a3a4a, #0a1f2a)',
          position: 'relative', cursor: 'crosshair', overflow: 'hidden',
          border: '1px solid var(--border-color)',
        }}
      >
        {/* Grid */}
        <div style={{ position: 'absolute', inset: 0, opacity: 0.1 }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} style={{
              position: 'absolute', top: `${(i + 1) * 16.66}%`, left: 0, right: 0,
              height: '1px', background: 'var(--primary-400)',
            }} />
          ))}
        </div>

        {/* Selected marker */}
        {selectedPoint && (
          <div style={{
            position: 'absolute',
            left: selectedPoint.x || '50%',
            top: selectedPoint.y || '50%',
            transform: 'translate(-50%, -100%)',
            animation: 'fadeInUp 0.3s ease-out',
          }}>
            <MapPin size={28} fill="var(--primary-500)" color="var(--primary-500)"
              style={{ filter: 'drop-shadow(0 2px 6px rgba(16, 185, 129, 0.5))' }}
            />
          </div>
        )}

        {!selectedPoint && (
          <div style={{
            position: 'absolute', inset: 0, display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            color: 'var(--text-tertiary)', fontSize: '0.85rem',
          }}>
            Click anywhere to drop a pin
          </div>
        )}
      </div>

      {selectedPoint && (
        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
          📍 {selectedPoint.address}
        </p>
      )}
    </div>
  );
}
