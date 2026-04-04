import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView, useMotionValue, useSpring, useTransform } from 'framer-motion';
import {
  HeartHandshake, Truck, Users, ArrowRight, Leaf, Heart,
  Building2, ChevronRight, Quote
} from 'lucide-react';

/* ── Animated Counter ── */
function AnimatedCounter({ value, duration = 2 }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  const motionVal = useMotionValue(0);
  const spring = useSpring(motionVal, { duration: duration * 1000, bounce: 0 });
  const [display, setDisplay] = useState(0);
  useEffect(() => { if (inView) motionVal.set(value); }, [inView, value, motionVal]);
  useEffect(() => spring.on('change', (v) => setDisplay(Math.round(v))), [spring]);
  return <span ref={ref}>{display.toLocaleString()}</span>;
}

/* ── 3D Tilt Card ── */
function TiltCard({ children, style = {} }) {
  const ref = useRef(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [6, -6]), { stiffness: 300, damping: 30 });
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-6, 6]), { stiffness: 300, damping: 30 });
  const handleMove = (e) => {
    if (!ref.current) return;
    const r = ref.current.getBoundingClientRect();
    x.set((e.clientX - r.left) / r.width - 0.5);
    y.set((e.clientY - r.top) / r.height - 0.5);
  };
  return (
    <motion.div ref={ref} onMouseMove={handleMove}
      onMouseLeave={() => { x.set(0); y.set(0); }}
      style={{ rotateX, rotateY, transformStyle: 'preserve-3d', perspective: 800, ...style }}>
      {children}
    </motion.div>
  );
}

