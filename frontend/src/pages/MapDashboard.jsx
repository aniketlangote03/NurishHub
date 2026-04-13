import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Sun, Moon, Navigation2, Utensils, Heart, Truck, Building2,
  Activity, Package, CheckCircle2, Zap, X,
  ChevronRight, Radio, AlertCircle, Clock, ArrowUpRight, Bell
} from 'lucide-react';
import { socketService } from '../services/socket';
import { useAuth } from '../hooks/useAuth';

// ─── Fix Leaflet default icon in Vite ─────────────────────
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl:       'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl:     'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// ─── Custom SVG pin icons ──────────────────────────────────
const createSVGIcon = (emoji, color, size = 44) =>
  L.divIcon({
    html: `
      <div style="
        width:${size}px; height:${size}px;
        background:${color};
        border-radius:50% 50% 50% 0;
        transform:rotate(-45deg);
        border:3px solid white;
        box-shadow:0 4px 16px ${color}88;
        display:flex; align-items:center; justify-content:center;
      ">
        <span style="transform:rotate(45deg); font-size:${size * 0.4}px; line-height:1;">${emoji}</span>
      </div>
      <div style="
        width:${size * 0.4}px; height:${size * 0.2}px;
        background:rgba(0,0,0,0.2); border-radius:50%;
        margin:2px auto 0; filter:blur(2px);
      "></div>
    `,
    className: '',
    iconSize:    [size, size + 8],
    iconAnchor:  [size / 2, size + 8],
    popupAnchor: [0, -(size + 8)],
  });

const DONOR_ICON     = createSVGIcon('🍱', '#10b981');
const VOLUNTEER_ICON = createSVGIcon('🚴', '#8b5cf6');
const NGO_ICON       = createSVGIcon('🏢', '#3b82f6');
const LIVE_ICON      = createSVGIcon('📍', '#f59e0b', 40);

// ─── CARTO tile layers ─────────────────────────────────────
const TILES = {
  light: {
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
  },
  dark: {
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
  },
};

// ─── Mock data (Mumbai) ────────────────────────────────────
const MUMBAI_CENTER = [19.076, 72.8777];

const DONORS = [
  { id: 'd1', name: 'Amit Bakery',      address: 'Andheri West', lat: 19.1363, lng: 72.8296, food: 'Fresh Bread & Pastries', qty: '25 kg',       status: 'available', time: '45 min ago' },
  { id: 'd2', name: 'Hotel Residency',  address: 'Bandra',       lat: 19.0596, lng: 72.8295, food: 'Cooked Rice & Dal',     qty: '40 servings',  status: 'available', time: '2 hrs ago' },
  { id: 'd3', name: 'Spice Garden',     address: 'Juhu',         lat: 19.1075, lng: 72.8263, food: 'Vegetable Curry',      qty: '30 servings',  status: 'requested', time: '1 hr ago' },
  { id: 'd4', name: 'Fresh Farms Co.',  address: 'Dadar',        lat: 19.0219, lng: 72.8454, food: 'Mixed Vegetables',     qty: '15 kg',        status: 'available', time: '20 min ago' },
];

const NGOS = [
  { id: 'n1', name: 'Food For All',   address: 'Dharavi', lat: 19.0401, lng: 72.8566, beneficiaries: 120, status: 'active' },
  { id: 'n2', name: 'Hope Foundation',address: 'Malad',   lat: 19.1872, lng: 72.8484, beneficiaries: 85,  status: 'active' },
  { id: 'n3', name: 'Nourish India',  address: 'Worli',   lat: 19.0176, lng: 72.8162, beneficiaries: 200, status: 'verified' },
];

const VOLUNTEERS = [
  { id: 'v1', name: 'Priya Sharma', area: 'Andheri', lat: 19.1185, lng: 72.8468, deliveries: 12, status: 'available' },
  { id: 'v2', name: 'Rohan Mehta',  area: 'Bandra',  lat: 19.0548, lng: 72.8402, deliveries: 8,  status: 'on-route' },
  { id: 'v3', name: 'Kavya Nair',   area: 'Dadar',   lat: 19.0178, lng: 72.8478, deliveries: 20, status: 'available' },
];

