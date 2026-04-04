import { useContext } from 'react';
import { NotificationContext } from '../../context/NotificationContext';
import { X, CheckCircle, AlertTriangle, AlertCircle, Info } from 'lucide-react';

const icons = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

const colors = {
  success: { bg: 'rgba(16, 185, 129, 0.12)', border: 'rgba(16, 185, 129, 0.3)', text: '#34d399', bar: '#10b981' },
  error: { bg: 'rgba(239, 68, 68, 0.12)', border: 'rgba(239, 68, 68, 0.3)', text: '#f87171', bar: '#ef4444' },
  warning: { bg: 'rgba(245, 158, 11, 0.12)', border: 'rgba(245, 158, 11, 0.3)', text: '#fbbf24', bar: '#f59e0b' },
  info: { bg: 'rgba(59, 130, 246, 0.12)', border: 'rgba(59, 130, 246, 0.3)', text: '#60a5fa', bar: '#3b82f6' },
};

function ToastItem({ notification, onRemove }) {
  const { type, message, duration } = notification;
  const Icon = icons[type] || Info;
  const c = colors[type] || colors.info;

  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: 'var(--space-3)',
      padding: 'var(--space-4) var(--space-5)',
      background: c.bg, border: `1px solid ${c.border}`,
      borderRadius: 'var(--radius-md)',
      backdropFilter: 'blur(12px)', minWidth: '300px', maxWidth: '420px',
      boxShadow: 'var(--shadow-lg)', animation: 'slideToast 0.3s ease-out',
      position: 'relative', overflow: 'hidden',
    }}>
      <Icon size={18} style={{ color: c.text, flexShrink: 0, marginTop: '1px' }} />
      <p style={{ flex: 1, color: 'var(--text-primary)', fontSize: '0.875rem', lineHeight: 1.5 }}>
        {message}
      </p>
      <button
        onClick={() => onRemove(notification.id)}
        style={{
          color: 'var(--text-tertiary)', flexShrink: 0,
          display: 'flex', alignItems: 'center',
        }}
      >
        <X size={14} />
      </button>
      {/* Progress bar */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, height: '2px',
        background: c.bar, animation: `progressShrink ${duration}ms linear forwards`,
      }} />
    </div>
  );
}

export default function Toast() {
  const { notifications, removeNotification } = useContext(NotificationContext);

  if (notifications.length === 0) return null;

  return (
    <div style={{
      position: 'fixed', top: 'calc(var(--navbar-height) + var(--space-4))',
      right: 'var(--space-4)', zIndex: 'var(--z-toast)',
      display: 'flex', flexDirection: 'column', gap: 'var(--space-3)',
    }}>
      {notifications.map(n => (
        <ToastItem key={n.id} notification={n} onRemove={removeNotification} />
      ))}
    </div>
  );
}
