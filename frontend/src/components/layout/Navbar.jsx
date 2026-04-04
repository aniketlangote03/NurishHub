import { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import { useNotification } from '../../hooks/useNotification';
import {
  Heart, Sun, Moon, Bell, Menu, X, LogOut, User, ChevronDown,
  Home, LayoutDashboard, Package, PlusCircle, Building2, Truck,
  Shield, MessageCircle, Star, LogIn, UserPlus,
} from 'lucide-react';
import { getInitials } from '../../utils/helpers';

export default function Navbar({ onToggleSidebar }) {
  const { user, isAuthenticated, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const { unreadCount, appNotifications, markAsRead, markAllAsRead, fetchAppNotifications } = useNotification();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const profileRef = useRef(null);

  useEffect(() => {
    if (isAuthenticated) fetchAppNotifications();
  }, [isAuthenticated, fetchAppNotifications]);

  useEffect(() => {
    const handle = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  const publicLinks = [
    { to: '/', label: 'Home', icon: Home },
    { to: '/login', label: 'Login', icon: LogIn },
    { to: '/register', label: 'Register', icon: UserPlus },
  ];

  const authLinks = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/donations', label: 'Donations', icon: Package },
    { to: '/chat', label: 'Chat', icon: MessageCircle },
    { to: '/feedback', label: 'Feedback', icon: Star },
  ];

  const links = isAuthenticated ? authLinks : publicLinks;

  const navStyle = {
    position: 'sticky', top: 0, zIndex: 'var(--z-sticky)',
    height: 'var(--navbar-height)', display: 'flex', alignItems: 'center',
    padding: '0 var(--space-6)',
    background: 'var(--glass-bg)', backdropFilter: 'var(--glass-blur)',
    WebkitBackdropFilter: 'var(--glass-blur)',
    borderBottom: '1px solid var(--glass-border)',
  };

  const logoStyle = {
    display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
    textDecoration: 'none', fontFamily: 'var(--font-heading)',
    fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)',
  };

  const iconBtnStyle = {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    width: '36px', height: '36px', borderRadius: 'var(--radius-md)',
    color: 'var(--text-secondary)', transition: 'all var(--transition-fast)',
    position: 'relative',
  };

  return (
    <nav style={navStyle} id="main-navbar">
      {/* Left */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', flex: 1 }}>
        {isAuthenticated && (
          <button style={iconBtnStyle} onClick={onToggleSidebar}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-tertiary)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
          >
            <Menu size={20} />
          </button>
        )}
        <Link to="/" style={logoStyle}>
          <div style={{
            width: '32px', height: '32px', borderRadius: 'var(--radius-md)',
            background: 'linear-gradient(135deg, var(--primary-500), var(--accent-500))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Heart size={18} color="#fff" fill="#fff" />
          </div>
          <span>Food<span style={{ color: 'var(--primary-400)' }}>Share</span></span>
        </Link>
      </div>

      {/* Center — Desktop Links */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 'var(--space-1)',
      }} className="nav-links-desktop">
        {links.map(link => {
          const active = location.pathname === link.to;
          return (
            <Link key={link.to} to={link.to} style={{
              display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
              padding: '0.45rem 0.85rem', borderRadius: 'var(--radius-md)',
              fontSize: '0.85rem', fontWeight: 500, textDecoration: 'none',
              color: active ? 'var(--primary-400)' : 'var(--text-secondary)',
              background: active ? 'rgba(16, 185, 129, 0.1)' : 'transparent',
              transition: 'all var(--transition-fast)',
            }}
            onMouseEnter={e => { if (!active) { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.background = 'var(--bg-tertiary)'; }}}
            onMouseLeave={e => { if (!active) { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.background = 'transparent'; }}}
            >
              <link.icon size={16} />
              {link.label}
            </Link>
          );
        })}
      </div>

      {/* Right */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flex: 1, justifyContent: 'flex-end' }}>
        <button style={iconBtnStyle} onClick={toggleTheme} title="Toggle theme"
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-tertiary)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
        >
          {isDark ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {isAuthenticated && (
          <>
            <div style={{ position: 'relative' }}>
              <button style={{ ...iconBtnStyle }} title="Notifications"
                onClick={() => setNotifOpen(!notifOpen)}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-tertiary)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
              >
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span style={{
                    position: 'absolute', top: '4px', right: '4px', width: '8px', height: '8px',
                    borderRadius: '50%', background: 'var(--danger)',
                    border: '2px solid var(--bg-secondary)',
                  }} />
                )}
              </button>

              {notifOpen && (
                <div style={{
                  position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                  width: '300px', background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)',
                  boxShadow: 'var(--shadow-xl)', overflow: 'hidden',
                  animation: 'fadeInDown 0.2s ease-out', zIndex: 'var(--z-dropdown)',
                }}>
                  <div style={{ padding: 'var(--space-3)', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h4 style={{ fontSize: '0.9rem', fontWeight: 600 }}>Notifications</h4>
                    {unreadCount > 0 && (
                      <button onClick={markAllAsRead} style={{ fontSize: '0.75rem', color: 'var(--primary-400)', background: 'none', border: 'none', cursor: 'pointer' }}>Mark all read</button>
                    )}
                  </div>
                  <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                    {appNotifications.length > 0 ? appNotifications.map(n => (
                      <div key={n._id} onClick={() => { if (!n.isRead) markAsRead(n._id); }} style={{
                        padding: 'var(--space-3)', borderBottom: '1px solid var(--border-color)',
                        background: n.isRead ? 'transparent' : 'rgba(16, 185, 129, 0.05)',
                        cursor: 'pointer', transition: 'background var(--transition-fast)'
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-tertiary)'}
                      onMouseLeave={e => e.currentTarget.style.background = n.isRead ? 'transparent' : 'rgba(16, 185, 129, 0.05)'}
                      >
                        <p style={{ fontSize: '0.85rem', fontWeight: n.isRead ? 400 : 600, color: 'var(--text-primary)' }}>{n.title}</p>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>{n.message}</p>
                      </div>
                    )) : (
                      <p style={{ padding: 'var(--space-4)', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-tertiary)' }}>No notifications</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Profile dropdown */}
            <div ref={profileRef} style={{ position: 'relative' }}>
              <button style={{
                display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
                padding: '0.3rem 0.6rem 0.3rem 0.3rem', borderRadius: 'var(--radius-full)',
                border: '1px solid var(--border-color)', transition: 'all var(--transition-fast)',
                background: profileOpen ? 'var(--bg-tertiary)' : 'transparent',
              }}
              onClick={() => setProfileOpen(!profileOpen)}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-color-hover)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-color)'}
              >
                <div style={{
                  width: '28px', height: '28px', borderRadius: '50%',
                  background: 'linear-gradient(135deg, var(--primary-500), var(--primary-700))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.7rem', fontWeight: 700, color: '#fff',
                }}>
                  {getInitials(user?.name)}
                </div>
                <ChevronDown size={14} style={{
                  color: 'var(--text-secondary)',
                  transform: profileOpen ? 'rotate(180deg)' : 'rotate(0)',
                  transition: 'transform var(--transition-fast)',
                }} />
              </button>

              {profileOpen && (
                <div style={{
                  position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                  minWidth: '220px', background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)',
                  boxShadow: 'var(--shadow-xl)', padding: 'var(--space-2)',
                  animation: 'fadeInDown 0.2s ease-out', zIndex: 'var(--z-dropdown)',
                }}>
                  <div style={{
                    padding: 'var(--space-3) var(--space-4)',
                    borderBottom: '1px solid var(--border-color)', marginBottom: 'var(--space-2)',
                  }}>
                    <p style={{ fontWeight: 600, fontSize: '0.9rem' }}>{user?.name}</p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{user?.email}</p>
                    <span style={{
                      display: 'inline-block', marginTop: '0.3rem',
                      padding: '0.1rem 0.5rem', borderRadius: 'var(--radius-full)',
                      background: 'rgba(16, 185, 129, 0.15)', color: 'var(--primary-400)',
                      fontSize: '0.7rem', fontWeight: 600, textTransform: 'capitalize',
                    }}>{user?.role}</span>
                  </div>
                  {[
                    { icon: User, label: 'Profile', action: () => { setProfileOpen(false); navigate('/dashboard'); } },
                    { icon: LogOut, label: 'Sign Out', action: () => { setProfileOpen(false); logout(); navigate('/'); } },
                  ].map(item => (
                    <button key={item.label} onClick={item.action} style={{
                      display: 'flex', alignItems: 'center', gap: 'var(--space-3)', width: '100%',
                      padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-md)',
                      color: item.label === 'Sign Out' ? 'var(--danger)' : 'var(--text-secondary)',
                      fontSize: '0.85rem', transition: 'all var(--transition-fast)', cursor: 'pointer', border: 'none', background: 'transparent'
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-tertiary)'; e.currentTarget.style.color = item.label === 'Sign Out' ? 'var(--danger)' : 'var(--text-primary)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = item.label === 'Sign Out' ? 'var(--danger)' : 'var(--text-secondary)'; }}
                    >
                      <item.icon size={16} />
                      {item.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* Mobile menu toggle */}
        <button style={{ ...iconBtnStyle, display: 'none' }} className="mobile-menu-btn"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div style={{
          position: 'fixed', top: 'var(--navbar-height)', left: 0, right: 0, bottom: 0,
          background: 'var(--bg-primary)', zIndex: 'var(--z-dropdown)',
          padding: 'var(--space-6)', animation: 'fadeIn 0.2s ease-out',
          display: 'flex', flexDirection: 'column', gap: 'var(--space-2)',
        }}>
          {links.map(link => {
            const active = location.pathname === link.to;
            return (
              <Link key={link.to} to={link.to} onClick={() => setMobileOpen(false)} style={{
                display: 'flex', alignItems: 'center', gap: 'var(--space-3)',
                padding: 'var(--space-4)', borderRadius: 'var(--radius-md)',
                fontSize: '1rem', fontWeight: 500, textDecoration: 'none',
                color: active ? 'var(--primary-400)' : 'var(--text-secondary)',
                background: active ? 'rgba(16, 185, 129, 0.1)' : 'transparent',
              }}>
                <link.icon size={20} />
                {link.label}
              </Link>
            );
          })}
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .nav-links-desktop { display: none !important; }
          .mobile-menu-btn { display: flex !important; }
        }
      `}</style>
    </nav>
  );
}
