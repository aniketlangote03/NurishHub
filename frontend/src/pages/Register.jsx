import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, ArrowRight, Loader } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { authAPI } from '../services/api';

const ROLES = [
  { value:'donor',    label:'Food Donor (Restaurant, Event, etc.)' },
  { value:'ngo',      label:'NGO / Food Bank' },
  { value:'volunteer',label:'Volunteer Driver' },
  { value:'admin',    label:'Administrator' },
];

export default function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [form, setForm] = useState({ name:'', email:'', password:'', role:'donor', phone:'', city:'', organizationName:'' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.name || !form.email || !form.password) { setError('Please fill in all required fields.'); return; }
    if (form.password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    setLoading(true);
    try {
      const res = await register(form);
      if (res.success) {
        navigate('/dashboard');
      } else {
        setError(res.message || 'Registration failed. Please try again.');
      }
    } catch (err) {
      setError(err?.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight:'calc(100vh - 64px)', display:'flex' }}>

      {/* LEFT — Form */}
      <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', padding:'3rem 1.5rem', background:'hsl(var(--background))', position:'relative', overflowY:'auto' }}>
        <div style={{ position:'absolute', inset:0, backgroundImage:"url('https://images.unsplash.com/photo-1488459716781-31db52582fe9?auto=format&fit=crop&q=80')", backgroundSize:'cover', backgroundPosition:'center', opacity:0.03, pointerEvents:'none' }} />

        <div style={{ width:'100%', maxWidth:440, position:'relative', zIndex:10, paddingTop:'2rem', paddingBottom:'2rem' }}>
          <div style={{ textAlign:'center', marginBottom:'2rem' }}>
            <h1 style={{ fontSize:'2.25rem', fontWeight:700, letterSpacing:'-0.025em', marginBottom:'0.5rem' }}>Join the Mission</h1>
            <p style={{ color:'hsl(var(--muted-fg))', fontSize:'1rem' }}>Create an account to start rescuing food.</p>
          </div>

          <div className="glass-card" style={{ background:'hsl(var(--card)/0.8)', padding:'2rem', borderRadius:'1.5rem', border:'1px solid hsl(var(--border)/0.5)', boxShadow:'0 20px 60px rgba(0,0,0,0.08)' }}>
            {error && <div className="alert-error" style={{ marginBottom:'1.25rem' }}>{error}</div>}

            <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
              <div className="form-group">
                <label className="form-label">I am a…</label>
                <select className="form-input" value={form.role} onChange={set('role')}>
                  {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Full Name <span style={{ color:'hsl(var(--destructive))' }}>*</span></label>
                <input className="form-input" placeholder="John Doe" value={form.name} onChange={set('name')} />
              </div>

              {(form.role === 'donor' || form.role === 'ngo') && (
                <div className="form-group">
                  <label className="form-label">Organization Name</label>
                  <input className="form-input" placeholder="Example Restaurant / Shelter" value={form.organizationName} onChange={set('organizationName')} />
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Email Address <span style={{ color:'hsl(var(--destructive))' }}>*</span></label>
                <input type="email" className="form-input" placeholder="you@example.com" value={form.email} onChange={set('email')} />
              </div>

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.75rem' }}>
                <div className="form-group">
                  <label className="form-label">Phone</label>
                  <input className="form-input" placeholder="555-0123" value={form.phone} onChange={set('phone')} />
                </div>
                <div className="form-group">
                  <label className="form-label">City</label>
                  <input className="form-input" placeholder="New York" value={form.city} onChange={set('city')} />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Password <span style={{ color:'hsl(var(--destructive))' }}>*</span></label>
                <input type="password" className="form-input" placeholder="••••••••" value={form.password} onChange={set('password')} />
                <span className="form-hint">At least 6 characters</span>
              </div>

              <button type="submit" className="btn btn-primary btn-lg" disabled={loading}
                style={{ width:'100%', marginTop:'0.5rem', fontSize:'1rem', fontWeight:700, borderRadius:'0.875rem', justifyContent:'center' }}>
                {loading ? <><span className="spinner" style={{ width:18, height:18, borderTopColor:'#fff' }} /> Registering...</> : <>Create Account <ArrowRight size={18} /></>}
              </button>
            </form>
          </div>

          <p style={{ textAlign:'center', marginTop:'2rem', color:'hsl(var(--muted-fg))', fontWeight:500 }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color:'hsl(var(--primary))', fontWeight:700 }}>Log in</Link>
          </p>
        </div>
      </div>

      {/* RIGHT — 3D Animated Panel */}
      <div className="lg-show" style={{ display:'none', width:'50%', position:'relative', overflow:'hidden', background:'hsl(var(--accent)/0.10)', alignItems:'center', justifyContent:'center', flexDirection:'column', padding:'3rem' }}>
        <div className="mesh-gradient" style={{ position:'absolute', inset:0, opacity:0.6 }} />

        <div style={{ position:'absolute', inset:0, pointerEvents:'none' }}>
          <div className="animate-spin3d glass" style={{ position:'absolute', top:'15%', right:'20%', width:160, height:160, borderRadius:24, opacity:0.6, animationDuration:'25s' }} />
          <div className="animate-float glass" style={{ position:'absolute', bottom:'25%', left:'15%', width:128, height:128, borderRadius:'50%', opacity:0.7, animationDelay:'1s' }} />
          <div className="animate-float-slow" style={{ position:'absolute', top:'50%', left:'30%', width:80, height:80, background:'hsl(var(--secondary)/0.3)', backdropFilter:'blur(20px)', borderRadius:12, opacity:0.8, animationDelay:'2s', transform:'rotate(-15deg)' }} />
        </div>

        <div style={{ position:'relative', zIndex:10, background:'rgba(255,255,255,0.4)', backdropFilter:'blur(20px)', border:'1px solid rgba(255,255,255,0.4)', borderRadius:32, padding:'2.5rem', maxWidth:380, textAlign:'center', boxShadow:'0 25px 60px rgba(0,0,0,0.12)' }}>
          <div style={{ width:64, height:64, background:'hsl(var(--accent))', borderRadius:20, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 1.5rem', boxShadow:'0 0 30px hsl(var(--accent)/0.4)' }}>
            <Heart size={32} color="hsl(var(--accent-fg))" />
          </div>
          <h2 style={{ fontSize:'1.75rem', fontWeight:800, marginBottom:'1rem' }}>Every Meal Matters</h2>
          <p style={{ fontSize:'1rem', color:'hsl(var(--foreground)/0.8)', fontWeight:500, lineHeight:1.6 }}>
            Join our network of over 10,000 users connecting surplus food with those who need it most.
          </p>
        </div>
      </div>
    </div>
  );
}
