import { useState, useRef } from 'react';

const variantStyles = {
  default: {
    background: 'var(--glass-bg)',
    border: '1px solid var(--glass-border)',
    backdropFilter: 'var(--glass-blur)',
    WebkitBackdropFilter: 'var(--glass-blur)',
  },
  outlined: {
    background: 'transparent',
    border: '1px solid var(--border-color)',
    backdropFilter: 'none',
  },
  elevated: {
    background: 'var(--bg-card)',
    border: '1px solid var(--glass-border)',
    boxShadow: 'var(--shadow-lg)',
    backdropFilter: 'var(--glass-blur)',
    WebkitBackdropFilter: 'var(--glass-blur)',
  },
  flat: {
    background: 'var(--bg-secondary)',
    border: '1px solid var(--border-color)',
  },
};

export default function Card({
  children, variant = 'default', hoverable = true, padding = 'var(--space-6)',
  onClick, style, className = '', ...props
}) {
  const v = variantStyles[variant] || variantStyles.default;
  const cardRef = useRef(null);

  const [tiltStyle, setTiltStyle] = useState({});
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e) => {
    if (!hoverable || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left; // x position within the element
    const y = e.clientY - rect.top; // y position within the element
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    // Calculate rotation limits
    const rotateX = ((y - centerY) / centerY) * -8;
    const rotateY = ((x - centerX) / centerX) * 8;
    
    setTiltStyle({
      transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`,
      transition: 'none',
      boxShadow: 'var(--shadow-xl), var(--shadow-glow)',
      borderColor: 'var(--primary-400)',
      zIndex: 10
    });
  };

  const handleMouseLeave = (e) => {
    setIsHovered(false);
    if (!hoverable) return;
    setTiltStyle({
      transform: 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)',
      transition: 'all 0.5s ease',
      boxShadow: v.boxShadow || 'var(--glass-shadow)',
      borderColor: v.border?.includes('glass') ? 'var(--glass-border)' : 'var(--border-color)',
      zIndex: 1
    });
  };

  const handleMouseEnter = () => {
    if (hoverable) setIsHovered(true);
  }

  const cardStyle = {
    ...v,
    borderRadius: 'var(--radius-lg)',
    padding,
    transition: 'all var(--transition-base)',
    cursor: onClick ? 'pointer' : 'default',
    transformStyle: 'preserve-3d',
    ...tiltStyle,
    ...style,
  };

  return (
    <div
      ref={cardRef}
      style={cardStyle}
      className={`card card-${variant} ${className}`}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onMouseEnter={handleMouseEnter}
      {...props}
    >
      <div style={{
        transform: isHovered ? 'translateZ(25px)' : 'translateZ(0)',
        transition: 'transform 0.3s ease',
        height: '100%'
      }}>
        {children}
      </div>
    </div>
  );
}
