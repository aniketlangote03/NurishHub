import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { adminAPI, donationsAPI, pickupsAPI } from '../services/api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { Users, Utensils, CheckCircle2, ClipboardList, Truck } from 'lucide-react';
import { DONATION_STATUS_LABELS } from '../utils/donationStatus';

const CITY_DATA = [
  { name:'Mumbai', total:45 }, { name:'Delhi', total:38 },
  { name:'Bangalore', total:30 }, { name:'Chennai', total:20 },
  { name:'Hyderabad', total:15, }, { name:'Pune', total:12 },
];

const STATUS_DATA = [
  { name:'Available', value:25 }, { name:'Pending', value:15 }, { name:'Delivered', value:60 },
];

const PIE_COLORS = ['#10b981','#f59e0b','#3b82f6'];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) return (
    <div style={{ background:'hsl(var(--card))', border:'1px solid hsl(var(--border))', borderRadius:12, padding:'0.75rem 1rem', boxShadow:'0 8px 24px rgba(0,0,0,0.1)', fontSize:'0.875rem' }}>
      {label && <p style={{ fontWeight:700, marginBottom:'0.25rem' }}>{label}</p>}
      {payload.map(p => <p key={p.name} style={{ color:p.color || 'hsl(var(--foreground))' }}>{p.name}: <strong>{p.value}</strong></p>)}
    </div>
  );
  return null;
};

