import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import { donationsAPI, requestsAPI, usersAPI, pickupsAPI, adminAPI } from '../services/api';
import {
  Utensils, ClipboardList, PlusCircle, ArrowRight, Truck,
  CheckCircle2, TrendingUp, Heart, Shield, Leaf
} from 'lucide-react';
import { DONATION_STATUS_LABELS } from '../utils/donationStatus';

const STATUS_COLORS = {
  available: 'badge-available',
  pending: 'badge-pending',
  requested: 'badge-pending',
  accepted: 'badge-approved',
  assigned: 'badge-in-transit',
  picked_up: 'badge-in-transit',
  delivered: 'badge-delivered',
  cancelled: 'badge-cancelled',
  approved: 'badge-approved',
  expired: 'badge-expired',
  completed: 'badge-completed',
};

const ROLE_META = {
  donor:     { Icon: Utensils,  color:'#047857', bg:'#ecfdf5', border:'#a7f3d0', label:'Food Donor' },
  ngo:       { Icon: Heart,     color:'#1d4ed8', bg:'#eff6ff', border:'#bfdbfe', label:'NGO Partner' },
  volunteer: { Icon: Truck,     color:'#7c3aed', bg:'#f5f3ff', border:'#ddd6fe', label:'Volunteer' },
  admin:     { Icon: Shield,    color:'#b45309', bg:'#fffbeb', border:'#fde68a', label:'Administrator' },
};