/* ── Marquee ── */
const MARQUEE_ITEMS = [
  '50 kg rescued in Mumbai', 'NGO FeedIndia received 200 meals',
  'Volunteer Ravi completed delivery', 'Hotel Grand donated party surplus',
  '120 meals saved from landfill today', 'New NGO partner joined in Delhi',
  'Community kitchen donated daily surplus', 'Wedding banquet surplus fed 300 families',
];
function Marquee() {
  const doubled = [...MARQUEE_ITEMS, ...MARQUEE_ITEMS];
  return (
    <div style={{ overflow:'hidden', background:'hsl(var(--primary))', padding:'0.75rem 0', borderTop:'1px solid hsl(var(--primary)/0.2)', borderBottom:'1px solid hsl(var(--primary)/0.2)' }}>
      <div className="marquee-track" style={{ display:'flex', gap:'2.5rem', whiteSpace:'nowrap' }}>
        {doubled.map((item, i) => (
          <span key={i} style={{ color:'hsl(var(--primary-fg))', fontWeight:600, fontSize:'0.875rem', display:'flex', alignItems:'center', gap:'0.75rem', flexShrink:0 }}>
            <span style={{ width:6, height:6, borderRadius:'50%', background:'hsl(var(--accent))', display:'inline-block' }} />
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ── Hero Slides ── */
const HERO_SLIDES = [
  {
    img: 'https://images.unsplash.com/photo-1593113598332-cd288d649433?auto=format&fit=crop&w=1600&q=80',
    tag: 'Zero Hunger', title: 'Rescue Food.', title2: 'Feed People.', title3: 'Save The Planet.',
    sub: 'A mission-critical platform connecting surplus food with NGOs and volunteers. Every second counts.',
  },
  {
    img: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=1600&q=80',
    tag: 'Community Impact', title: 'One Meal.', title2: 'One Life.', title3: 'Infinite Impact.',
    sub: 'From restaurants to families in need — NourishHub makes the connection happen in hours, not days.',
  },
  {
    img: 'https://images.unsplash.com/photo-1509099836639-18ba1795216d?auto=format&fit=crop&w=1600&q=80',
    tag: 'Real Stories', title: 'Food That', title2: 'Could Be Wasted', title3: 'Becomes Hope.',
    sub: 'Join thousands of donors, NGOs, and volunteers building a world with zero food waste and zero hunger.',
  },
];

function HeroSlider() {
  const [active, setActive] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setActive(p => (p + 1) % HERO_SLIDES.length), 5000);
    return () => clearInterval(t);
  }, []);
  const slide = HERO_SLIDES[active];
  return (
    <section style={{ position:'relative', minHeight:'92vh', display:'flex', alignItems:'flex-end', overflow:'hidden' }}>
      {/* Background images */}
      {HERO_SLIDES.map((s, i) => (
        <div key={i} style={{ position:'absolute', inset:0, transition:'opacity 1s', opacity: i === active ? 1 : 0 }}>
          <img src={s.img} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
          <div style={{ position:'absolute', inset:0, background:'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0.1) 100%)' }} />
          <div style={{ position:'absolute', inset:0, background:'linear-gradient(to right, rgba(0,0,0,0.4), transparent)' }} />
        </div>
      ))}

      {/* Dot nav */}
      <div style={{ position:'absolute', right:'2rem', top:'50%', transform:'translateY(-50%)', display:'flex', flexDirection:'column', gap:'0.75rem', zIndex:20 }}>
        {HERO_SLIDES.map((_, i) => (
          <button key={i} onClick={() => setActive(i)} style={{
            width:8, borderRadius:9999, border:'none', cursor:'pointer',
            height: i === active ? 32 : 8,
            background: i === active ? 'hsl(var(--accent))' : 'rgba(255,255,255,0.4)',
            transition:'all 0.3s',
          }} />
        ))}
      </div>

      {/* Content */}
      <div style={{ position:'relative', zIndex:10, maxWidth:1280, margin:'0 auto', padding:'0 1.5rem 5rem', paddingTop:'10rem', width:'100%' }}>
        <motion.div key={active} initial={{ opacity:0, y:30 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.7 }}>
          <span style={{
            display:'inline-flex', alignItems:'center', gap:'0.5rem',
            padding:'0.375rem 1rem', borderRadius:9999,
            background:'hsl(var(--accent) / 0.2)', border:'1px solid hsl(var(--accent) / 0.4)',
            color:'hsl(var(--accent))', fontWeight:700, fontSize:'0.7rem',
            letterSpacing:'0.12em', textTransform:'uppercase', marginBottom:'1.5rem',
            backdropFilter:'blur(8px)',
          }}>
            <Leaf size={12} /> {slide.tag}
          </span>
          <h1 style={{
            fontSize:'clamp(2.5rem, 7vw, 5rem)', fontWeight:900, color:'#fff',
            lineHeight:1, letterSpacing:'-0.02em', marginBottom:'1.5rem', maxWidth:700,
          }}>
            {slide.title}<br />
            <span style={{ color:'hsl(var(--accent))' }}>{slide.title2}</span><br />
            {slide.title3}
          </h1>
          <p style={{ color:'rgba(255,255,255,0.8)', fontSize:'1.1rem', maxWidth:480, marginBottom:'2.5rem', lineHeight:1.7 }}>{slide.sub}</p>
          <div style={{ display:'flex', flexWrap:'wrap', gap:'1rem' }}>
            <Link to="/register" className="btn btn-accent btn-lg" style={{ borderRadius:'1rem', fontWeight:700, fontSize:'1rem' }}>
              Join NourishHub <ArrowRight size={18} />
            </Link>
            <Link to="/donations" className="btn btn-white-outline btn-lg" style={{ borderRadius:'1rem', fontWeight:600, fontSize:'1rem' }}>
              Browse Food
            </Link>
          </div>
        </motion.div>

        {/* Mini stats strip */}
        <div style={{ display:'flex', flexWrap:'wrap', gap:'2rem', marginTop:'4rem', paddingTop:'2rem', borderTop:'1px solid rgba(255,255,255,0.15)' }}>
          {[{ label:'Meals Rescued', value:'10,000+' },{ label:'NGO Partners', value:'50+' },{ label:'Cities Active', value:'8' },{ label:'Volunteers', value:'200+' }].map((s, i) => (
            <div key={i} style={{ color:'#fff' }}>
              <p style={{ fontSize:'1.5rem', fontWeight:900, color:'hsl(var(--accent))' }}>{s.value}</p>
              <p style={{ fontSize:'0.8rem', color:'rgba(255,255,255,0.7)', fontWeight:500 }}>{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Initiatives ── */
const INITIATIVES = [
  { Icon: Leaf, name:'For Restaurants & Businesses', desc:'Post surplus food in under 2 minutes. Set expiry time, quantity, and pickup address. Our platform alerts matching NGOs instantly.', cta:'Donate Food', href:'/register', img:'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=600&q=80', badge:'For Donors', gradient:'linear-gradient(to bottom, #059669, #065f46)' },
  { Icon: Building2, name:'For NGOs & Food Banks', desc:'Browse real-time donations in your city. Request food that matches your community needs. Track every step to delivery.', cta:'Claim Food', href:'/register', img:'https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?auto=format&fit=crop&w=600&q=80', badge:'For NGOs', gradient:'linear-gradient(to bottom, #2563eb, #1e3a8a)' },
  { Icon: Truck, name:'For Volunteers', desc:'Join our delivery network. Get notified of accepted pickups near you. Update delivery status in real-time. Every trip feeds a family.', cta:'Start Delivering', href:'/register', img:'https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?auto=format&fit=crop&w=600&q=80', badge:'For Volunteers', gradient:'linear-gradient(to bottom, #7c3aed, #4c1d95)' },
];

/* ── Testimonials ── */
const STORIES = [
  { quote:"The restaurant near us used to throw away 40 kg of food every night. Now through NourishHub, that food reaches our shelter children every evening.", name:'Meena Krishnan', role:'Director, Shelter of Hope NGO, Chennai', avatar:'M', color:'#2563eb' },
  { quote:"I posted my first donation at 10 PM — leftover biryani from a wedding. By 11 PM, an NGO had claimed it and a volunteer was on the way.", name:'Arjun Mehta', role:'Restaurant Owner, Mumbai', avatar:'A', color:'#059669' },
  { quote:"Every weekend I do 3-4 pickup runs. Knowing that food is going to hungry families instead of a landfill — that keeps me coming back.", name:'Ravi Kumar', role:'Volunteer Driver, Bangalore', avatar:'R', color:'#7c3aed' },
];

/* ── Recent Drives ── */
const RECENT_DRIVES = [
  { img:'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?auto=format&fit=crop&w=400&q=80', title:'Diwali Celebration Drive', date:'Nov 12, 2025', location:'Mumbai', meals:340, desc:'A wedding venue donated 340 kg of surplus sweets and meals to 3 partnered NGOs, feeding 340 families during Diwali.' },
  { img:'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=400&q=80', title:'Restaurant Week Rescue', date:'Jan 5, 2026', location:'Delhi', meals:520, desc:'12 restaurants participated in a coordinated food rescue drive, saving 520 meals from going to waste in a single week.' },
  { img:'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=400&q=80', title:'Corporate Lunch Surplus', date:'Feb 20, 2026', location:'Bangalore', meals:180, desc:'A tech company cafeteria began daily surplus donation, channeling 180+ meals per week to local NGOs.' },
];

export default function Home() {
  const STATS = [
    { label:'Total Donations', value:2840, color:'hsl(var(--primary))', border:'hsl(var(--primary) / 0.3)' },
    { label:'Meals Served', value:18500, color:'hsl(var(--accent))', border:'hsl(var(--accent) / 0.3)' },
    { label:'NGO Partners', value:63, color:'hsl(var(--primary))', border:'hsl(var(--primary) / 0.3)' },
    { label:'Volunteers', value:312, color:'hsl(var(--accent))', border:'hsl(var(--accent) / 0.3)' },
  ];

  return (
    <div style={{ display:'flex', flexDirection:'column', minHeight:'100vh', background:'hsl(var(--background))' }}>

      {/* ── HERO ── */}
      <HeroSlider />

      {/* ── MARQUEE ── */}
      <Marquee />

      {/* ── LIVE STATS ── */}
      <section style={{ padding:'5rem 0', background:'hsl(var(--background))' }}>
        <div className="container-xl">
          <div style={{ display:'flex', flexWrap:'wrap', alignItems:'center', gap:'3rem' }}>
            <div style={{ flex:'0 0 auto', maxWidth:320 }}>
              <span style={{ fontSize:'0.7rem', fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', color:'hsl(var(--primary))', display:'block', marginBottom:'0.75rem' }}>Live Platform Data</span>
              <h2 style={{ fontSize:'clamp(1.75rem, 4vw, 2.75rem)', fontWeight:900, lineHeight:1.1, marginBottom:'1rem' }}>Real Numbers.<br />Real Impact.</h2>
              <p style={{ color:'hsl(var(--muted-fg))', fontSize:'1rem', lineHeight:1.7 }}>Every figure represents food rescued from waste and families that went to bed full tonight.</p>
              <Link to="/donations" style={{ display:'inline-flex', alignItems:'center', gap:'0.5rem', marginTop:'1.5rem', color:'hsl(var(--primary))', fontWeight:700, fontSize:'0.9rem', textDecoration:'none' }}>
                See all donations <ChevronRight size={16} />
              </Link>
            </div>
            <div style={{ flex:1, display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(160px, 1fr))', gap:'1rem' }}>
              {STATS.map((s, i) => (
                <motion.div key={i} initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} transition={{ delay: i*0.08 }}>
                  <TiltCard>
                    <div style={{ padding:'1.5rem', borderRadius:'1.5rem', border:`2px solid ${s.border}`, background:'hsl(var(--card))', boxShadow:'0 2px 8px hsl(var(--primary)/0.05)', cursor:'default', transition:'border-color 0.3s' }}>
                      <div style={{ fontSize:'clamp(2rem, 4vw, 3rem)', fontWeight:900, color:s.color, marginBottom:'0.5rem' }}>
                        <AnimatedCounter value={s.value} />
                      </div>
                      <p style={{ fontSize:'0.75rem', fontWeight:600, color:'hsl(var(--muted-fg))', textTransform:'uppercase', letterSpacing:'0.06em' }}>{s.label}</p>
                    </div>
                  </TiltCard>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── INITIATIVES ── */}
      <section style={{ padding:'5rem 0', background:'hsl(var(--muted)/0.3)', borderTop:'1px solid hsl(var(--border)/0.5)', borderBottom:'1px solid hsl(var(--border)/0.5)' }}>
        <div className="container-xl">
          <div style={{ textAlign:'center', marginBottom:'3.5rem' }}>
            <span style={{ fontSize:'0.7rem', fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', color:'hsl(var(--primary))', display:'block', marginBottom:'0.75rem' }}>Our Feeding Network</span>
            <h2 style={{ fontSize:'clamp(1.75rem, 4vw, 2.75rem)', fontWeight:900, marginBottom:'1rem' }}>How NourishHub Works</h2>
            <p style={{ color:'hsl(var(--muted-fg))', fontSize:'1rem', maxWidth:520, margin:'0 auto' }}>One platform. Three roles. One shared mission to eliminate food waste and hunger.</p>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(280px, 1fr))', gap:'2rem' }}>
            {INITIATIVES.map(({ Icon, name, desc, cta, href, img, badge, gradient }, i) => (
              <motion.div key={i} initial={{ opacity:0, y:30 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} transition={{ delay: i*0.12 }}>
                <TiltCard style={{ height:'100%' }}>
                  <div className="card" style={{ height:'100%', overflow:'hidden' }}>
                    <div style={{ position:'relative', height:192, overflow:'hidden' }}>
                      <img src={img} alt={name} style={{ width:'100%', height:'100%', objectFit:'cover', transition:'transform 0.7s' }}
                        onMouseEnter={e => e.currentTarget.style.transform='scale(1.05)'}
                        onMouseLeave={e => e.currentTarget.style.transform='scale(1)'}
                      />
                      <div style={{ position:'absolute', inset:0, background:gradient, opacity:0.6 }} />
                      <span style={{ position:'absolute', top:16, left:16, padding:'0.25rem 0.75rem', borderRadius:9999, background:'rgba(255,255,255,0.2)', backdropFilter:'blur(8px)', color:'#fff', fontSize:'0.75rem', fontWeight:700, border:'1px solid rgba(255,255,255,0.3)' }}>{badge}</span>
                      <div style={{ position:'absolute', bottom:16, left:16, width:40, height:40, borderRadius:12, background:'rgba(255,255,255,0.2)', backdropFilter:'blur(8px)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                        <Icon size={20} color="#fff" />
                      </div>
                    </div>
                    <div style={{ padding:'1.5rem' }}>
                      <h3 style={{ fontSize:'1rem', fontWeight:700, marginBottom:'0.75rem' }}>{name}</h3>
                      <p style={{ color:'hsl(var(--muted-fg))', fontSize:'0.875rem', lineHeight:1.6, marginBottom:'1.25rem' }}>{desc}</p>
                      <Link to={href} className="btn btn-outline btn-sm" style={{ gap:'0.375rem' }}>
                        {cta} <ArrowRight size={14} />
                      </Link>
                    </div>
                  </div>
                </TiltCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── RECENT DRIVES ── */}
      <section style={{ padding:'5rem 0', background:'hsl(var(--background))' }}>
        <div className="container-xl">
          <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', marginBottom:'3rem', flexWrap:'wrap', gap:'1rem' }}>
            <div>
              <span style={{ fontSize:'0.7rem', fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', color:'hsl(var(--primary))', display:'block', marginBottom:'0.75rem' }}>Community Activity</span>
              <h2 style={{ fontSize:'clamp(1.5rem, 3vw, 2.25rem)', fontWeight:900 }}>Recent Food Rescue Drives</h2>
            </div>
            <Link to="/donations" style={{ display:'flex', alignItems:'center', gap:'0.375rem', color:'hsl(var(--primary))', fontWeight:700, textDecoration:'none', fontSize:'0.9rem' }}>
              View all <ChevronRight size={16} />
            </Link>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(280px, 1fr))', gap:'2rem' }}>
            {RECENT_DRIVES.map((d, i) => (
              <motion.div key={i} initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} transition={{ delay: i*0.1 }}>
                <div className="card" style={{ overflow:'hidden' }}>
                  <div style={{ position:'relative', height:176, overflow:'hidden' }}>
                    <img src={d.img} alt={d.title} style={{ width:'100%', height:'100%', objectFit:'cover', transition:'transform 0.7s' }}
                      onMouseEnter={e => e.currentTarget.style.transform='scale(1.05)'}
                      onMouseLeave={e => e.currentTarget.style.transform='scale(1)'}
                    />
                    <div style={{ position:'absolute', top:12, right:12, padding:'0.25rem 0.75rem', borderRadius:9999, background:'hsl(var(--primary))', color:'hsl(var(--primary-fg))', fontSize:'0.75rem', fontWeight:700 }}>
                      {d.meals} meals
                    </div>
                  </div>
                  <div style={{ padding:'1.25rem' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', fontSize:'0.75rem', color:'hsl(var(--muted-fg))', fontWeight:500, marginBottom:'0.5rem' }}>
                      <span>{d.date}</span><span>·</span><span>{d.location}</span>
                    </div>
                    <h3 style={{ fontWeight:700, marginBottom:'0.5rem', fontSize:'1rem' }}>{d.title}</h3>
                    <p style={{ fontSize:'0.875rem', color:'hsl(var(--muted-fg))', lineHeight:1.6 }}>{d.desc}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── DARK PROBLEM SECTION ── */}
      <section style={{ padding:'6rem 0', background:'hsl(var(--foreground))', color:'hsl(var(--background))', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', inset:0, opacity:0.15, background:'radial-gradient(circle at 15% 50%, hsl(140 55% 25%) 0%, transparent 55%), radial-gradient(circle at 85% 50%, hsl(35 90% 50% / 0.6) 0%, transparent 55%)' }} />
        <div className="container-xl" style={{ position:'relative', zIndex:10 }}>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(280px, 1fr))', gap:'4rem', alignItems:'center' }}>
            <div>
              <span style={{ fontSize:'0.7rem', fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', color:'hsl(var(--accent))', display:'block', marginBottom:'1rem' }}>The Scale of The Problem</span>
              <h2 style={{ fontSize:'clamp(1.75rem, 4vw, 2.75rem)', fontWeight:900, marginBottom:'1.5rem', lineHeight:1.1, color:'hsl(var(--background))' }}>
                33% of all food produced<br />
                <span style={{ color:'hsl(var(--accent))' }}>is never eaten.</span>
              </h2>
              <p style={{ color:'hsl(var(--background) / 0.7)', fontSize:'1rem', lineHeight:1.75, marginBottom:'2rem' }}>
                While 828 million people go to bed hungry every night, 1.3 billion tonnes of food is wasted each year globally. NourishHub exists to bridge that impossible gap — one donation at a time.
              </p>
              <Link to="/register" className="btn btn-accent btn-lg" style={{ borderRadius:'1rem', fontWeight:700, boxShadow:'0 0 30px hsl(var(--accent)/0.4)' }}>
                Be Part of the Solution
              </Link>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem' }}>
              {[
                { fig:'1.3B', label:'Tonnes of food wasted yearly', border:'hsl(var(--accent)/0.3)' },
                { fig:'828M', label:'People go hungry every night', border:'hsl(var(--primary)/0.3)' },
                { fig:'33%',  label:'Food produced is never eaten', border:'hsl(var(--accent)/0.3)' },
                { fig:'₹92K Cr', label:'Food wasted in India annually', border:'hsl(var(--primary)/0.3)' },
              ].map(({ fig, label, border }, i) => (
                <motion.div key={i} initial={{ opacity:0, scale:0.9 }} whileInView={{ opacity:1, scale:1 }} viewport={{ once:true }} transition={{ delay: i*0.1, type:'spring' }}
                  style={{ padding:'1.5rem', borderRadius:'1.5rem', border:`1px solid ${border}`, background:'rgba(255,255,255,0.05)', backdropFilter:'blur(8px)' }}>
                  <p style={{ fontSize:'2rem', fontWeight:900, color:'hsl(var(--accent))', marginBottom:'0.5rem' }}>{fig}</p>
                  <p style={{ color:'hsl(var(--background)/0.7)', fontSize:'0.875rem', fontWeight:500, lineHeight:1.4 }}>{label}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── STORIES ── */}
      <section style={{ padding:'6rem 0', background:'hsl(var(--background))' }}>
        <div className="container-xl">
          <div style={{ textAlign:'center', marginBottom:'3.5rem' }}>
            <span style={{ fontSize:'0.7rem', fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', color:'hsl(var(--primary))', display:'block', marginBottom:'0.75rem' }}>Real Impact</span>
            <h2 style={{ fontSize:'clamp(1.75rem, 4vw, 2.75rem)', fontWeight:900, marginBottom:'1rem' }}>Stories From Our Community</h2>
            <p style={{ color:'hsl(var(--muted-fg))' }}>The people behind every rescued meal.</p>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(280px, 1fr))', gap:'2rem' }}>
            {STORIES.map((s, i) => (
              <motion.div key={i} initial={{ opacity:0, y:30 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} transition={{ delay: i*0.12 }}>
                <TiltCard style={{ height:'100%' }}>
                  <div className="card" style={{ height:'100%', padding:'2rem', position:'relative', overflow:'hidden' }}>
                    <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:'linear-gradient(to right, hsl(var(--primary)), hsl(var(--accent)))', opacity:0, transition:'opacity 0.5s' }}
                      onMouseEnter={e => e.currentTarget.style.opacity='1'}
                      onMouseLeave={e => e.currentTarget.style.opacity='0'}
                    />
                    <Quote size={32} style={{ color:'hsl(var(--primary)/0.2)', marginBottom:'1rem' }} />
                    <p style={{ fontSize:'0.9rem', lineHeight:1.75, fontStyle:'italic', marginBottom:'1.5rem', color:'hsl(var(--foreground)/0.9)' }}>"{s.quote}"</p>
                    <div style={{ display:'flex', alignItems:'center', gap:'0.75rem', paddingTop:'1rem', borderTop:'1px solid hsl(var(--border)/0.5)' }}>
                      <div style={{ width:40, height:40, borderRadius:'50%', background:s.color, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:700, fontSize:'0.875rem', flexShrink:0 }}>{s.avatar}</div>
                      <div>
                        <p style={{ fontWeight:700, fontSize:'0.875rem' }}>{s.name}</p>
                        <p style={{ fontSize:'0.75rem', color:'hsl(var(--muted-fg))' }}>{s.role}</p>
                      </div>
                    </div>
                  </div>
                </TiltCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ position:'relative', padding:'7rem 0', overflow:'hidden' }}>
        <div style={{ position:'absolute', inset:0 }}>
          <img src="https://images.unsplash.com/photo-1459183885421-5cc683b8dbba?auto=format&fit=crop&w=1600&q=80" alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
          <div style={{ position:'absolute', inset:0, background:'hsl(var(--primary)/0.85)', backdropFilter:'blur(4px)' }} />
        </div>
        <div className="container-xl" style={{ position:'relative', zIndex:10, textAlign:'center', maxWidth:800 }}>
          <motion.div initial={{ opacity:0, scale:0.95 }} whileInView={{ opacity:1, scale:1 }} viewport={{ once:true }} transition={{ type:'spring', bounce:0.2 }}>
            <Heart size={56} color="hsl(var(--accent))" fill="hsl(var(--accent))" style={{ margin:'0 auto 1.5rem' }} />
            <h2 style={{ fontSize:'clamp(2rem, 5vw, 3.5rem)', fontWeight:900, color:'#fff', marginBottom:'1.5rem' }}>Ready to Make an Impact?</h2>
            <p style={{ color:'rgba(255,255,255,0.8)', fontSize:'1.125rem', marginBottom:'2.5rem', maxWidth:480, margin:'0 auto 2.5rem', lineHeight:1.7 }}>
              Join thousands of donors, NGOs, and volunteers eliminating food waste and hunger — one meal at a time.
            </p>
            <div style={{ display:'flex', flexWrap:'wrap', justifyContent:'center', gap:'1.25rem' }}>
              <Link to="/register" className="btn btn-accent btn-xl" style={{ fontWeight:700, boxShadow:'0 0 40px hsl(var(--accent)/0.5)' }}>
                Create Free Account <ArrowRight size={20} />
              </Link>
              <Link to="/login" className="btn btn-white-outline btn-xl" style={{ fontWeight:600 }}>
                Log In
              </Link>
            </div>
            <p style={{ marginTop:'2rem', color:'rgba(255,255,255,0.6)', fontSize:'0.875rem' }}>Free to join. No credit card required.</p>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
