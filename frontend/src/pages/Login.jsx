import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, ArrowRight, Loader } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { authAPI } from '../services/api';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.email || !form.password) { setError('Please fill in all fields.'); return; }
    setLoading(true);
    try {
      const res = await login(form.email, form.password);
      if (res.success) {
        navigate('/dashboard');
      } else {
        setError(res.message || 'Invalid credentials. Please try again.');
      }
    } catch (err) {
      setError(err?.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: 'calc(100vh - 64px)', display: 'flex' }}>

      {/* LEFT — 3D Animated Panel */}
      <div style={{ display:'none', width:'50%', position:'relative', overflow:'hidden', background:'hsl(var(--primary)/0.10)', alignItems:'center', justifyContent:'center', flexDirection:'column', padding:'3rem' }}
        className="lg-show" id="login-left">
        <div className="mesh-gradient" style={{ position:'absolute', inset:0, opacity:0.8 }} />

        {/* Floating shapes */}
        <div style={{ position:'absolute', inset:0, pointerEvents:'none' }}>
          <div className="animate-float-slow glass" style={{ position:'absolute', top:'20%', left:'20%', width:128, height:128, borderRadius:'50%', opacity:0.6 }} />
          <div className="animate-spin3d glass" style={{ position:'absolute', bottom:'30%', right:'15%', width:192, height:192, borderRadius:24, opacity:0.5, boxShadow:'0 20px 60px rgba(0,0,0,0.1)', animationDuration:'30s' }} />
          <div className="animate-float glass" style={{ position:'absolute', top:'40%', right:'25%', width:96, height:96, borderRadius:16, background:'hsl(var(--primary)/0.20)', opacity:0.7, animationDelay:'1.5s', transform:'rotate(15deg)' }} />
        </div>

        {/* Card */}
        <div style={{ position:'relative', zIndex:10, background:'rgba(255,255,255,0.4)', backdropFilter:'blur(20px)', border:'1px solid rgba(255,255,255,0.4)', borderRadius:32, padding:'2.5rem', maxWidth:380, textAlign:'center', boxShadow:'0 25px 60px rgba(0,0,0,0.12)' }}>
          <motion.div animate={{ scale:[1,1.08,1] }} transition={{ duration:2, repeat:Infinity, repeatDelay:2 }}
            style={{ width:64, height:64, background:'hsl(var(--primary))', color:'hsl(var(--primary-fg))', borderRadius:20, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 1.5rem', boxShadow:'0 0 30px hsl(var(--primary)/0.4)' }}>
            <Heart size={32} fill="hsl(var(--primary-fg))" />
          </motion.div>
          <h2 style={{ fontSize:'1.75rem', fontWeight:800, marginBottom:'1rem' }}>Welcome Back to NourishHub</h2>
          <p style={{ fontSize:'1rem', color:'hsl(var(--foreground)/0.8)', fontWeight:500, lineHeight:1.6 }}>
            Continue your mission to rescue food, feed communities, and eliminate waste.
          </p>
        </div>
      </div>

      {/* RIGHT — Form */}
      <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', padding:'3rem 1.5rem', background:'hsl(var(--background))', position:'relative' }}>
        <div style={{ position:'absolute', inset:0, backgroundImage:"url('https://images.unsplash.com/photo-1488459716781-31db52582fe9?auto=format&fit=crop&q=80')", backgroundSize:'cover', backgroundPosition:'center', opacity:0.03, pointerEvents:'none' }} />

        <div style={{ width:'100%', maxWidth:420, position:'relative', zIndex:10 }}>
          <div style={{ textAlign:'center', marginBottom:'2.5rem' }}>
            <h1 style={{ fontSize:'2.25rem', fontWeight:700, letterSpacing:'-0.025em', marginBottom:'0.5rem' }}>Log In</h1>
            <p style={{ color:'hsl(var(--muted-fg))', fontSize:'1rem' }}>Enter your credentials to access your account</p>
          </div>

          <div className="glass-card" style={{ background:'hsl(var(--card)/0.8)', padding:'2.5rem', borderRadius:'1.5rem', border:'1px solid hsl(var(--border)/0.5)', boxShadow:'0 20px 60px rgba(0,0,0,0.08)' }}>
            {error && (
              <div className="alert-error" style={{ marginBottom:'1.5rem' }}>{error}</div>
            )}


            <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:'1.25rem' }}>
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input type="email" className="form-input form-input-lg" placeholder="you@example.com"
                  value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Password</label>
                <input type="password" className="form-input form-input-lg" placeholder="••••••••"
                  value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} />
              </div>
              <button type="submit" className="btn btn-primary btn-lg" disabled={loading}
                style={{ width:'100%', marginTop:'0.5rem', fontSize:'1rem', fontWeight:700, borderRadius:'0.875rem', justifyContent:'center' }}>
                {loading ? <><span className="spinner" style={{ width:18, height:18, borderTopColor:'#fff' }} /> Logging in...</> : <>Log In <ArrowRight size={18} /></>}
              </button>
            </form>
          </div>

          <p style={{ textAlign:'center', marginTop:'2rem', color:'hsl(var(--muted-fg))', fontWeight:500 }}>
            Don't have an account?{' '}
            <Link to="/register" style={{ color:'hsl(var(--primary))', fontWeight:700 }}>Sign up</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
