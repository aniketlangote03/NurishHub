import { forwardRef } from 'react';

const variants = {
  primary: {
    background: 'linear-gradient(135deg, var(--primary-600), var(--primary-500))',
    color: '#fff',
    border: 'none',
    shadow: '0 4px 14px rgba(16, 185, 129, 0.3)',
    hoverShadow: '0 6px 20px rgba(16, 185, 129, 0.45)',
  },
  secondary: {
    background: 'var(--bg-tertiary)',
    color: 'var(--text-primary)',
    border: '1px solid var(--border-color)',
    shadow: 'none',
    hoverShadow: 'var(--shadow-md)',
  },
  danger: {
    background: 'linear-gradient(135deg, #dc2626, #ef4444)',
    color: '#fff',
    border: 'none',
    shadow: '0 4px 14px rgba(239, 68, 68, 0.3)',
    hoverShadow: '0 6px 20px rgba(239, 68, 68, 0.45)',
  },
  ghost: {
    background: 'transparent',
    color: 'var(--text-secondary)',
    border: '1px solid transparent',
    shadow: 'none',
    hoverShadow: 'none',
  },
  accent: {
    background: 'linear-gradient(135deg, var(--accent-600), var(--accent-500))',
    color: '#fff',
    border: 'none',
    shadow: '0 4px 14px rgba(245, 158, 11, 0.3)',
    hoverShadow: '0 6px 20px rgba(245, 158, 11, 0.45)',
  },
};

const sizes = {
  sm: { padding: '0.4rem 0.85rem', fontSize: '0.8rem', gap: '0.35rem' },
  md: { padding: '0.6rem 1.25rem', fontSize: '0.875rem', gap: '0.5rem' },
  lg: { padding: '0.75rem 1.75rem', fontSize: '1rem', gap: '0.6rem' },
};

const Button = forwardRef(({
  children, variant = 'primary', size = 'md', icon: Icon, iconRight: IconRight,
  loading = false, disabled = false, fullWidth = false, onClick, style, className = '', ...props
}, ref) => {
  const v = variants[variant] || variants.primary;
  const s = sizes[size] || sizes.md;

  const buttonStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: s.gap,
    padding: s.padding,
    fontSize: s.fontSize,
    fontWeight: 600,
    fontFamily: 'var(--font-body)',
    background: v.background,
    color: v.color,
    border: v.border,
    borderRadius: 'var(--radius-md)',
    cursor: disabled || loading ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
    transition: 'all var(--transition-base)',
    boxShadow: v.shadow,
    width: fullWidth ? '100%' : 'auto',
    textDecoration: 'none',
    lineHeight: 1.4,
    whiteSpace: 'nowrap',
    ...style,
  };

  return (
    <button
      ref={ref}
      style={buttonStyle}
      disabled={disabled || loading}
      onClick={onClick}
      className={`btn btn-${variant} ${className}`}
      onMouseEnter={(e) => {
        if (!disabled && !loading) {
          e.currentTarget.style.boxShadow = v.hoverShadow;
          e.currentTarget.style.transform = 'translateY(-1px)';
          if (variant === 'ghost') {
            e.currentTarget.style.background = 'var(--bg-tertiary)';
            e.currentTarget.style.color = 'var(--text-primary)';
          }
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = v.shadow;
        e.currentTarget.style.transform = 'translateY(0)';
        if (variant === 'ghost') {
          e.currentTarget.style.background = 'transparent';
          e.currentTarget.style.color = 'var(--text-secondary)';
        }
      }}
      {...props}
    >
      {loading ? (
        <span style={{
          width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)',
          borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.6s linear infinite',
          display: 'inline-block',
        }} />
      ) : Icon ? <Icon size={size === 'sm' ? 14 : size === 'lg' ? 20 : 16} /> : null}
      {children}
      {IconRight && !loading && <IconRight size={size === 'sm' ? 14 : size === 'lg' ? 20 : 16} />}
    </button>
  );
});

Button.displayName = 'Button';
export default Button;