export default function AdminPanel() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [donations, setDonations] = useState([]);
  const [volunteers, setVolunteers] = useState([]);
  const [opsLoading, setOpsLoading] = useState(true);
  const [volunteerPick, setVolunteerPick] = useState({});
  const [assignBusy, setAssignBusy] = useState(null);

  const loadOperations = useCallback(async () => {
    setOpsLoading(true);
    try {
      const [dRes, vRes] = await Promise.all([
        donationsAPI.getAll({ limit: 100 }),
        adminAPI.getUsers({ role: 'volunteer', limit: 100 }),
      ]);
      if (dRes?.success) setDonations(dRes.data?.donations || []);
      if (vRes?.success) setVolunteers(vRes.data?.users || []);
    } catch {
      /* ignore */
    } finally {
      setOpsLoading(false);
    }
  }, []);

  useEffect(() => {
    adminAPI.getAnalytics().then(res => {
      if (res.success) setStats(res.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadOperations();
  }, [loadOperations]);

  const assignVolunteer = async (donationId) => {
    const volunteerId = volunteerPick[donationId];
    if (!volunteerId) {
      alert('Select a volunteer first.');
      return;
    }
    setAssignBusy(donationId);
    try {
      const res = await pickupsAPI.assign({ donationId, volunteerId });
      if (res?.success) {
        await loadOperations();
        alert('Volunteer assigned. They will see the task under Pickups.');
      }
    } catch (e) {
      alert(typeof e === 'string' ? e : 'Assignment failed (is the NGO accepted and volunteer available?)');
    } finally {
      setAssignBusy(null);
    }
  };

  const overview = stats?.overview || {};

  const metricCards = [
    { label:'Total Users', value: overview.totalUsers ?? 0, Icon: Users, gradient:'linear-gradient(135deg, #6366f1, #4f46e5)' },
    { label:'Total Donations', value: overview.totalDonations ?? 0, Icon: Utensils, gradient:'linear-gradient(135deg, #10b981, #047857)' },
    { label:'Delivered', value: overview.deliveredDonations ?? 0, Icon: CheckCircle2, gradient:'linear-gradient(135deg, #f59e0b, #d97706)' },
    { label:'Waste Reduced (Kg)', value: overview.wasteReducedKg ?? 0, Icon: ClipboardList, gradient:'linear-gradient(135deg, #3b82f6, #1d4ed8)' },
  ];

  return (
    <div style={{ minHeight:'100vh', background:'hsl(var(--background))' }}>
      <div style={{ background:'hsl(var(--muted)/0.3)', borderBottom:'1px solid hsl(var(--border)/0.5)', padding:'2rem 0' }}>
        <div className="container-xl">
          <h1 style={{ fontSize:'clamp(1.5rem, 4vw, 2.25rem)', fontWeight:900, marginBottom:'0.5rem' }}>Admin Overview</h1>
          <p style={{ color:'hsl(var(--muted-fg))' }}>Platform analytics and management dashboard.</p>
        </div>
      </div>

      <div className="container-xl" style={{ padding:'2.5rem 1.5rem' }}>

        {/* ─── Core ops: donations + volunteer assignment (teacher expectation) ─── */}
        <motion.div className="card" initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} style={{ marginBottom:'2rem', overflow:'hidden' }}>
          <div style={{ padding:'1.25rem 1.5rem', borderBottom:'1px solid hsl(var(--border)/0.5)', display:'flex', alignItems:'center', gap:'0.75rem' }}>
            <div style={{ width:40, height:40, borderRadius:12, background:'#ecfdf5', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Truck size={20} style={{ color:'#047857' }} />
            </div>
            <div>
              <h2 style={{ fontSize:'1.125rem', fontWeight:700 }}>Donations & volunteer assignment</h2>
              <p style={{ fontSize:'0.8125rem', color:'hsl(var(--muted-fg))' }}>
                View all donations (<code style={{ fontSize:'0.85em' }}>GET /api/donations</code>). After status is{' '}
                <strong>Accepted</strong> (NGO locked), assign a volunteer — <code style={{ fontSize:'0.85em' }}>POST /api/pickup/assign</code>.
              </p>
            </div>
          </div>
          <div style={{ overflowX:'auto' }}>
            {opsLoading ? (
              <div style={{ padding:'2rem', textAlign:'center', color:'hsl(var(--muted-fg))' }}>Loading donations…</div>
            ) : (
              <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'0.875rem' }}>
                <thead>
                  <tr style={{ background:'hsl(var(--muted)/0.35)', textAlign:'left' }}>
                    <th style={{ padding:'0.75rem 1rem' }}>Food</th>
                    <th style={{ padding:'0.75rem 1rem' }}>City</th>
                    <th style={{ padding:'0.75rem 1rem' }}>Status</th>
                    <th style={{ padding:'0.75rem 1rem' }}>Volunteer</th>
                    <th style={{ padding:'0.75rem 1rem' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {donations.length === 0 ? (
                    <tr><td colSpan={5} style={{ padding:'2rem', textAlign:'center', color:'hsl(var(--muted-fg))' }}>No donations yet.</td></tr>
                  ) : donations.map((d) => {
                    const id = d._id || d.id;
                    const volId = d.assignedVolunteer?._id || d.assignedVolunteer;
                    const canAssign = d.status === 'accepted' && !volId;
                    return (
                      <tr key={id} style={{ borderTop:'1px solid hsl(var(--border)/0.4)' }}>
                        <td style={{ padding:'0.75rem 1rem', fontWeight:600 }}>{d.foodName}</td>
                        <td style={{ padding:'0.75rem 1rem', color:'hsl(var(--muted-fg))' }}>{d.address?.city || '—'}</td>
                        <td style={{ padding:'0.75rem 1rem' }}>
                          <span className="badge badge-pending" style={{ fontSize:'0.7rem' }}>
                            {DONATION_STATUS_LABELS[d.status] || d.status}
                          </span>
                        </td>
                        <td style={{ padding:'0.75rem 1rem', color:'hsl(var(--muted-fg))' }}>
                          {volId ? 'Assigned' : '—'}
                        </td>
                        <td style={{ padding:'0.75rem 1rem' }}>
                          {canAssign ? (
                            <div style={{ display:'flex', flexWrap:'wrap', gap:'0.5rem', alignItems:'center' }}>
                              <select
                                className="form-input"
                                style={{ minWidth:160, fontSize:'0.8125rem', padding:'0.35rem 0.5rem' }}
                                value={volunteerPick[id] || ''}
                                onChange={(e) => setVolunteerPick((p) => ({ ...p, [id]: e.target.value }))}
                              >
                                <option value="">Select volunteer</option>
                                {volunteers.map((v) => (
                                  <option key={v._id} value={v._id}>
                                    {v.name} {v.volunteerDetails?.availability === false ? '(busy)' : ''}
                                  </option>
                                ))}
                              </select>
                              <button
                                type="button"
                                className="btn btn-primary btn-sm"
                                disabled={assignBusy === id}
                                onClick={() => assignVolunteer(id)}
                              >
                                {assignBusy === id ? '…' : 'Assign'}
                              </button>
                            </div>
                          ) : (
                            <span style={{ color:'hsl(var(--muted-fg))', fontSize:'0.8125rem' }}>
                              {d.status !== 'accepted' ? 'Wait for NGO acceptance' : 'Already assigned'}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </motion.div>

        {/* Metric Cards */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:'1rem', marginBottom:'2.5rem' }}>
          {metricCards.map((c, i) => (
            <motion.div key={i} initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay: i*0.07 }}>
              <div style={{ position:'relative', overflow:'hidden', borderRadius:20, padding:'1.5rem', color:'#fff', background: c.gradient, boxShadow:'0 4px 20px rgba(0,0,0,0.15)' }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'0.5rem' }}>
                  <c.Icon size={20} style={{ opacity:0.85 }} />
                  <span style={{ fontSize:'2rem', fontWeight:900 }}>{loading ? '—' : c.value}</span>
                </div>
                <p style={{ fontSize:'0.85rem', fontWeight:600, opacity:0.9 }}>{c.label}</p>
                <div style={{ position:'absolute', bottom:-20, right:-20, width:80, height:80, borderRadius:'50%', background:'rgba(255,255,255,0.1)' }} />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Charts */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(320px, 1fr))', gap:'2rem' }}>

          {/* Bar Chart */}
          <motion.div className="card" initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.3 }} style={{ padding:'1.5rem' }}>
            <h2 style={{ fontSize:'1.125rem', fontWeight:700, marginBottom:'1.5rem' }}>Donations by City</h2>
            <div style={{ height:280 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={CITY_DATA} margin={{ top:0, right:0, left:-10, bottom:0 }}>
                  <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} tick={{ fill:'hsl(var(--muted-fg))' }} />
                  <YAxis fontSize={12} tickLine={false} axisLine={false} tick={{ fill:'hsl(var(--muted-fg))' }} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill:'hsl(var(--muted)/0.5)', radius:8 }} />
                  <Bar dataKey="total" fill="hsl(var(--primary))" radius={[6,6,0,0]} name="Donations" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Pie Chart */}
          <motion.div className="card" initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.4 }} style={{ padding:'1.5rem' }}>
            <h2 style={{ fontSize:'1.125rem', fontWeight:700, marginBottom:'1.5rem' }}>Donation Status Breakdown</h2>
            <div style={{ height:280 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={STATUS_DATA} cx="50%" cy="45%" innerRadius={60} outerRadius={90} paddingAngle={4} dataKey="value">
                    {STATUS_DATA.map((_, idx) => (
                      <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend iconType="circle" iconSize={10} formatter={(v) => <span style={{ fontSize:'0.8125rem', color:'hsl(var(--foreground))' }}>{v}</span>} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </div>

        {/* User stats */}
        <motion.div className="card" initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.5 }} style={{ marginTop:'2rem', padding:'1.5rem' }}>
          <h2 style={{ fontSize:'1.125rem', fontWeight:700, marginBottom:'1.25rem' }}>User Breakdown</h2>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(160px, 1fr))', gap:'1rem' }}>
            {[
              { label:'Donors', value: stats?.totalDonors, color:'hsl(var(--primary))', bg:'hsl(var(--primary)/0.08)' },
              { label:'NGOs', value: stats?.totalNgos, color:'#3b82f6', bg:'#eff6ff' },
              { label:'Volunteers', value: stats?.totalVolunteers, color:'#7c3aed', bg:'#f5f3ff' },
              { label:'Meals Served', value: stats?.mealsServed?.toLocaleString(), color:'hsl(var(--accent))', bg:'hsl(var(--accent)/0.08)' },
            ].map((u, i) => (
              <div key={i} style={{ padding:'1.25rem', borderRadius:16, background:u.bg, textAlign:'center' }}>
                <p style={{ fontSize:'2rem', fontWeight:900, color:u.color }}>{loading ? '—' : u.value}</p>
                <p style={{ fontSize:'0.8125rem', fontWeight:600, color:'hsl(var(--muted-fg))' }}>{u.label}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
