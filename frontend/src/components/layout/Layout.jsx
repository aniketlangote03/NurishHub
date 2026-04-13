import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import {
  Heart, Menu, X, LogOut, LayoutDashboard, Utensils,
  ClipboardList, Shield, User as UserIcon, Truck, MessageSquare, Map
} from 'lucide-react';

function Layout({ children }) {
  const { user, logout, isAuthenticated } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { scrollY } = useScroll();

  // Navbar shows transparent at top, frosted on scroll
  const navBg = useTransform(scrollY, [0, 60],
    ['rgba(252,250,245,0)', 'rgba(252,250,245,0.97)']);
  const navBorder = useTransform(scrollY, [0, 60],
    ['rgba(0,0,0,0)', 'rgba(0,0,0,0.07)']);
  const navShadow = useTransform(scrollY, [0, 60],
    ['0 0 0 rgba(0,0,0,0)', '0 4px 24px rgba(0,0,0,0.06)']);

  // Close mobile menu on route change
  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isActive = (path) => location.pathname === path;

  const navLinks = [
    { href: '/', label: 'Home' },
    ...(isAuthenticated ? [
      { href: '/dashboard', label: 'Dashboard', Icon: LayoutDashboard },
      { href: '/donations', label: 'Browse Food', Icon: Utensils },
      ...(['ngo','admin'].includes(user?.role) ? [{ href: '/requests', label: 'Requests', Icon: ClipboardList }] : []),
      ...(['volunteer','admin'].includes(user?.role) ? [{ href: '/pickups', label: 'Pickups', Icon: Truck }] : []),
      { href: '/chat', label: 'Chat', Icon: MessageSquare },
      { href: '/map', label: 'Live Map', Icon: Map },
      ...(user?.role === 'admin' ? [{ href: '/admin', label: 'Admin', Icon: Shield }] : []),
    ] : []),
  ];

  return (
    <div style={{ display:'flex', flexDirection:'column', minHeight:'100vh' }}>
      {/* ── NAVBAR ── */}
      <motion.header
        style={{
          backgroundColor: navBg,
          borderBottomColor: navBorder,
          boxShadow: navShadow,
          position: 'sticky',
          top: 0,
          zIndex: 50,
        }}
      >
        <div style={{
          maxWidth: 1280, margin: '0 auto', padding: '0 1.5rem',
          height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '2rem',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
        }}>

          {/* Logo */}
          <Link to="/" style={{ display:'flex', alignItems:'center', gap:'0.625rem', textDecoration:'none', flexShrink:0 }}>
            <motion.div
              animate={{ rotate: [0, -8, 8, -4, 4, 0] }}
              transition={{ duration: 4, repeat: Infinity, repeatDelay: 3 }}
              style={{
                width:32, height:32, borderRadius:12,
                background: 'hsl(var(--primary))',
                display:'flex', alignItems:'center', justifyContent:'center',
                boxShadow: '0 0 15px hsl(var(--primary) / 0.4)',
              }}
            >
              <Heart size={16} color="hsl(var(--primary-fg))" fill="hsl(var(--primary-fg))" />
            </motion.div>
            <span style={{
              fontFamily: 'var(--font-display)', fontWeight: 900,
              fontSize: '1.2rem', color: 'hsl(var(--primary))', letterSpacing: '-0.02em',
            }}>NourishHub</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="md-hide" style={{ display:'flex', alignItems:'center', gap:'1.5rem', flex:1 }}
            id="desktop-nav">
            {navLinks.map(({ href, label, Icon }) => (
              <Link
                key={href} to={href}
                className="nav-link-underline"
                style={{
                  display:'flex', alignItems:'center', gap:'0.375rem',
                  fontSize:'0.875rem', fontWeight:600,
                  color: isActive(href) ? 'hsl(var(--primary))' : 'hsl(var(--muted-fg))',
                  transition:'color 0.2s', textDecoration:'none',
                  padding:'0.25rem 0.25rem',
                }}
              >
                {Icon && <Icon size={14} />}
                {label}
              </Link>
            ))}
          </nav>

          {/* Right side — desktop */}
          <div className="md-hide" style={{ display:'flex', alignItems:'center', gap:'0.75rem', flexShrink:0 }}>
            {isAuthenticated ? (
              <>
                <div style={{
                  display:'flex', alignItems:'center', gap:'0.5rem',
                  padding:'0.375rem 0.75rem', borderRadius:9999,
                  background: 'hsl(var(--muted) / 0.6)', fontSize:'0.875rem',
                }}>
                  <div style={{
                    width:24, height:24, borderRadius:'50%',
                    background: 'hsl(var(--primary))',
                    display:'flex', alignItems:'center', justifyContent:'center',
                    color: 'hsl(var(--primary-fg))', fontWeight:700, fontSize:'0.7rem',
                  }}>{user?.name?.[0]}</div>
                  <span style={{ fontWeight:500, color:'hsl(var(--foreground))' }}>{user?.name?.split(' ')[0]}</span>
                  <span style={{
                    fontSize:'0.7rem', color:'hsl(var(--muted-fg))', textTransform:'capitalize',
                    background:'hsl(var(--card))', padding:'0.125rem 0.5rem',
                    borderRadius:9999, border:'1px solid hsl(var(--border))',
                  }}>{user?.role}</span>
                </div>
                <button onClick={handleLogout} className="btn btn-ghost btn-sm" style={{ gap:'0.375rem', color:'hsl(var(--muted-fg))' }}>
                  <LogOut size={15} /> Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn btn-ghost btn-sm" style={{ fontWeight:600 }}>Log In</Link>
                <Link to="/register" className="btn btn-primary btn-sm" style={{
                  boxShadow: '0 0 15px hsl(var(--primary) / 0.3)',
                  fontWeight:600, borderRadius:'0.75rem',
                }}>Sign Up Free</Link>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(v => !v)}
            style={{
              padding:'0.5rem', borderRadius:'0.75rem', border:'none',
              background:'transparent', cursor:'pointer', color:'hsl(var(--foreground))',
            }}
            className="md-only-hide"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity:0, y:-8 }}
              animate={{ opacity:1, y:0 }}
              exit={{ opacity:0, y:-8 }}
              transition={{ duration:0.18 }}
              style={{
                borderTop: '1px solid hsl(var(--border))',
                background: 'hsl(var(--background) / 0.98)',
                backdropFilter:'blur(20px)',
                padding:'1rem',
                display:'flex', flexDirection:'column', gap:'0.5rem',
              }}
            >
              {navLinks.map(({ href, label, Icon }) => (
                <Link key={href} to={href}
                  style={{
                    display:'flex', alignItems:'center', gap:'0.75rem',
                    padding:'0.75rem 1rem', borderRadius:'0.75rem',
                    fontWeight:600, fontSize:'0.9rem',
                    color: isActive(href) ? 'hsl(var(--primary))' : 'hsl(var(--foreground))',
                    background: isActive(href) ? 'hsl(var(--muted))' : 'transparent',
                    textDecoration:'none', transition:'background 0.15s',
                  }}
                >
                  {Icon && <Icon size={16} style={{ color:'hsl(var(--muted-fg))' }} />}
                  {label}
                </Link>
              ))}
              {isAuthenticated ? (
                <button onClick={handleLogout}
                  style={{
                    display:'flex', alignItems:'center', gap:'0.5rem',
                    marginTop:'0.5rem', padding:'0.75rem 1rem',
                    borderRadius:'0.75rem', fontWeight:600, fontSize:'0.9rem',
                    background:'hsl(var(--destructive))', color:'hsl(var(--destructive-fg))',
                    border:'none', cursor:'pointer', width:'100%',
                  }}
                >
                  <LogOut size={15} /> Logout
                </button>
              ) : (
                <div style={{ display:'flex', flexDirection:'column', gap:'0.5rem', marginTop:'0.5rem' }}>
                  <Link to="/login" className="btn btn-outline" style={{ justifyContent:'center' }}>Log In</Link>
                  <Link to="/register" className="btn btn-primary" style={{ justifyContent:'center' }}>Sign Up Free</Link>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>

      {/* ── MAIN ── */}
      <main style={{ flex:1 }}>
        <div className="page-enter">{children}</div>
      </main>

      {/* ── FOOTER ── */}
      <footer style={{
        borderTop: '1px solid hsl(var(--border))',
        padding: '2.5rem 0',
        background: 'hsl(var(--muted) / 0.3)',
      }}>
        <div style={{
          maxWidth:1280, margin:'0 auto', padding:'0 1.5rem',
          display:'flex', flexWrap:'wrap', alignItems:'center',
          justifyContent:'space-between', gap:'1.5rem',
        }}>
          <div style={{ display:'flex', alignItems:'center', gap:'0.625rem', fontWeight:900, color:'hsl(var(--primary))' }}>
            <div style={{
              width:28, height:28, borderRadius:10,
              background:'hsl(var(--primary))',
              display:'flex', alignItems:'center', justifyContent:'center',
            }}>
              <Heart size={14} color="hsl(var(--primary-fg))" fill="hsl(var(--primary-fg))" />
            </div>
            NourishHub
          </div>
          <p style={{ fontSize:'0.875rem', color:'hsl(var(--muted-fg))', fontWeight:500 }}>
            Connecting surplus food to those in need. Every meal counts.
          </p>
          <div style={{ display:'flex', alignItems:'center', gap:'1rem', fontSize:'0.8rem', color:'hsl(var(--muted-fg))' }}>
            <span>Privacy</span><span>Terms</span><span>Contact</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Layout;
