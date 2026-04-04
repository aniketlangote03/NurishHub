export default function Spinner({ size = 32, color = 'var(--primary-500)', style }) {
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', ...style,
    }}>
      <div style={{
        width: size,
        height: size,
        border: `3px solid rgba(148, 163, 184, 0.15)`,
        borderTopColor: color,
        borderRadius: '50%',
        animation: 'spin 0.7s linear infinite',
      }} />
    </div>
  );
}

export function PageLoader() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      minHeight: '60vh', flexDirection: 'column', gap: 'var(--space-4)',
    }}>
      <Spinner size={48} />
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Loading...</p>
    </div>
  );
}
