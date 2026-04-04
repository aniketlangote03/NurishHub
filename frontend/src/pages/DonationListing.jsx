import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useDonation } from '../hooks/useDonation';
import { useAuth } from '../hooks/useAuth';
import { requestsAPI } from '../services/api';
import { MapPin, Clock, Package, Utensils, Search } from 'lucide-react';
import { DONATION_STATUS_LABELS } from '../utils/donationStatus';

const OPEN_FOR_NGO_REQUEST = ['pending', 'available', 'requested'];

const STATUS_COLORS = {
  pending: 'badge-pending',
  available: 'badge-available',
  requested: 'badge-pending',
  accepted: 'badge-approved',
  assigned: 'badge-in-transit',
  picked_up: 'badge-in-transit',
  delivered: 'badge-delivered',
  expired: 'badge-expired',
  cancelled: 'badge-expired',
};

const STATUS_FILTERS = [
  'all',
  'pending',
  'requested',
  'accepted',
  'assigned',
  'picked_up',
  'delivered',
  'expired',
];

const FOOD_TYPES = [
  { value: 'all', label: 'All types' },
  { value: 'cooked_food', label: 'Cooked Food' },
  { value: 'raw_vegetables', label: 'Raw Vegetables' },
  { value: 'fruits', label: 'Fruits' },
  { value: 'grains', label: 'Grains' },
  { value: 'dairy', label: 'Dairy' },
  { value: 'bakery', label: 'Bakery' },
  { value: 'packaged_food', label: 'Packaged' },
  { value: 'beverages', label: 'Beverages' },
  { value: 'other', label: 'Other' },
];

function formatQty(q) {
  if (!q || typeof q !== 'object') return '—';
  return `${q.value} ${q.unit}`;
}

