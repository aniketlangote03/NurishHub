import { useState } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';

export default function Table({ columns, data, onRowClick, emptyMessage = 'No data found', loading = false }) {
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState('asc');

  const handleSort = (key) => {
    if (!key) return;
    if (sortKey === key) {
      setSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const sortedData = sortKey
    ? [...data].sort((a, b) => {
        const aVal = a[sortKey] || '';
        const bVal = b[sortKey] || '';
        const cmp = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
        return sortDir === 'asc' ? cmp : -cmp;
      })
    : data;

  const tableStyle = {
    width: '100%',
    borderCollapse: 'separate',
    borderSpacing: 0,
    fontSize: '0.875rem',
  };

  const thStyle = {
    padding: '0.75rem 1rem',
    textAlign: 'left',
    fontWeight: 600,
    color: 'var(--text-secondary)',
    borderBottom: '1px solid var(--border-color)',
    fontSize: '0.8rem',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    whiteSpace: 'nowrap',
    cursor: 'pointer',
    userSelect: 'none',
    transition: 'color var(--transition-fast)',
    background: 'var(--bg-secondary)',
    position: 'sticky',
    top: 0,
    zIndex: 1,
  };

  const tdStyle = {
    padding: '0.75rem 1rem',
    borderBottom: '1px solid var(--border-color)',
    color: 'var(--text-primary)',
    verticalAlign: 'middle',
  };

  if (loading) {
    return (
      <div style={{ padding: 'var(--space-8)', textAlign: 'center' }}>
        <div style={{
          width: '100%', height: '200px', borderRadius: 'var(--radius-md)',
          background: 'linear-gradient(90deg, var(--bg-tertiary) 25%, var(--bg-secondary) 50%, var(--bg-tertiary) 75%)',
          backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite',
        }} />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div style={{
        padding: 'var(--space-12)', textAlign: 'center',
        color: 'var(--text-tertiary)', fontSize: '0.9rem',
      }}>
        {emptyMessage}
      </div>
    );
  }

  return (
    <div style={{ overflowX: 'auto', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
      <table style={tableStyle}>
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                style={thStyle}
                onClick={() => col.sortable !== false && handleSort(col.key)}
                onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  {col.label}
                  {sortKey === col.key && (
                    sortDir === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                  )}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sortedData.map((row, i) => (
            <tr
              key={row.id || i}
              style={{
                cursor: onRowClick ? 'pointer' : 'default',
                transition: 'background var(--transition-fast)',
              }}
              onClick={() => onRowClick?.(row)}
              onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-tertiary)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              {columns.map((col) => (
                <td key={col.key} style={tdStyle}>
                  {col.render ? col.render(row[col.key], row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