const STAT_GRADIENTS = [
  'linear-gradient(135deg, #10b981, #047857)',
  'linear-gradient(135deg, #f59e0b, #d97706)',
  'linear-gradient(135deg, #3b82f6, #1d4ed8)',
  'linear-gradient(135deg, #8b5cf6, #6d28d9)',
];

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [myDonations, setMyDonations] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [myPickups, setMyPickups] = useState([]);
  const [activity, setActivity] = useState([]);

  useEffect(() => {
    // We try to fetch stats but ignore failures (if it's admin only, it may 403)
    adminAPI.getAnalytics('30')
      .then(res => { if (res.success) setStats(res.data.overview || res.data); })
      .catch(() => {});

    if (user?.role === 'donor') {
      donationsAPI.getMyDonations()
        .then(res => { if (res.success) setMyDonations(res.data.donations || []); })
        .catch(() => {});
    }
    if (user?.role === 'ngo') {
      requestsAPI.getAll()
        .then(res => { if (res.success) setMyRequests(res.data.requests || []); })
        .catch(() => {});
    }
    if (user?.role === 'volunteer') {
      pickupsAPI.getAll()
        .then(res => { if (res.success) setMyPickups(res.data.pickups || []); })
        .catch(() => {});
    }
    
    // Mock recent activity until connected directly via socket/notifications
    setActivity([
      { id:1, description:'New donation posted: "Fresh Vegetable Surplus"', timestamp: new Date(Date.now()-3600000).toISOString() },
      { id:2, description:'NGO "Food For All" claimed 25 kg vegetables', timestamp: new Date(Date.now()-7200000).toISOString() },
      { id:3, description:'Delivery completed by Amit Patel', timestamp: new Date(Date.now()-14400000).toISOString() },
      { id:4, description:'New NGO "Hope Foundation" registered', timestamp: new Date(Date.now()-86400000).toISOString() },
    ]);
  }, [user]);

  if (!user) return null;
  const meta = ROLE_META[user.role] || ROLE_META.donor;
  const { Icon: RoleIcon } = meta;

  const quickStats = [
    { label:'Total Donations', value: stats?.totalDonations ?? 0, Icon: Utensils },
    { label:'Total Users',     value: stats?.totalUsers ?? 0,    Icon: TrendingUp },
    { label:'Active Requests', value: stats?.totalRequests ?? 0, Icon: ClipboardList },
    { label:'Total Pickups',   value: stats?.totalPickups ?? 0, Icon: CheckCircle2 },
  ];

  const fmtTime = (ts) => {
    const d = new Date(ts);
    return d.toLocaleString('en-IN', { month:'short', day:'numeric', hour:'numeric', minute:'2-digit' });
  };

  return (
    <div style={{ minHeight:'100vh', background:'hsl(var(--background))' }}>

      {/* Header Banner */}
      <div style={{ position:'relative', overflow:'hidden', borderBottom:'1px solid hsl(var(--border)/0.5)', background:'linear-gradient(135deg, hsl(var(--primary)/0.08), hsl(var(--background)), hsl(var(--accent)/0.05))' }}>
        <div style={{ position:'absolute', top:0, right:0, width:384, height:256, background:'hsl(var(--primary)/0.05)', borderRadius:'50%', filter:'blur(48px)', transform:'translate(25%, -25%)', pointerEvents:'none' }} />
        <div className="container-xl" style={{ padding:'2.5rem 1.5rem', position:'relative', zIndex:10 }}>
          <div style={{ display:'flex', flexWrap:'wrap', justifyContent:'space-between', alignItems:'center', gap:'1.5rem' }}>
            <motion.div initial={{ opacity:0, x:-20 }} animate={{ opacity:1, x:0 }} style={{ display:'flex', alignItems:'center', gap:'1.25rem' }}>
              <div style={{ width:64, height:64, borderRadius:20, background:meta.bg, border:`2px solid ${meta.border}`, display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 2px 12px rgba(0,0,0,0.08)' }}>
                <RoleIcon size={30} style={{ color:meta.color }} />
              </div>
              <div>
                <p style={{ fontSize:'0.7rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.12em', color:'hsl(var(--muted-fg))', marginBottom:'0.25rem' }}>{meta.label} Dashboard</p>
                <h1 style={{ fontSize:'clamp(1.5rem, 4vw, 2rem)', fontWeight:900 }}>Welcome back, {user.name.split(' ')[0]}</h1>
              </div>
            </motion.div>

            <motion.div initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }} style={{ display:'flex', gap:'0.75rem', flexWrap:'wrap' }}>
              {user.role === 'donor' && <Link to="/donations/new" className="btn btn-primary" style={{ gap:'0.5rem', boxShadow:'0 0 20px hsl(var(--primary)/0.3)' }}><PlusCircle size={16} /> Post Donation</Link>}
              {user.role === 'ngo' && <Link to="/donations" className="btn btn-primary" style={{ gap:'0.5rem' }}><Utensils size={16} /> Find Food</Link>}
              {user.role === 'admin' && <Link to="/admin" className="btn btn-primary" style={{ gap:'0.5rem' }}><Shield size={16} /> Admin Panel</Link>}
            </motion.div>
          </div>
        </div>
      </div>

      <div className="container-xl" style={{ padding:'2.5rem 1.5rem' }}>

        {/* Quick Stats */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(180px, 1fr))', gap:'1rem', marginBottom:'2.5rem' }}>
          {quickStats.map((s, i) => (
            <motion.div key={i} initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay: i*0.07 }}>
              <div style={{ position:'relative', overflow:'hidden', borderRadius:20, padding:'1.25rem', color:'#fff', boxShadow:'0 4px 16px rgba(0,0,0,0.15)', background: STAT_GRADIENTS[i] }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'0.375rem' }}>
                  <s.Icon size={18} style={{ opacity:0.8 }} />
                  <span style={{ fontSize:'1.75rem', fontWeight:900 }}>{s.value}</span>
                </div>
                <p style={{ fontSize:'0.8rem', fontWeight:600, opacity:0.9 }}>{s.label}</p>
                <div style={{ position:'absolute', bottom:-16, right:-16, width:80, height:80, borderRadius:'50%', background:'rgba(255,255,255,0.1)' }} />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Main Grid */}
        <div style={{ display:'grid', gridTemplateColumns:'minmax(0, 1fr) 320px', gap:'2rem' }}>

          {/* Left column */}
          <div style={{ display:'flex', flexDirection:'column', gap:'1.5rem' }}>

            {/* Donor: My Donations */}
            {user.role === 'donor' && (
              <motion.div className="card" initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.3 }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'1.25rem 1.75rem', borderBottom:'1px solid hsl(var(--border)/0.5)' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
                    <div style={{ width:32, height:32, borderRadius:10, background:'hsl(var(--primary)/0.1)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                      <Utensils size={15} style={{ color:'hsl(var(--primary))' }} />
                    </div>
                    <h2 style={{ fontSize:'1rem', fontWeight:700 }}>My Recent Donations</h2>
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:'1rem', flexWrap:'wrap' }}>
                    <Link to="/requests" style={{ display:'flex', alignItems:'center', gap:'0.25rem', fontSize:'0.875rem', color:'#2563eb', fontWeight:600, textDecoration:'none' }}>
                      NGO requests <ArrowRight size={14} />
                    </Link>
                    <Link to="/donations" style={{ display:'flex', alignItems:'center', gap:'0.25rem', fontSize:'0.875rem', color:'hsl(var(--primary))', fontWeight:600, textDecoration:'none' }}>View All <ArrowRight size={14} /></Link>
                  </div>
                </div>
                <div style={{ padding:'1rem' }}>
                  {!myDonations.length ? (
                    <div style={{ textAlign:'center', padding:'3rem 1rem' }}>
                      <div style={{ width:56, height:56, borderRadius:16, background:'hsl(var(--muted))', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 0.75rem' }}>
                        <Utensils size={24} style={{ color:'hsl(var(--muted-fg))' }} />
                      </div>
                      <p style={{ color:'hsl(var(--muted-fg))', fontWeight:500, marginBottom:'0.75rem' }}>No donations posted yet.</p>
                      <Link to="/donations/new" className="btn btn-primary btn-sm">Post your first donation</Link>
                    </div>
                  ) : (
                    <div style={{ display:'flex', flexDirection:'column', gap:'0.25rem' }}>
                      {myDonations.slice(0, 6).map(d => {
                        const did = d._id || d.id;
                        const q = d.quantity && typeof d.quantity === 'object' ? `${d.quantity.value} ${d.quantity.unit}` : '';
                        return (
                        <Link key={did} to={`/donations/${did}`} style={{ textDecoration:'none' }}>
                          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0.875rem 1rem', borderRadius:'1rem', transition:'background 0.15s', cursor:'pointer', border:'1px solid transparent' }}
                            onMouseEnter={e => { e.currentTarget.style.background='hsl(var(--muted)/0.5)'; e.currentTarget.style.borderColor='hsl(var(--border)/0.5)'; }}
                            onMouseLeave={e => { e.currentTarget.style.background='transparent'; e.currentTarget.style.borderColor='transparent'; }}>
                            <div style={{ display:'flex', alignItems:'center', gap:'1rem' }}>
                              <div style={{ width:40, height:40, borderRadius:12, background:'hsl(var(--primary)/0.08)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                                <Leaf size={18} style={{ color:'hsl(var(--primary))' }} />
                              </div>
                              <div>
                                <p style={{ fontWeight:600, marginBottom:'0.125rem' }}>{d.foodName || d.title}</p>
                                <p style={{ fontSize:'0.8125rem', color:'hsl(var(--muted-fg))', textTransform:'capitalize' }}>{q}{d.foodType ? ` · ${d.foodType}` : ''}</p>
                              </div>
                            </div>
                            <span className={`badge ${STATUS_COLORS[d.status] || 'badge-pending'}`}>{DONATION_STATUS_LABELS[d.status] || d.status}</span>
                          </div>
                        </Link>
                      );})}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* NGO: My Requests */}
            {user.role === 'ngo' && (
              <motion.div className="card" initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.3 }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'1.25rem 1.75rem', borderBottom:'1px solid hsl(var(--border)/0.5)' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
                    <div style={{ width:32, height:32, borderRadius:10, background:'#eff6ff', display:'flex', alignItems:'center', justifyContent:'center' }}>
                      <ClipboardList size={15} style={{ color:'#2563eb' }} />
                    </div>
                    <h2 style={{ fontSize:'1rem', fontWeight:700 }}>My Food Requests</h2>
                  </div>
                  <Link to="/requests" style={{ display:'flex', alignItems:'center', gap:'0.25rem', fontSize:'0.875rem', color:'hsl(var(--primary))', fontWeight:600, textDecoration:'none' }}>View All <ArrowRight size={14} /></Link>
                </div>
                <div style={{ padding:'1rem' }}>
                  {!myRequests.length ? (
                    <div style={{ textAlign:'center', padding:'3rem 1rem' }}>
                      <p style={{ color:'hsl(var(--muted-fg))', fontWeight:500, marginBottom:'0.75rem' }}>No active food requests.</p>
                      <Link to="/donations" className="btn btn-primary btn-sm">Browse available food</Link>
                    </div>
                  ) : (
                    <div style={{ display:'flex', flexDirection:'column', gap:'0.25rem' }}>
                      {myRequests.slice(0, 6).map(r => {
                        const dObj = r.donationId || {};
                        const title = dObj.foodName || `Donation #${dObj._id || dObj}`;
                        const qty = dObj.quantity ? `${dObj.quantity.value} ${dObj.quantity.unit}` : '';
                        
                        return (
                        <div key={r._id || r.id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0.875rem 1rem', borderRadius:'1rem', border:'1px solid transparent' }}>
                          <div style={{ display:'flex', alignItems:'center', gap:'1rem' }}>
                            <div style={{ width:40, height:40, borderRadius:12, background:'#eff6ff', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                              <Heart size={18} style={{ color:'#2563eb' }} />
                            </div>
                            <div>
                              <p style={{ fontWeight:600, marginBottom:'0.125rem' }}>{title}</p>
                              <p style={{ fontSize:'0.8125rem', color:'hsl(var(--muted-fg))' }}>{qty}</p>
                            </div>
                          </div>
                          <span className={`badge ${STATUS_COLORS[r.status] || 'badge-pending'}`}>{r.status}</span>
                        </div>
                      );})}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Volunteer: Deliveries */}
            {user.role === 'volunteer' && (
              <motion.div className="card" initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.3 }}>
                <div style={{ display:'flex', alignItems:'center', gap:'0.75rem', padding:'1.25rem 1.75rem', borderBottom:'1px solid hsl(var(--border)/0.5)' }}>
                  <div style={{ width:32, height:32, borderRadius:10, background:'#f5f3ff', display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <Truck size={15} style={{ color:'#7c3aed' }} />
                  </div>
                  <h2 style={{ fontSize:'1rem', fontWeight:700 }}>My Deliveries</h2>
                </div>
                <div style={{ padding:'1rem' }}>
                  {!myPickups.length ? (
                    <div style={{ textAlign:'center', padding:'3rem 1rem' }}>
                      <div style={{ width:56, height:56, borderRadius:16, background:'#f5f3ff', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 0.75rem' }}>
                        <Truck size={24} style={{ color:'#7c3aed' }} />
                      </div>
                      <p style={{ color:'hsl(var(--muted-fg))', fontWeight:500, marginBottom:'0.75rem' }}>Check back soon for delivery opportunities.</p>
                      <Link to="/donations" className="btn btn-outline btn-sm">Browse available food</Link>
                    </div>
                  ) : (
                    <div style={{ display:'flex', flexDirection:'column', gap:'0.25rem' }}>
                      {myPickups.map(p => (
                        <div key={p.id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0.875rem 1rem', borderRadius:'1rem', border:'1px solid hsl(var(--border)/0.5)' }}>
                          <div>
                            <p style={{ fontWeight:600, marginBottom:'0.125rem' }}>{p.donationTitle}</p>
                            <p style={{ fontSize:'0.8125rem', color:'hsl(var(--muted-fg))' }}>{p.pickupAddress}</p>
                          </div>
                          <span className={`badge ${STATUS_COLORS[p.status] || 'badge-pending'}`}>{p.status}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Admin: Quick Actions */}
            {user.role === 'admin' && (
              <motion.div className="card" initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.3 }}>
                <div style={{ display:'flex', alignItems:'center', gap:'0.75rem', padding:'1.25rem 1.75rem', borderBottom:'1px solid hsl(var(--border)/0.5)' }}>
                  <div style={{ width:32, height:32, borderRadius:10, background:'#fffbeb', display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <Shield size={15} style={{ color:'#b45309' }} />
                  </div>
                  <h2 style={{ fontSize:'1rem', fontWeight:700 }}>Admin Controls</h2>
                </div>
                <div style={{ padding:'1.5rem', display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem' }}>
                  {[
                    { href:'/admin', Icon:Shield, label:'Analytics & Users', bg:'#fffbeb', color:'#92400e', border:'#fde68a' },
                    { href:'/donations', Icon:Utensils, label:'All Donations', bg:'#ecfdf5', color:'#065f46', border:'#a7f3d0' },
                    { href:'/requests', Icon:ClipboardList, label:'All Requests', bg:'#eff6ff', color:'#1e3a8a', border:'#bfdbfe' },
                    { href:'/donations/new', Icon:PlusCircle, label:'Post Donation', bg:'#f5f3ff', color:'#4c1d95', border:'#ddd6fe' },
                  ].map(({ href, Icon: Ic, label, bg, color, border }) => (
                    <Link key={href} to={href} style={{ textDecoration:'none', display:'block' }}>
                      <div style={{ width:'100%', height:96, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:'0.625rem', borderRadius:16, border:`2px solid ${border}`, background:bg, color, fontWeight:600, fontSize:'0.875rem', cursor:'pointer', transition:'all 0.2s', boxShadow:'0 2px 10px rgba(0,0,0,0.02)' }}
                           onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.06)'; }}
                           onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,0,0,0.02)'; }}>
                        <Ic size={22} />
                        {label}
                      </div>
                    </Link>
                  ))}
                </div>
              </motion.div>
            )}
          </div>

          {/* Right: Activity Feed */}
          <div>
            <motion.div className="card" initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }} transition={{ delay:0.35 }} style={{ position:'sticky', top:'5rem' }}>
              <div style={{ display:'flex', alignItems:'center', gap:'0.75rem', padding:'1.25rem 1.5rem', borderBottom:'1px solid hsl(var(--border)/0.5)' }}>
                <div style={{ width:32, height:32, borderRadius:10, background:'hsl(var(--primary)/0.1)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <CheckCircle2 size={15} style={{ color:'hsl(var(--primary))' }} />
                </div>
                <h2 style={{ fontSize:'1rem', fontWeight:700 }}>Recent Activity</h2>
                <span style={{ marginLeft:'auto', width:8, height:8, borderRadius:'50%', background:'#10b981' }} className="animate-pulse" />
              </div>
              <div style={{ padding:'1.25rem', display:'flex', flexDirection:'column', gap:'0', maxHeight:480, overflowY:'auto' }}>
                {activity.map((item, idx) => (
                  <div key={item.id} style={{ position:'relative', paddingLeft:'1.75rem', paddingBottom: idx < activity.length-1 ? '1.25rem' : 0 }}>
                    <div style={{ position:'absolute', left:0, top:4, width:12, height:12, borderRadius:'50%', background:'hsl(var(--primary))', border:'2px solid hsl(var(--background))', boxShadow:'0 0 0 2px hsl(var(--primary)/0.2)' }} />
                    {idx < activity.length-1 && (
                      <div style={{ position:'absolute', left:5, top:16, bottom:0, width:1, background:'hsl(var(--border))' }} />
                    )}
                    <p style={{ fontSize:'0.875rem', fontWeight:500, lineHeight:1.4, marginBottom:'0.25rem' }}>{item.description}</p>
                    <p style={{ fontSize:'0.75rem', color:'hsl(var(--muted-fg))' }}>{fmtTime(item.timestamp)}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