export default function DonationListing() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { donations, loading, fetchDonations } = useDonation();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [foodTypeFilter, setFoodTypeFilter] = useState('all');
  const [urgentFirst, setUrgentFirst] = useState(true);
  const [requestingId, setRequestingId] = useState(null);

  useEffect(() => {
    fetchDonations({
      status: statusFilter !== 'all' ? statusFilter : undefined,
      foodType: foodTypeFilter !== 'all' ? foodTypeFilter : undefined,
    });
  }, [statusFilter, foodTypeFilter, fetchDonations]);

  const filtered = useMemo(() => {
    if (!search.trim()) return donations;
    const s = search.trim().toLowerCase();
    return donations.filter((d) => {
      const name = (d.foodName || '').toLowerCase();
      const desc = (d.description || '').toLowerCase();
      const city = (d.address?.city || '').toLowerCase();
      return name.includes(s) || desc.includes(s) || city.includes(s);
    });
  }, [donations, search]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    if (urgentFirst) {
      arr.sort((a, b) => new Date(a.expiryTime || 0) - new Date(b.expiryTime || 0));
    }
    return arr;
  }, [filtered, urgentFirst]);

  async function requestDonation(donationId, e) {
    e?.stopPropagation?.();
    setRequestingId(donationId);
    try {
      await requestsAPI.create({ donationId, message: 'We can collect this donation.' });
      await fetchDonations({
        status: statusFilter !== 'all' ? statusFilter : undefined,
        foodType: foodTypeFilter !== 'all' ? foodTypeFilter : undefined,
      });
      alert('Request sent. Wait for donor/admin to accept.');
    } catch (err) {
      alert(typeof err === 'string' ? err : 'Could not create request');
    } finally {
      setRequestingId(null);
    }
  }

  const fmtDate = (d) =>
    d ? new Date(d).toLocaleString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

  return (
    <div style={{ minHeight: '100vh', background: 'hsl(var(--background))' }}>
      <div
        style={{
          background: 'hsl(var(--muted)/0.3)',
          borderBottom: '1px solid hsl(var(--border)/0.5)',
          padding: '2rem 0',
        }}
      >
        <div className="container-xl">
          <h1 style={{ fontSize: 'clamp(1.5rem, 4vw, 2.25rem)', fontWeight: 900, marginBottom: '0.5rem' }}>
            Donations
          </h1>
          <p style={{ color: 'hsl(var(--muted-fg))', fontSize: '1rem', maxWidth: 720 }}>
            Admin dashboard loads these via <code style={{ fontSize: '0.85em' }}>GET /api/donations</code>. New
            listings start as <strong>Pending</strong>; after NGO request → <strong>Accepted</strong>; volunteer
            assign → <strong>Assigned</strong> → <strong>Picked up</strong> → <strong>Delivered</strong>.
          </p>
        </div>
      </div>

      <div className="container-xl" style={{ padding: '2rem 1.5rem' }}>
        <div className="card" style={{ padding: '1rem 1.25rem', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: '1 1 200px', minWidth: 180 }}>
              <Search
                size={16}
                style={{
                  position: 'absolute',
                  left: 14,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'hsl(var(--muted-fg))',
                }}
              />
              <input
                className="form-input"
                placeholder="Search by food name, city…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ paddingLeft: '2.5rem' }}
              />
            </div>
            <select
              className="form-input"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ flex: '0 0 auto', width: 'auto', minWidth: 180 }}
            >
              {STATUS_FILTERS.map((s) => (
                <option key={s} value={s}>
                  {s === 'all' ? 'All statuses' : DONATION_STATUS_LABELS[s] || s}
                </option>
              ))}
            </select>
            <select
              className="form-input"
              value={foodTypeFilter}
              onChange={(e) => setFoodTypeFilter(e.target.value)}
              style={{ flex: '0 0 auto', width: 'auto', minWidth: 200 }}
            >
              {FOOD_TYPES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
            <label
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.875rem',
                color: 'hsl(var(--muted-fg))',
                cursor: 'pointer',
                userSelect: 'none',
              }}
            >
              <input type="checkbox" checked={urgentFirst} onChange={(e) => setUrgentFirst(e.target.checked)} />
              Urgent first (soonest expiry)
            </label>
            {(user?.role === 'donor' || user?.role === 'admin') && (
              <Link to="/donations/new" className="btn btn-primary" style={{ marginLeft: 'auto' }}>
                + New donation
              </Link>
            )}
          </div>
        </div>

        {loading ? (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '1.5rem',
            }}
          >
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="card animate-pulse"
                style={{ height: 260, background: 'hsl(var(--muted)/0.5)' }}
              />
            ))}
          </div>
        ) : !sorted.length ? (
          <div
            style={{
              textAlign: 'center',
              padding: '5rem 1rem',
              background: 'hsl(var(--card))',
              borderRadius: '1.5rem',
              border: '2px dashed hsl(var(--border))',
            }}
          >
            <Utensils size={48} style={{ color: 'hsl(var(--muted-fg))', margin: '0 auto 1rem' }} />
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>No donations found</h3>
            <p style={{ color: 'hsl(var(--muted-fg))' }}>Try adjusting filters or post a new donation.</p>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '1.5rem',
            }}
          >
            {sorted.map((d, i) => {
              const id = d._id || d.id;
              const donorName = d.donorId?.name || d.donorName || 'Donor';
              const status = d.status || 'pending';
              const addr =
                [d.address?.street, d.address?.city, d.address?.landmark].filter(Boolean).join(', ') ||
                d.address?.city ||
                '—';
              const ngoCanRequest = user?.role === 'ngo' && OPEN_FOR_NGO_REQUEST.includes(status);

              return (
                <motion.div
                  key={id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                >
                  <div
                    className="card"
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      cursor: 'pointer',
                      transition: 'box-shadow 0.2s, transform 0.2s',
                    }}
                    onClick={() => navigate(`/donations/${id}`)}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.boxShadow = '0 8px 24px hsl(var(--primary)/0.12)';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow = '';
                      e.currentTarget.style.transform = '';
                    }}
                  >
                    <div
                      style={{
                        height: 4,
                        background: 'linear-gradient(to right, hsl(var(--primary)), hsl(var(--accent)))',
                      }}
                    />

                    <div style={{ padding: '1.25rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          gap: '0.75rem',
                          marginBottom: '0.5rem',
                        }}
                      >
                        <h3 className="line-clamp-2" style={{ fontSize: '1rem', fontWeight: 700, lineHeight: 1.3 }}>
                          {d.foodName}
                        </h3>
                        <span
                          className={`badge ${STATUS_COLORS[status] || 'badge-pending'}`}
                          style={{ flexShrink: 0, fontSize: '0.7rem' }}
                        >
                          {DONATION_STATUS_LABELS[status] || status}
                        </span>
                      </div>
                      <p
                        style={{
                          fontSize: '0.8125rem',
                          color: 'hsl(var(--muted-fg))',
                          fontWeight: 500,
                          marginBottom: '0.875rem',
                        }}
                      >
                        {donorName}
                        {d.dietType ? ` · ${d.dietType === 'veg' ? 'Veg' : 'Non-veg'}` : ''}
                      </p>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', marginBottom: 'auto' }}>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            fontSize: '0.8125rem',
                            color: 'hsl(var(--muted-fg))',
                          }}
                        >
                          <Package size={14} style={{ flexShrink: 0 }} />
                          <span>
                            {formatQty(d.quantity)}
                            {d.servingSize ? ` · ~${d.servingSize} people` : ''}
                          </span>
                        </div>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            fontSize: '0.8125rem',
                            color: 'hsl(var(--muted-fg))',
                          }}
                        >
                          <MapPin size={14} style={{ flexShrink: 0 }} />
                          <span className="truncate">{addr}</span>
                        </div>
                        {d.expiryTime && (
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem',
                              fontSize: '0.8125rem',
                              color: 'hsl(var(--accent))',
                              fontWeight: 600,
                            }}
                          >
                            <Clock size={14} style={{ flexShrink: 0 }} />
                            <span>Best before: {fmtDate(d.expiryTime)}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div
                      style={{
                        padding: '0.75rem 1.25rem',
                        borderTop: '1px solid hsl(var(--border)/0.5)',
                        background: 'hsl(var(--muted)/0.1)',
                        display: 'flex',
                        flexWrap: 'wrap',
                        alignItems: 'center',
                        gap: '0.5rem',
                        justifyContent: 'space-between',
                      }}
                    >
                      <span style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-fg))' }}>
                        Posted {fmtDate(d.createdAt)}
                      </span>
                      {ngoCanRequest && (
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          disabled={requestingId === id}
                          onClick={(e) => requestDonation(id, e)}
                        >
                          {requestingId === id ? '…' : 'Request food'}
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
