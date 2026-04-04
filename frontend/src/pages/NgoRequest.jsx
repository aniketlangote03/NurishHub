import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { requestsAPI } from '../services/api';
import { ClipboardList, Check, X } from 'lucide-react';

const STATUS_COLORS = {
  approved: 'badge-approved',
  pending: 'badge-pending',
  rejected: 'badge-cancelled',
  cancelled: 'badge-cancelled',
  fulfilled: 'badge-completed',
};

function ngoIdStr(req) {
  const n = req.ngoId;
  return n?._id?.toString() || n?.toString?.() || '';
}

function donationLabel(req) {
  const d = req.donationId;
  if (!d) return 'Donation';
  if (typeof d === 'object') return d.foodName || `Donation ${d._id?.toString?.().slice(-6) || ''}`;
  return `Donation ${String(d).slice(-6)}`;
}

function qtyLabel(req) {
  const d = req.donationId;
  if (d && typeof d === 'object' && d.quantity) {
    return `${d.quantity.value} ${d.quantity.unit}`;
  }
  return req.quantity || '—';
}

/**
 * NGO: my requests to claim food.
 * Donor / Admin: approve or reject pending NGO requests (acceptance + lock is enforced on the server).
 */
export default function NgoRequest() {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);

  const load = () => {
    setLoading(true);
    requestsAPI
      .getAll()
      .then((res) => {
        if (res.success) setRequests(res.data.requests || []);
      })
      .catch(() => setRequests([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [user]);

  const approve = async (id) => {
    setUpdating(id + 'approve');
    try {
      await requestsAPI.approve(id);
      load();
    } catch (err) {
      alert(typeof err === 'string' ? err : 'Approve failed');
    } finally {
      setUpdating(null);
    }
  };

  const reject = async (id) => {
    setUpdating(id + 'reject');
    try {
      await requestsAPI.reject(id);
      load();
    } catch (err) {
      alert(typeof err === 'string' ? err : 'Reject failed');
    } finally {
      setUpdating(null);
    }
  };

  const withdraw = async (id) => {
    if (!window.confirm('Withdraw this request?')) return;
    setUpdating(id + 'cancel');
    try {
      await requestsAPI.cancel(id);
      load();
    } catch (err) {
      alert(typeof err === 'string' ? err : 'Withdraw failed');
    } finally {
      setUpdating(null);
    }
  };

  const fmtDate = (d) =>
    new Date(d).toLocaleString('en-IN', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });

  const canDecide = user?.role === 'donor' || user?.role === 'admin';
  const isNgo = user?.role === 'ngo';

  return (
    <div style={{ minHeight: '100vh', background: 'hsl(var(--background))' }}>
      <div style={{ background: 'hsl(var(--muted)/0.3)', borderBottom: '1px solid hsl(var(--border)/0.5)', padding: '2rem 0' }}>
        <div className="container-xl">
          <h1 style={{ fontSize: 'clamp(1.5rem, 4vw, 2.25rem)', fontWeight: 900, marginBottom: '0.5rem' }}>
            NGO requests & acceptance
          </h1>
          <p style={{ color: 'hsl(var(--muted-fg))', maxWidth: 720 }}>
            NGOs request donations via <code style={{ fontSize: '0.85em' }}>POST /api/requests</code>. The{' '}
            <strong>donor</strong> (or admin) <strong>accepts</strong> one NGO — the server then locks the donation
            for others. Next step: admin assigns a volunteer.
          </p>
          {isNgo && (
            <Link to="/donations" className="btn btn-primary btn-sm" style={{ marginTop: '1rem', display: 'inline-flex' }}>
              Browse donations to request
            </Link>
          )}
        </div>
      </div>

      <div className="container-xl" style={{ padding: '2rem 1.5rem', maxWidth: 900 }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {[1, 2, 3].map((i) => (
              <div key={i} className="card animate-pulse" style={{ height: 128 }} />
            ))}
          </div>
        ) : !requests.length ? (
          <div
            style={{
              textAlign: 'center',
              padding: '5rem 1rem',
              background: 'hsl(var(--card))',
              borderRadius: '1.5rem',
              border: '2px dashed hsl(var(--border))',
            }}
          >
            <ClipboardList size={48} style={{ color: 'hsl(var(--muted-fg))', margin: '0 auto 1rem' }} />
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>No requests here</h3>
            <p style={{ color: 'hsl(var(--muted-fg))' }}>
              {isNgo ? 'Request food from the donations list.' : 'When NGOs request your food, rows appear here.'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {requests.map((req, i) => {
              const mine = isNgo && user?._id && ngoIdStr(req) === user._id.toString();
              return (
                <motion.div
                  key={req._id}
                  className="card"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                >
                  <div style={{ padding: '1.5rem', display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', gap: '1.5rem' }}>
                    <div style={{ flex: 1, minWidth: 240 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                        <h3 style={{ fontSize: '1.125rem', fontWeight: 700 }}>{donationLabel(req)}</h3>
                        <span className={`badge ${STATUS_COLORS[req.status] || 'badge-pending'}`}>{req.status}</span>
                      </div>
                      <p style={{ fontSize: '0.875rem', color: 'hsl(var(--muted-fg))', marginBottom: '0.5rem' }}>
                        NGO: <strong style={{ color: 'hsl(var(--foreground))' }}>{req.ngoId?.name || 'NGO'}</strong> ·{' '}
                        {fmtDate(req.createdAt)}
                      </p>
                      <p style={{ fontSize: '0.875rem', color: 'hsl(var(--muted-fg))', marginBottom: '0.5rem' }}>
                        Quantity: <strong style={{ color: 'hsl(var(--foreground))' }}>{qtyLabel(req)}</strong>
                      </p>
                      {req.message && (
                        <div
                          style={{
                            background: 'hsl(var(--muted)/0.5)',
                            padding: '0.75rem',
                            borderRadius: '0.75rem',
                            fontSize: '0.875rem',
                            marginTop: '0.5rem',
                          }}
                        >
                          <strong>Notes:</strong> {req.message}
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', minWidth: 160 }}>
                      {canDecide && req.status === 'pending' && (
                        <>
                          <button
                            type="button"
                            onClick={() => approve(req._id)}
                            disabled={!!updating}
                            className="btn btn-sm"
                            style={{
                              background: 'hsl(var(--primary))',
                              color: 'hsl(var(--primary-fg))',
                              gap: '0.375rem',
                              justifyContent: 'center',
                              width: '100%',
                            }}
                          >
                            {updating === req._id + 'approve' ? (
                              <span className="spinner" style={{ width: 14, height: 14, borderTopColor: '#fff' }} />
                            ) : (
                              <Check size={14} />
                            )}{' '}
                            Accept NGO
                          </button>
                          <button
                            type="button"
                            onClick={() => reject(req._id)}
                            disabled={!!updating}
                            className="btn btn-sm btn-destructive"
                            style={{ gap: '0.375rem', justifyContent: 'center', width: '100%' }}
                          >
                            {updating === req._id + 'reject' ? (
                              <span className="spinner" style={{ width: 14, height: 14, borderTopColor: '#fff' }} />
                            ) : (
                              <X size={14} />
                            )}{' '}
                            Reject
                          </button>
                        </>
                      )}
                      {mine && req.status === 'pending' && (
                        <button
                          type="button"
                          onClick={() => withdraw(req._id)}
                          disabled={!!updating}
                          className="btn btn-sm btn-outline"
                          style={{ justifyContent: 'center', width: '100%' }}
                        >
                          Withdraw request
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
