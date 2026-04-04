import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import {
  LayoutDashboard, Package, PlusCircle, Building2, Truck,
  Shield, MessageCircle, Star, ChevronLeft,
  Heart, TrendingUp,
} from 'lucide-react';

export default function Sidebar({ collapsed, onToggle }) {
  const { user } = useAuth();
  const location = useLocation();
  const role = user?.role;

  const allLinks = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['donor', 'ngo', 'volunteer', 'admin'] },
    { to: '/donations', label: 'Donations', icon: Package, roles: ['donor', 'ngo', 'volunteer', 'admin'] },
    { to: '/donations/new', label: 'Add Donation', icon: PlusCircle, roles: ['donor'] },
    { to: '/requests', label: 'NGO Requests', icon: Building2, roles: ['ngo', 'admin', 'donor'] },
    { to: '/pickups', label: 'Pickups', icon: Truck, roles: ['volunteer', 'admin'] },
    { to: '/admin', label: 'Admin Panel', icon: Shield, roles: ['admin'] },
    { divider: true },
    { to: '/chat', label: 'Chat', icon: MessageCircle, roles: ['donor', 'ngo', 'volunteer', 'admin'] },
    { to: '/feedback', label: 'Feedback', icon: Star, roles: ['donor', 'ngo', 'volunteer', 'admin'] },
  ];

  const links = allLinks.filter(l => l.divider || l.roles.includes(role));

  const sidebarStyle = {
    width: collapsed ? 'var(--sidebar-collapsed)' : 'var(--sidebar-width)',
    minHeight: 'calc(100vh - var(--navbar-height))',
    background: 'var(--bg-secondary)',
    borderRight: '1px solid var(--border-color)',
    display: 'flex', flexDirection: 'column',
    padding: 'var(--space-4) var(--space-3)',
    transition: 'width var(--transition-base)',
    overflow: 'hidden',
    position: 'sticky', top: 'var(--navbar-height)',
    alignSelf: 'flex-start',
  };

  const linkStyle = (active) => ({
    display: 'flex', alignItems: 'center', gap: 'var(--space-3)',
    padding: collapsed ? '0.65rem' : '0.65rem 0.85rem',
    justifyContent: collapsed ? 'center' : 'flex-start',
    borderRadius: 'var(--radius-md)',
    fontSize: '0.875rem', fontWeight: active ? 600 : 500,
    textDecoration: 'none',
    color: active ? 'var(--primary-400)' : 'var(--text-secondary)',
    background: active ? 'rgba(16, 185, 129, 0.1)' : 'transparent',
    transition: 'all var(--transition-fast)',
    whiteSpace: 'nowrap',
  });

  return (
    <aside style={sidebarStyle} className="sidebar-desktop" id="main-sidebar">
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
        {links.map((link, i) => {
          if (link.divider) {
            return <div key={i} style={{
              height: '1px', background: 'var(--border-color)',
              margin: 'var(--space-3) var(--space-2)',
            }} />;
          }
          const active = location.pathname === link.to;
          return (
            <Link
              key={link.to}
              to={link.to}
              style={linkStyle(active)}
              title={collapsed ? link.label : undefined}
              onMouseEnter={e => {
                if (!active) {
                  e.currentTarget.style.background = 'var(--bg-tertiary)';
                  e.currentTarget.style.color = 'var(--text-primary)';
                }
              }}
              onMouseLeave={e => {
                if (!active) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = 'var(--text-secondary)';
                }
              }}
            >
              <link.icon size={18} />
              {!collapsed && <span>{link.label}</span>}
            </Link>
          );
        })}
      </div>

      {/* Collapse toggle */}
      <button
        onClick={onToggle}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: 'var(--space-2)', padding: '0.5rem', borderRadius: 'var(--radius-md)',
          color: 'var(--text-tertiary)', fontSize: '0.8rem',
          transition: 'all var(--transition-fast)', marginTop: 'var(--space-4)',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-tertiary)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-tertiary)'; }}
      >
        <ChevronLeft size={16} style={{
          transform: collapsed ? 'rotate(180deg)' : 'rotate(0)',
          transition: 'transform var(--transition-fast)',
        }} />
        {!collapsed && <span>Collapse</span>}
      </button>

      <style>{`
        @media (max-width: 768px) {
          .sidebar-desktop { display: none !important; }
        }
      `}</style>
    </aside>
  );
}
