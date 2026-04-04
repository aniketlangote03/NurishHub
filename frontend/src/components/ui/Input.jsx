import { useState } from 'react';

export default function Input({
  label, type = 'text', value, onChange, placeholder, error, hint,
  icon: Icon, required = false, disabled = false, multiline = false,
  rows = 4, options, style, className = '', id, ...props
}) {
  const [focused, setFocused] = useState(false);

  const wrapperStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-1)',
    width: '100%',
    ...style,
  };

  const inputContainerStyle = {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  };

  const baseInputStyle = {
    width: '100%',
    padding: Icon ? '0.7rem 0.9rem 0.7rem 2.5rem' : '0.7rem 0.9rem',
    fontSize: '0.9rem',
    background: 'var(--bg-input)',
    color: 'var(--text-primary)',
    border: `1.5px solid ${error ? 'var(--danger)' : focused ? 'var(--primary-500)' : 'var(--border-color)'}`,
    borderRadius: 'var(--radius-md)',
    outline: 'none',
    transition: 'all var(--transition-fast)',
    fontFamily: 'var(--font-body)',
    opacity: disabled ? 0.5 : 1,
  };

  const labelStyle = {
    fontSize: '0.85rem',
    fontWeight: 500,
    color: error ? 'var(--danger)' : focused ? 'var(--primary-400)' : 'var(--text-secondary)',
    transition: 'color var(--transition-fast)',
  };

  const commonProps = {
    id: id || label?.toLowerCase().replace(/\s+/g, '-'),
    value,
    onChange: (e) => onChange?.(e.target.value, e),
    placeholder,
    disabled,
    required,
    onFocus: () => setFocused(true),
    onBlur: () => setFocused(false),
    style: baseInputStyle,
    ...props,
  };

  const renderInput = () => {
    if (options) {
      return (
        <select {...commonProps} onChange={(e) => onChange?.(e.target.value, e)}>
          <option value="">{placeholder || 'Select...'}</option>
          {options.map((opt) => (
            <option key={typeof opt === 'string' ? opt : opt.value} value={typeof opt === 'string' ? opt : opt.value}>
              {typeof opt === 'string' ? opt : opt.label}
            </option>
          ))}
        </select>
      );
    }
    if (multiline) {
      return <textarea {...commonProps} rows={rows} />;
    }
    return <input {...commonProps} type={type} />;
  };

  return (
    <div style={wrapperStyle} className={className}>
      {label && (
        <label htmlFor={commonProps.id} style={labelStyle}>
          {label} {required && <span style={{ color: 'var(--danger)' }}>*</span>}
        </label>
      )}
      <div style={inputContainerStyle}>
        {Icon && (
          <Icon size={16} style={{
            position: 'absolute', left: '0.8rem',
            color: focused ? 'var(--primary-400)' : 'var(--text-tertiary)',
            transition: 'color var(--transition-fast)',
            pointerEvents: 'none',
          }} />
        )}
        {renderInput()}
      </div>
      {error && <span style={{ fontSize: '0.75rem', color: 'var(--danger)' }}>{error}</span>}
      {hint && !error && <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{hint}</span>}
    </div>
  );
}
