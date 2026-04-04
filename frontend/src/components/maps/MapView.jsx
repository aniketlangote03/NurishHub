export default function MapView({ markers = [], center, zoom = 12, height = '400px', style }) {
  // Mock map component — displays markers as an interactive visual
  const mapCenter = center || { lat: 28.6139, lng: 77.2090 };

  return (
    <div style={{
      width: '100%', height, borderRadius: 'var(--radius-lg)',
      background: 'linear-gradient(135deg, #1a3a4a 0%, #0f2a3a 50%, #0a1f2a 100%)',
      position: 'relative', overflow: 'hidden',
      border: '1px solid var(--border-color)', ...style,
    }}>
      {/* Grid lines / map texture */}
      <div style={{ position: 'absolute', inset: 0, opacity: 0.15 }}>
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={`h-${i}`} style={{
            position: 'absolute', top: `${(i + 1) * 12.5}%`, left: 0, right: 0,
            height: '1px', background: 'var(--primary-400)',
          }} />
        ))}
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={`v-${i}`} style={{
            position: 'absolute', left: `${(i + 1) * 12.5}%`, top: 0, bottom: 0,
            width: '1px', background: 'var(--primary-400)',
          }} />
        ))}
      </div>

      {/* Road-like lines */}
      <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} viewBox="0 0 400 300">
        <path d="M0,150 Q100,100 200,150 T400,120" stroke="rgba(16,185,129,0.2)" strokeWidth="3" fill="none" />
        <path d="M50,0 Q100,100 150,200 T200,300" stroke="rgba(16,185,129,0.15)" strokeWidth="2" fill="none" />
        <path d="M300,0 Q280,80 320,160 T300,300" stroke="rgba(16,185,129,0.15)" strokeWidth="2" fill="none" />
      </svg>

      {/* Markers */}
      {markers.length > 0 ? markers.map((marker, i) => {
        const x = 20 + (i * 25) % 60 + Math.random() * 10;
        const y = 15 + (i * 30) % 60 + Math.random() * 10;
        return (
          <div key={marker.id || i} style={{
            position: 'absolute', left: `${x}%`, top: `${y}%`,
            transform: 'translate(-50%, -100%)',
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            animation: `fadeInUp 0.4s ease-out ${i * 0.1}s both`,
          }}>
            <div style={{
              background: marker.color || 'var(--primary-500)',
              color: '#fff', padding: '0.3rem 0.6rem',
              borderRadius: 'var(--radius-sm)', fontSize: '0.7rem',
              fontWeight: 600, whiteSpace: 'nowrap',
              boxShadow: `0 2px 8px ${marker.color || 'rgba(16, 185, 129, 0.4)'}`,
              marginBottom: '4px',
            }}>
              {marker.label || `Point ${i + 1}`}
            </div>
            <div style={{
              width: '12px', height: '12px', borderRadius: '50% 50% 50% 0',
              transform: 'rotate(-45deg)',
              background: marker.color || 'var(--primary-500)',
              boxShadow: `0 0 10px ${marker.color || 'rgba(16, 185, 129, 0.5)'}`,
            }} />
            <div style={{
              width: '20px', height: '6px', borderRadius: '50%',
              background: 'rgba(0,0,0,0.3)', marginTop: '2px',
            }} />
          </div>
        );
      }) : (
        <div style={{
          position: 'absolute', inset: 0, display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          color: 'var(--text-tertiary)', fontSize: '0.9rem',
        }}>
          📍 Map View — Locations will appear here
        </div>
      )}

      {/* Zoom controls */}
      <div style={{
        position: 'absolute', right: '12px', top: '12px',
        display: 'flex', flexDirection: 'column', gap: '2px',
      }}>
        {['+', '−'].map(label => (
          <button key={label} style={{
            width: '28px', height: '28px', borderRadius: 'var(--radius-sm)',
            background: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
            color: 'var(--text-primary)', fontSize: '1rem', fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {label}
          </button>
        ))}
      </div>

      {/* Attribution */}
      <div style={{
        position: 'absolute', bottom: '8px', right: '12px',
        fontSize: '0.6rem', color: 'rgba(148, 163, 184, 0.5)',
      }}>
        Mock Map View
      </div>
    </div>
  );
}
