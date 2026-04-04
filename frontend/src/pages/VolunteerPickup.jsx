import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { pickupsAPI } from '../services/api';
import { Truck, MapPin, Navigation, Clock, CheckCircle, X } from 'lucide-react';
import RouteMap from '../components/ui/RouteMap';
import { PICKUP_NEXT_STATUS, PICKUP_STEP_LABELS } from '../utils/pickupFlow';

const STATUS_BADGE = {
  assigned: 'badge-pending',
  accepted: 'badge-approved',
  en_route_pickup: 'badge-in-transit',
  picked_up: 'badge-in-transit',
  en_route_delivery: 'badge-in-transit',
  delivered: 'badge-completed',
  cancelled: 'badge-cancelled',
  failed: 'badge-cancelled',
};

export default function VolunteerPickup() {
  const [pickups, setPickups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [actionLoading, setActionLoading] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await pickupsAPI.getAll();
      const list = res?.success ? res.data?.pickups || [] : [];
      setPickups(list);
      setSelected((prev) => {
        if (prev && list.some((p) => p._id === prev._id)) {
          return list.find((p) => p._id === prev._id) || list[0] || null;
        }
        return list[0] || null;
      });
    } catch {
      setPickups([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const advance = async (pickupId, nextStatus) => {
    setActionLoading(pickupId + nextStatus);
    try {
      const res = await pickupsAPI.updateStatus(pickupId, nextStatus);
      if (res?.success) await load();
    } catch (e) {
      console.error(e);
      alert(typeof e === 'string' ? e : 'Update failed');
    } finally {
      setActionLoading('');
    }
  };

  const cancelTask = async (pickupId) => {
    if (!window.confirm('Cancel this pickup task?')) return;
    setActionLoading(pickupId + 'cancel');
    try {
      const res = await pickupsAPI.updateStatus(pickupId, 'cancelled');
      if (res?.success) await load();
    } catch (e) {
      alert(typeof e === 'string' ? e : 'Cancel failed');
    } finally {
      setActionLoading('');
    }
  };

  const fmtTime = (ts) =>
    ts ? new Date(ts).toLocaleString('en-IN', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : '—';

  const donorCoords = selected?.donationId?.location?.coordinates;
  const ngoCoords = selected?.ngoId?.location?.coordinates;

  return (
    <div style={{ minHeight: '100vh', background: 'hsl(var(--background))' }}>
      <div style={{ background: 'hsl(var(--muted)/0.3)', borderBottom: '1px solid hsl(var(--border)/0.5)', padding: '2rem 0' }}>
        <div className="container-xl">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: 48, height: 48, borderRadius: 16, background: '#f5f3ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Truck size={24} style={{ color: '#7c3aed' }} />
            </div>
            <div>
              <h1 style={{ fontSize: 'clamp(1.5rem, 4vw, 2rem)', fontWeight: 900 }}>My pickup tasks</h1>
              <p style={{ color: 'hsl(var(--muted-fg))' }}>
                Admin assigns you after an NGO accepts a donation. Advance steps until <strong>delivered</strong>.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container-xl" style={{ padding: '2rem 1.5rem' }}>
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            {[1, 2, 3].map((i) => (
              <div key={i} className="card animate-pulse" style={{ height: 160 }} />
            ))}
          </div>
        ) : !pickups.length ? (
          <div style={{ textAlign: 'center', padding: '5rem 1rem', background: 'hsl(var(--card))', borderRadius: '1.5rem', border: '2px dashed hsl(var(--border))' }}>
            <Truck size={48} style={{ color: 'hsl(var(--muted-fg))', margin: '0 auto 1rem' }} />
            <h3 style={{ fontWeight: 700, marginBottom: '0.5rem' }}>No tasks assigned</h3>
            <p style={{ color: 'hsl(var(--muted-fg))', maxWidth: 420, margin: '0 auto' }}>
              When an admin assigns you to a donation (after NGO acceptance), it will appear here.
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', alignItems: 'start' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {pickups.map((p, i) => {
                const next = PICKUP_NEXT_STATUS[p.status];
                const label = PICKUP_STEP_LABELS[p.status];
                return (
                  <motion.div key={p._id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                    <div
                      className="card"
                      onClick={() => setSelected(p)}
                      style={{
                        cursor: 'pointer',
                        transition: 'box-shadow 0.2s, border-color 0.2s',
                        borderColor: selected?._id === p._id ? 'hsl(var(--primary))' : '',
                        boxShadow: selected?._id === p._id ? '0 0 0 2px hsl(var(--primary)/0.2)' : '',
                      }}
                    >
                      <div style={{ height: 3, background: selected?._id === p._id ? 'hsl(var(--primary))' : 'transparent' }} />
                      <div style={{ padding: '1.25rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.875rem' }}>
                          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, flex: 1, marginRight: '0.75rem' }}>
                            {p.donationId?.foodName || 'Food pickup'}
                          </h3>
                          <span className={`badge ${STATUS_BADGE[p.status] || 'badge-pending'}`}>{p.status?.replace(/_/g, ' ')}</span>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', marginBottom: '1rem', fontSize: '0.8125rem', color: 'hsl(var(--muted-fg))' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <MapPin size={13} style={{ color: 'hsl(var(--primary))', flexShrink: 0 }} />
                            <span className="truncate">
                              {p.donationId?.address?.street || p.donationId?.address?.city || 'Pickup TBD'}
                            </span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Navigation size={13} style={{ flexShrink: 0 }} />
                            <span className="truncate">NGO: {p.ngoId?.name || '—'}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Clock size={13} />
                            <span>{fmtTime(p.createdAt)}</span>
                          </div>
                        </div>

                        {next && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              advance(p._id, next);
                            }}
                            disabled={!!actionLoading}
                            className="btn btn-primary btn-sm"
                            style={{ width: '100%', justifyContent: 'center', marginBottom: '0.5rem' }}
                          >
                            {actionLoading === p._id + next ? (
                              <span className="spinner" style={{ width: 14, height: 14, borderTopColor: '#fff' }} />
                            ) : (
                              <CheckCircle size={14} />
                            )}{' '}
                            {label}
                          </button>
                        )}
                        {['assigned', 'accepted', 'en_route_pickup', 'picked_up', 'en_route_delivery'].includes(p.status) && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              cancelTask(p._id);
                            }}
                            disabled={!!actionLoading}
                            className="btn btn-outline btn-sm"
                            style={{ width: '100%', justifyContent: 'center', color: 'hsl(var(--destructive))', borderColor: 'hsl(var(--destructive))' }}
                          >
                            <X size={14} /> Cancel task
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {selected && (
              <motion.div className="card" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} style={{ position: 'sticky', top: '5rem' }}>
                <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid hsl(var(--border)/0.5)' }}>
                  <h2 style={{ fontSize: '1rem', fontWeight: 700 }}>Route</h2>
                  <p style={{ fontSize: '0.8125rem', color: 'hsl(var(--muted-fg))' }}>{selected.donationId?.foodName}</p>
                </div>
                <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                    <div style={{ width: 12, height: 12, borderRadius: '50%', background: 'hsl(var(--primary))', flexShrink: 0, marginTop: 4 }} />
                    <div>
                      <p style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: 'hsl(var(--muted-fg))' }}>Pickup</p>
                      <p style={{ fontWeight: 600, fontSize: '0.875rem' }}>
                        {selected.donationId?.address?.street || selected.donationId?.address?.city || '—'}
                      </p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                    <div style={{ width: 12, height: 12, borderRadius: '50%', background: 'hsl(var(--accent))', flexShrink: 0, marginTop: 4 }} />
                    <div>
                      <p style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: 'hsl(var(--muted-fg))' }}>Drop-off</p>
                      <p style={{ fontWeight: 600, fontSize: '0.875rem' }}>
                        {selected.ngoId?.address?.street || selected.ngoId?.name || '—'}
                      </p>
                    </div>
                  </div>
                  <div style={{ borderRadius: '1rem', overflow: 'hidden', border: '1px solid hsl(var(--border)/0.5)', height: 200, position: 'relative' }}>
                    <RouteMap pickupLocation={donorCoords} dropoffLocation={ngoCoords} />
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
