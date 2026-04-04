import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

export default function Modal({ isOpen, onClose, title, children, size = 'md', footer }) {
  const modalRef = useRef(null);

  useEffect(() => {
    const handleEsc = (e) => { if (e.key === 'Escape') onClose?.(); };
    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizes = {
    sm: '420px',
    md: '560px',
    lg: '720px',
    xl: '900px',
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 'var(--z-modal-backdrop)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'var(--bg-overlay)', backdropFilter: 'blur(4px)',
        animation: 'fadeIn 0.2s ease-out', padding: 'var(--space-4)',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose?.(); }}
    >
      <div
        ref={modalRef}
        style={{
          background: 'var(--bg-secondary)', borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-xl)',
          maxWidth: sizes[size], width: '100%', maxHeight: '85vh',
          display: 'flex', flexDirection: 'column', animation: 'scaleIn 0.25s ease-out',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: 'var(--space-5) var(--space-6)', borderBottom: '1px solid var(--border-color)',
        }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>{title}</h3>
          <button
            onClick={onClose}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: '32px', height: '32px', borderRadius: 'var(--radius-md)',
              color: 'var(--text-secondary)', transition: 'all var(--transition-fast)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--bg-tertiary)';
              e.currentTarget.style.color = 'var(--text-primary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = 'var(--text-secondary)';
            }}
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div style={{
          padding: 'var(--space-6)', overflowY: 'auto', flex: 1,
        }}>
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
            gap: 'var(--space-3)', padding: 'var(--space-4) var(--space-6)',
            borderTop: '1px solid var(--border-color)',
          }}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
