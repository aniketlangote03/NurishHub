import { getStatusColor } from '../../utils/helpers';

export default function Badge({ status, children, color, style, size = 'md' }) {
  const statusColor = status ? getStatusColor(status) : null;

  const sizes = {
    sm: { padding: '0.15rem 0.5rem', fontSize: '0.65rem' },
    md: { padding: '0.25rem 0.75rem', fontSize: '0.75rem' },
    lg: { padding: '0.35rem 1rem', fontSize: '0.85rem' },
  };

  const s = sizes[size] || sizes.md;

  const badgeStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.35rem',
    padding: s.padding,
    fontSize: s.fontSize,
    fontWeight: 600,
    borderRadius: 'var(--radius-full)',
    textTransform: 'capitalize',
    letterSpacing: '0.02em',
    lineHeight: 1.4,
    background: color?.bg || statusColor?.bg || 'rgba(100, 116, 139, 0.15)',
    color: color?.text || statusColor?.text || 'var(--text-secondary)',
    border: `1px solid ${color?.border || statusColor?.border || 'rgba(100, 116, 139, 0.2)'}`,
    ...style,
  };

  return (
    <span style={badgeStyle}>
      {status && (
        <span style={{
          width: '6px', height: '6px', borderRadius: '50%',
          background: statusColor?.text || 'currentColor',
          boxShadow: `0 0 4px ${statusColor?.text || 'currentColor'}`,
        }} />
      )}
      {children || status}
    </span>
  );
}