// Fallback route (used until OSRM responds)
const ROUTE_WAYPOINTS = [
  [19.1363, 72.8296],
  [19.1420, 72.8350],
  [19.1870, 72.8480],
  [19.1872, 72.8484],
];

// ─── AnimatedMarker ────────────────────────────────────────
function AnimatedMarker({ position }) {
  const markerRef = useRef(null);
  useEffect(() => {
    markerRef.current?.setLatLng(position);
  }, [position]);
  return <Marker ref={markerRef} position={position} icon={LIVE_ICON} />;
}

// ─── Stat card ─────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, color, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="map-stat-card"
      style={{ borderLeft: `3px solid ${color}` }}
    >
      <div className="map-stat-icon" style={{ background: color + '22' }}>
        <Icon size={16} color={color} />
      </div>
      <div>
        <p className="map-stat-value">{value}</p>
        <p className="map-stat-label">{label}</p>
      </div>
    </motion.div>
  );
}

// ─── Panel item ────────────────────────────────────────────
function PanelItem({ title, sub, badge, badgeColor, icon: Icon, iconBg, onClick }) {
  return (
    <motion.div
      whileHover={{ x: 3 }}
      className="map-panel-item"
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      <div style={{ width: 38, height: 38, borderRadius: 12, background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon size={17} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontWeight: 600, fontSize: '0.825rem', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</p>
        <p style={{ fontSize: '0.72rem', color: 'var(--map-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sub}</p>
      </div>
      {badge && (
        <span style={{ fontSize: '0.65rem', fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: badgeColor + '22', color: badgeColor, border: `1px solid ${badgeColor}44`, whiteSpace: 'nowrap', flexShrink: 0 }}>
          {badge}
        </span>
      )}
    </motion.div>
  );
}

// ─── Main Component ────────────────────────────────────────
export default function MapDashboard() {
  const { user } = useAuth();
  const [isDark, setIsDark]           = useState(false);
  const [activePanel, setActivePanel] = useState('overview');
  const [routeLine, setRouteLine]     = useState(ROUTE_WAYPOINTS);
  const [livePos, setLivePos]         = useState(ROUTE_WAYPOINTS[0]);
  const [targetPos, setTargetPos]     = useState(ROUTE_WAYPOINTS[0]);
  const [routeIdx, setRouteIdx]       = useState(0);
  const [liveTracking, setLiveTracking] = useState(true);
  const [selected, setSelected]       = useState(null);
  const [panelOpen, setPanelOpen]     = useState(true);
  // Multi-volunteer live positions: { [volunteerId]: { name, lat, lng, ts } }
  const [volunteerPositions, setVolunteerPositions] = useState({});
  // Latest pickup status update
  const [liveStatus, setLiveStatus]   = useState(null);
  const intervalRef   = useRef(null);
  const simulationRef = useRef(null);
  const targetPosRef  = useRef(ROUTE_WAYPOINTS[0]);
  const livePosRef    = useRef(ROUTE_WAYPOINTS[0]);

  // ── 0. Fetch real route via OSRM on mount ──────────────────
  useEffect(() => {
    const donor = '72.8296,19.1363';
    const ngo   = '72.8484,19.1872';
    fetch(`https://router.project-osrm.org/route/v1/driving/${donor};${ngo}?overview=full&geometries=geojson`)
      .then(r => r.json())
      .then(data => {
        if (data.routes?.[0]) {
          const coords = data.routes[0].geometry.coordinates.map(c => [c[1], c[0]]);
          setRouteLine(coords);
          setLivePos(coords[0]);
          setTargetPos(coords[0]);
        }
      })
      .catch(() => {/* keep fallback waypoints */});
  }, []);

  // ── 1. If Volunteer: broadcast real GPS via Socket.io ──────
  useEffect(() => {
    if (!liveTracking || user?.role !== 'volunteer') return;
    if (!('geolocation' in navigator)) return;

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        socketService.emit('volunteer:location', {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
      },
      (err) => console.error('GPS error', err),
      { enableHighAccuracy: true }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [liveTracking, user]);

  // ── 2. Listen for volunteer:location (all roles) ──────
  useEffect(() => {
    if (!liveTracking) return;

    const handleLocation = (data) => {
      if (!data?.lat || !data?.lng) return;

      // Update the multi-volunteer map
      setVolunteerPositions(prev => ({
        ...prev,
        [data.volunteerId]: {
          name: data.name || 'Volunteer',
          lat : data.lat,
          lng : data.lng,
          ts  : data.ts || Date.now(),
        },
      }));

      // Also drive the single animated marker for the route progress bar
      let nearestIdx = 0, minDist = Infinity;
      routeLine.forEach((wp, idx) => {
        const d = Math.pow(wp[0] - data.lat, 2) + Math.pow(wp[1] - data.lng, 2);
        if (d < minDist) { minDist = d; nearestIdx = idx; }
      });
      setRouteIdx(nearestIdx);
      targetPosRef.current = [data.lat, data.lng];
      setTargetPos([data.lat, data.lng]);
    };

    socketService.on('volunteer:location', handleLocation);
    return () => socketService.off('volunteer:location', handleLocation);
  }, [liveTracking, routeLine]);

  // ── 3. Listen for pickup:status-update ─────────────────
  useEffect(() => {
    const handleStatus = (data) => {
      setLiveStatus(data);
      // Auto-clear after 12 s
      setTimeout(() => setLiveStatus(null), 12000);
    };
    socketService.on('pickup:status-update', handleStatus);
    return () => socketService.off('pickup:status-update', handleStatus);
  }, []);

  // ── 4. Smooth Uber-like marker interpolation ───────────────
  useEffect(() => {
    if (!liveTracking) return;

    const steps = 20;
    let count   = 0;
    const latStep = (targetPos[0] - livePos[0]) / steps;
    const lngStep = (targetPos[1] - livePos[1]) / steps;

    if (Math.abs(latStep) < 0.000001 && Math.abs(lngStep) < 0.000001) return;

    clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setLivePos(prev => [prev[0] + latStep, prev[1] + lngStep]);
      count++;
      if (count >= steps) {
        clearInterval(intervalRef.current);
        setLivePos(targetPos);
      }
    }, 50);

    return () => clearInterval(intervalRef.current);
  }, [targetPos, liveTracking]);

  // ── 5. Demo simulation (non-volunteers see marker move) ────
  useEffect(() => {
    if (!liveTracking || user?.role === 'volunteer') return;
    if (routeLine.length < 2) return;

    let step = 0;
    const STEPS = 80;

    simulationRef.current = setInterval(() => {
      step++;
      const segIdx  = Math.min(Math.floor((step / STEPS) * (routeLine.length - 1)), routeLine.length - 2);
      const t       = ((step / STEPS) * (routeLine.length - 1)) - segIdx;
      const from    = routeLine[segIdx];
      const to      = routeLine[segIdx + 1];
      const lat     = from[0] + (to[0] - from[0]) * t;
      const lng     = from[1] + (to[1] - from[1]) * t;
      setTargetPos([lat, lng]);
      if (step >= STEPS) step = 0;
    }, 1500);

    return () => clearInterval(simulationRef.current);
  }, [liveTracking, user, routeLine]);


  const tileConfig = isDark ? TILES.dark : TILES.light;

  const panels = [
    { id: 'overview',   label: 'Overview',   icon: Activity  },
    { id: 'donors',     label: 'Donors',     icon: Utensils  },
    { id: 'volunteers', label: 'Volunteers', icon: Truck     },
    { id: 'ngos',       label: 'NGOs',       icon: Building2 },
  ];

  return (
    <div className={`map-dashboard-root${isDark ? ' dark' : ''}`}>

      {/* ── Top bar ───────────────────────────────── */}
      <div className="map-topbar">
        <div className="map-topbar-left">
          <div className="map-topbar-logo"><Heart size={14} fill="currentColor" /></div>
          <span className="map-topbar-title">NourishHub Live Map</span>
          <span className="map-live-badge">
            <span className="map-live-dot" />
            LIVE
          </span>
        </div>

        <div className="map-topbar-right">
          <div className="map-tab-group">
            {panels.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                className={`map-tab${activePanel === id ? ' active' : ''}`}
                onClick={() => { setActivePanel(id); setPanelOpen(true); }}
              >
                <Icon size={13} />
                <span className="map-tab-label">{label}</span>
              </button>
            ))}
          </div>

          <button
            className={`map-track-btn${liveTracking ? ' active' : ''}`}
            onClick={() => setLiveTracking(v => !v)}
            title="Toggle live tracking"
          >
            <Navigation2 size={14} />
            <span>Track</span>
          </button>

          <button
            className="map-theme-btn"
            onClick={() => setIsDark(v => !v)}
            title={isDark ? 'Switch to day mode' : 'Switch to night mode'}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={isDark ? 'moon' : 'sun'}
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0,   opacity: 1 }}
                exit={{ rotate: 90,    opacity: 0 }}
                transition={{ duration: 0.25 }}
              >
                {isDark ? <Sun size={16} /> : <Moon size={16} />}
              </motion.div>
            </AnimatePresence>
          </button>
        </div>
      </div>

      {/* ── Map ─────────────────────────────────── */}
      <div className="map-wrapper">
        <MapContainer center={MUMBAI_CENTER} zoom={12} style={{ width: '100%', height: '100%' }} zoomControl={false}>
          <TileLayer key={isDark ? 'dark' : 'light'} url={tileConfig.url} attribution={tileConfig.attribution} maxZoom={19} />

          {DONORS.map(d => (
            <Marker key={d.id} position={[d.lat, d.lng]} icon={DONOR_ICON}
              eventHandlers={{ click: () => setSelected({ type: 'donor', data: d }) }}>
              <Popup className="map-popup">
                <strong>🍱 {d.name}</strong><br />
                <span>{d.food} • {d.qty}</span><br />
                <span style={{ color: '#10b981', fontWeight: 700 }}>{d.status}</span>
              </Popup>
            </Marker>
          ))}

          {NGOS.map(n => (
            <Marker key={n.id} position={[n.lat, n.lng]} icon={NGO_ICON}
              eventHandlers={{ click: () => setSelected({ type: 'ngo', data: n }) }}>
              <Popup className="map-popup">
                <strong>🏢 {n.name}</strong><br />
                <span>{n.beneficiaries} beneficiaries</span><br />
                <span style={{ color: '#3b82f6', fontWeight: 700 }}>{n.status}</span>
              </Popup>
            </Marker>
          ))}

          {VOLUNTEERS.map(v => (
            <Marker key={v.id} position={[v.lat, v.lng]} icon={VOLUNTEER_ICON}
              eventHandlers={{ click: () => setSelected({ type: 'volunteer', data: v }) }}>
              <Popup className="map-popup">
                <strong>🚴 {v.name}</strong><br />
                <span>Area: {v.area}</span><br />
                <span style={{ color: v.status === 'on-route' ? '#f59e0b' : '#8b5cf6', fontWeight: 700 }}>
                  {v.status}
                </span>
              </Popup>
            </Marker>
          ))}

          {/* Real multi-volunteer live markers from socket */}
          {Object.entries(volunteerPositions).map(([vid, vdata]) => (
            <Marker key={vid} position={[vdata.lat, vdata.lng]} icon={LIVE_ICON}>
              <Popup className="map-popup">
                <strong>📍 {vdata.name}</strong><br />
                <span style={{ fontSize: '0.72rem', color: '#888' }}>
                  Live • {new Date(vdata.ts).toLocaleTimeString()}
                </span>
              </Popup>
            </Marker>
          ))}

          {liveTracking && (
            <>
              <Polyline positions={routeLine} pathOptions={{ color: '#f59e0b', weight: 3, dashArray: '8 6', opacity: 0.7 }} />
              <AnimatedMarker position={livePos} />
            </>
          )}
        </MapContainer>

        {/* ── Left floating stats ── */}
        <div className="map-stats-overlay">
          <StatCard icon={Package}      label="Active Donations" value={DONORS.length}     color="#10b981" delay={0.0} />
          <StatCard icon={Building2}    label="NGO Partners"     value={NGOS.length}       color="#3b82f6" delay={0.1} />
          <StatCard icon={Truck}        label="Volunteers"       value={VOLUNTEERS.length} color="#8b5cf6" delay={0.2} />
          <StatCard icon={CheckCircle2} label="Meals Today"      value="247"               color="#f59e0b" delay={0.3} />
        </div>

        {/* ── Right side panel ── */}
        <AnimatePresence>
          {panelOpen && (
            <motion.div
              className="map-side-panel"
              initial={{ x: 340, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 340, opacity: 0 }}
              transition={{ type: 'spring', damping: 26, stiffness: 300 }}
            >
              <div className="map-panel-header">
                <div>
                  <p className="map-panel-subtitle">NourishHub</p>
                  <h2 className="map-panel-title">
                    {activePanel === 'overview'   && '🗺️ Live Overview'}
                    {activePanel === 'donors'     && '🍱 Food Donors'}
                    {activePanel === 'volunteers' && '🚴 Volunteers'}
                    {activePanel === 'ngos'       && '🏢 NGO Partners'}
                  </h2>
                </div>
                <button className="map-panel-close" onClick={() => setPanelOpen(false)}>
                  <X size={16} />
                </button>
              </div>

              <div className="map-panel-body">

                {/* Overview */}
                {activePanel === 'overview' && (
                  <div className="map-panel-section">
                    {/* Live pickup status update toast card */}
                    <AnimatePresence>
                      {liveStatus && (
                        <motion.div
                          key={liveStatus.ts}
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          style={{
                            background: 'linear-gradient(135deg,#f59e0b22,#f59e0b0a)',
                            border: '1px solid #f59e0b55',
                            borderRadius: 12,
                            padding: '10px 12px',
                            marginBottom: 12,
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: 10,
                          }}
                        >
                          <Bell size={14} color="#f59e0b" style={{ flexShrink: 0, marginTop: 2 }} />
                          <div style={{ flex: 1 }}>
                            <p style={{ fontWeight: 700, fontSize: '0.78rem', color: '#f59e0b' }}>
                              {liveStatus.label}
                            </p>
                            <p style={{ fontSize: '0.7rem', marginTop: 2, opacity: 0.85 }}>
                              {liveStatus.volunteerName} updated a delivery
                            </p>
                          </div>
                          <button
                            onClick={() => setLiveStatus(null)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#f59e0b', padding: 0, lineHeight: 1, marginTop: 1 }}
                          >
                            <X size={12} />
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {liveTracking && (
                      <motion.div className="map-live-card" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                        <div className="map-live-card-header">
                          <Radio size={14} className="map-pulse-icon" />
                          <span>Live Delivery in Progress</span>
                        </div>
                        <p style={{ fontSize: '0.78rem', marginTop: 4, opacity: 0.85 }}>
                          Rohan Mehta → Hope Foundation<br />
                          <strong>Fresh Bread & Pastries • 25 kg</strong>
                        </p>
                        <div className="map-live-progress-bar">
                          <motion.div
                            className="map-live-progress-fill"
                            animate={{ width: `${(routeIdx / Math.max(1, routeLine.length - 1)) * 100}%` }}
                            transition={{ duration: 0.5 }}
                          />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', marginTop: 4, opacity: 0.75 }}>
                          <span>Andheri West</span>
                          <span>Malad</span>
                        </div>
                      </motion.div>
                    )}

                    <div className="map-summary-grid">
                      {[
                        { label: 'Donations Posted', value: 28,  icon: Package,      color: '#10b981' },
                        { label: 'Requests Today',   value: 14,  icon: AlertCircle,  color: '#3b82f6' },
                        { label: 'Deliveries Done',  value: 9,   icon: CheckCircle2, color: '#8b5cf6' },
                        { label: 'Pending Pickups',  value: 5,   icon: Clock,        color: '#f59e0b' },
                      ].map(({ label, value, icon: Icon, color }) => (
                        <div key={label} className="map-summary-card" style={{ borderTop: `2px solid ${color}` }}>
                          <Icon size={18} color={color} />
                          <p className="map-summary-value" style={{ color }}>{value}</p>
                          <p className="map-summary-label">{label}</p>
                        </div>
                      ))}
                    </div>

                    <div className="map-section-title">Recent Activity</div>
                    {[
                      { text: 'Hotel Residency posted 40 servings',       time: '2m ago',  color: '#10b981' },
                      { text: 'Kavya Nair picked up delivery #47',         time: '15m ago', color: '#8b5cf6' },
                      { text: 'Hope Foundation received 25 kg bread',      time: '45m ago', color: '#3b82f6' },
                      { text: 'New volunteer Priya joined Andheri zone',   time: '1h ago',  color: '#f59e0b' },
                    ].map((item, i) => (
                      <div key={i} className="map-activity-item">
                        <div className="map-activity-dot" style={{ background: item.color }} />
                        <div style={{ flex: 1 }}>
                          <p style={{ fontSize: '0.78rem', fontWeight: 500 }}>{item.text}</p>
                          <p style={{ fontSize: '0.68rem', color: 'var(--map-muted)' }}>{item.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Donors */}
                {activePanel === 'donors' && (
                  <div className="map-panel-section">
                    <div className="map-section-title">Available Food Donations</div>
                    {DONORS.map(d => (
                      <PanelItem key={d.id} title={d.name}
                        sub={`${d.food} • ${d.qty} • ${d.address}`}
                        badge={d.status}
                        badgeColor={d.status === 'available' ? '#10b981' : '#f59e0b'}
                        icon={Utensils} iconBg="#dcfce7"
                        onClick={() => setSelected({ type: 'donor', data: d })}
                      />
                    ))}
                    <button className="map-cta-btn" style={{ background: 'linear-gradient(135deg,#10b981,#047857)' }}>
                      <Utensils size={15} /> Post New Donation
                    </button>
                  </div>
                )}

                {/* Volunteers */}
                {activePanel === 'volunteers' && (
                  <div className="map-panel-section">
                    <div className="map-section-title">Active Volunteers</div>
                    {VOLUNTEERS.map(v => (
                      <PanelItem key={v.id} title={v.name}
                        sub={`${v.area} • ${v.deliveries} deliveries`}
                        badge={v.status === 'on-route' ? '🚴 On Route' : '✅ Available'}
                        badgeColor={v.status === 'on-route' ? '#f59e0b' : '#8b5cf6'}
                        icon={Truck} iconBg="#f3e8ff"
                        onClick={() => setSelected({ type: 'volunteer', data: v })}
                      />
                    ))}
                    <div className="map-section-title" style={{ marginTop: 16 }}>Performance</div>
                    {VOLUNTEERS.map(v => (
                      <div key={v.id} className="map-progress-row">
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, flex: 1 }}>{v.name.split(' ')[0]}</span>
                        <div className="map-progress-track">
                          <motion.div
                            className="map-progress-bar-fill"
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min((v.deliveries / 25) * 100, 100)}%` }}
                            transition={{ duration: 0.8, delay: 0.2 }}
                            style={{ background: 'linear-gradient(90deg, #8b5cf6, #c084fc)' }}
                          />
                        </div>
                        <span style={{ fontSize: '0.7rem', color: 'var(--map-muted)', width: 28, textAlign: 'right' }}>{v.deliveries}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* NGOs */}
                {activePanel === 'ngos' && (
                  <div className="map-panel-section">
                    <div className="map-section-title">NGO Partners</div>
                    {NGOS.map(n => (
                      <PanelItem key={n.id} title={n.name}
                        sub={`${n.address} • ${n.beneficiaries} beneficiaries`}
                        badge={n.status === 'verified' ? '✓ Verified' : '● Active'}
                        badgeColor={n.status === 'verified' ? '#3b82f6' : '#10b981'}
                        icon={Building2} iconBg="#dbeafe"
                        onClick={() => setSelected({ type: 'ngo', data: n })}
                      />
                    ))}
                    <div className="map-section-title" style={{ marginTop: 16 }}>Beneficiaries Reached</div>
                    {NGOS.map(n => (
                      <div key={n.id} className="map-progress-row">
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, flex: 1 }}>{n.name.split(' ')[0]}</span>
                        <div className="map-progress-track">
                          <motion.div
                            className="map-progress-bar-fill"
                            initial={{ width: 0 }}
                            animate={{ width: `${(n.beneficiaries / 250) * 100}%` }}
                            transition={{ duration: 0.8, delay: 0.2 }}
                            style={{ background: 'linear-gradient(90deg,#3b82f6,#60a5fa)' }}
                          />
                        </div>
                        <span style={{ fontSize: '0.7rem', color: 'var(--map-muted)', width: 28, textAlign: 'right' }}>{n.beneficiaries}</span>
                      </div>
                    ))}
                    <button className="map-cta-btn" style={{ background: 'linear-gradient(135deg,#3b82f6,#1d4ed8)', marginTop: 12 }}>
                      <Building2 size={15} /> Register Your NGO
                    </button>
                  </div>
                )}

              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Re-open panel button */}
        {!panelOpen && (
          <motion.button
            className="map-panel-reopen"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={() => setPanelOpen(true)}
          >
            <ChevronRight size={18} />
          </motion.button>
        )}

        {/* Selected detail popup */}
        <AnimatePresence>
          {selected && (
            <motion.div
              className="map-detail-card"
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0,  scale: 1 }}
              exit={{ opacity: 0,    y: 20, scale: 0.95 }}
              transition={{ type: 'spring', damping: 24, stiffness: 280 }}
            >
              <button className="map-detail-close" onClick={() => setSelected(null)}>
                <X size={14} />
              </button>

              {selected.type === 'donor' && (
                <>
                  <div className="map-detail-emoji">🍱</div>
                  <h3 className="map-detail-name">{selected.data.name}</h3>
                  <p className="map-detail-sub">{selected.data.address}</p>
                  <div className="map-detail-info">
                    <span>{selected.data.food}</span>
                    <span className="map-detail-qty">{selected.data.qty}</span>
                  </div>
                  <span className="map-detail-status" style={{ background: '#dcfce7', color: '#166534' }}>{selected.data.status}</span>
                  <button className="map-detail-btn" style={{ background: '#10b981', color: '#fff' }}>
                    <Zap size={13} /> Request This Donation
                  </button>
                </>
              )}

              {selected.type === 'volunteer' && (
                <>
                  <div className="map-detail-emoji">🚴</div>
                  <h3 className="map-detail-name">{selected.data.name}</h3>
                  <p className="map-detail-sub">Area: {selected.data.area}</p>
                  <div className="map-detail-info">
                    <span>Deliveries</span>
                    <span className="map-detail-qty">{selected.data.deliveries} completed</span>
                  </div>
                  <span className="map-detail-status" style={{ background: selected.data.status === 'on-route' ? '#fef3c7' : '#f3e8ff', color: selected.data.status === 'on-route' ? '#92400e' : '#5b21b6' }}>
                    {selected.data.status}
                  </span>
                  <button className="map-detail-btn" style={{ background: '#8b5cf6', color: '#fff' }}>
                    <Navigation2 size={13} /> Assign Pickup
                  </button>
                </>
              )}

              {selected.type === 'ngo' && (
                <>
                  <div className="map-detail-emoji">🏢</div>
                  <h3 className="map-detail-name">{selected.data.name}</h3>
                  <p className="map-detail-sub">{selected.data.address}</p>
                  <div className="map-detail-info">
                    <span>Beneficiaries</span>
                    <span className="map-detail-qty">{selected.data.beneficiaries} people</span>
                  </div>
                  <span className="map-detail-status" style={{ background: '#dbeafe', color: '#1e40af' }}>{selected.data.status}</span>
                  <button className="map-detail-btn" style={{ background: '#3b82f6', color: '#fff' }}>
                    <ArrowUpRight size={13} /> Send Food Request
                  </button>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Legend */}
        <div className="map-legend">
          <p className="map-legend-title">Map Legend</p>
          {[
            { emoji: '🍱', label: 'Donor',      color: '#10b981' },
            { emoji: '🚴', label: 'Volunteer',  color: '#8b5cf6' },
            { emoji: '🏢', label: 'NGO',        color: '#3b82f6' },
            { emoji: '📍', label: 'Live Track', color: '#f59e0b' },
          ].map(({ emoji, label, color }) => (
            <div key={label} className="map-legend-item">
              <span>{emoji}</span>
              <span style={{ color, fontWeight: 600 }}>{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
