import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import { useDonation } from '../hooks/useDonation';
import { Leaf, ArrowRight, Camera, Clock, MapPin, Phone, AlertCircle } from 'lucide-react';
import MapPicker from '../components/ui/MapPicker';
import { DONATION_STATUS_FLOW } from '../utils/donationStatus';

const CATEGORY_OPTIONS = [
  { value: 'cooked_food', label: 'Cooked Food' },
  { value: 'raw_vegetables', label: 'Raw Vegetables' },
  { value: 'fruits', label: 'Fruits' },
  { value: 'grains', label: 'Grains & Cereals' },
  { value: 'dairy', label: 'Dairy Products' },
  { value: 'bakery', label: 'Baked Goods' },
  { value: 'packaged_food', label: 'Packaged Food' },
  { value: 'beverages', label: 'Beverages' },
  { value: 'other', label: 'Other' },
];

const UNIT_OPTIONS = ['kg', 'liters', 'servings', 'packets', 'boxes', 'pieces'];
const PACKAGING = [
  { value: '', label: '— Select —' },
  { value: 'loose', label: 'Loose' },
  { value: 'packed', label: 'Packed' },
  { value: 'mixed', label: 'Mixed' },
];
const TEMP = [
  { value: '', label: '— Select —' },
  { value: 'hot', label: 'Hot' },
  { value: 'cold', label: 'Cold' },
  { value: 'room', label: 'Room temperature' },
];

function toDatetimeLocalValue(d) {
  if (!d) return '';
  const x = new Date(d);
  const pad = (n) => String(n).padStart(2, '0');
  return `${x.getFullYear()}-${pad(x.getMonth() + 1)}-${pad(x.getDate())}T${pad(x.getHours())}:${pad(x.getMinutes())}`;
}

export default function AddEditDonation() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addDonation } = useDonation();
  const fileInputRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [imageFiles, setImageFiles] = useState([]);

  const defaultExpiry = () => {
    const t = new Date();
    t.setHours(t.getHours() + 4);
    return toDatetimeLocalValue(t);
  };

  const [form, setForm] = useState({
    foodName: '',
    description: '',
    dietType: 'veg',
    foodType: 'cooked_food',
    foodCategory: '',
    quantity: '',
    unit: 'servings',
    servingSize: '',
    cookedAt: '',
    expiryTime: defaultExpiry(),
    pickupWindowStart: '',
    pickupWindowEnd: '',
    addressStreet: user?.address?.street || '',
    city: user?.address?.city || user?.city || 'Mumbai',
    landmark: '',
    pincode: '',
    location: [72.8777, 19.076],
    pickupContactPhone: user?.phone || '',
    specialInstructions: '',
    packagingType: '',
    foodTemperature: '',
  });

  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target ? e.target.value : e }));

  const onFiles = (e) => {
    const files = Array.from(e.target.files || []).slice(0, 5);
    setImageFiles(files);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const q = parseFloat(form.quantity);
    if (!form.foodName?.trim() || !form.quantity || Number.isNaN(q) || q <= 0) {
      setError('Food name and a valid quantity are required.');
      return;
    }
    if (!form.city?.trim()) {
      setError('City is required.');
      return;
    }
    if (!form.expiryTime) {
      setError('Best-before / expiry time is required for food safety.');
      return;
    }
    const expiryISO = new Date(form.expiryTime).toISOString();
    if (new Date(expiryISO) <= new Date()) {
      setError('Expiry time must be in the future.');
      return;
    }

    const [lng, lat] = form.location;
    if (lng == null || lat == null) {
      setError('Please set map location (latitude & longitude).');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        foodName: form.foodName.trim(),
        foodType: form.foodType,
        dietType: form.dietType,
        description: form.description?.trim() || undefined,
        foodCategory: form.foodCategory?.trim() || undefined,
        quantity: { value: q, unit: form.unit },
        servingSize: form.servingSize ? parseInt(form.servingSize, 10) : undefined,
        cookedAt: form.cookedAt ? new Date(form.cookedAt).toISOString() : undefined,
        expiryTime: expiryISO,
        pickupWindowStart: form.pickupWindowStart
          ? new Date(form.pickupWindowStart).toISOString()
          : undefined,
        pickupWindowEnd: form.pickupWindowEnd
          ? new Date(form.pickupWindowEnd).toISOString()
          : undefined,
        location: { type: 'Point', coordinates: [Number(lng), Number(lat)] },
        address: {
          street: form.addressStreet?.trim() || undefined,
          city: form.city.trim(),
          pincode: form.pincode?.trim() || undefined,
          country: 'India',
          landmark: form.landmark?.trim() || undefined,
        },
        isVegetarian: form.dietType === 'veg',
        pickupContactPhone: form.pickupContactPhone?.trim() || undefined,
        specialInstructions: form.specialInstructions?.trim() || undefined,
        packagingType: form.packagingType || undefined,
        foodTemperature: form.foodTemperature || undefined,
      };

      const res = await addDonation(payload, imageFiles.length ? imageFiles : null);
      if (res?.success) {
        navigate('/donations');
      } else {
        setError(res?.error || 'Failed to post donation.');
      }
    } catch (err) {
      setError(typeof err === 'string' ? err : 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const section = (emoji, title, subtitle) => (
    <div
      style={{
        borderTop: '1px solid hsl(var(--border)/0.5)',
        paddingTop: '1.25rem',
        marginTop: '0.5rem',
      }}
    >
      <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.25rem' }}>
        {emoji} {title}
      </h3>
      {subtitle && (
        <p style={{ fontSize: '0.8125rem', color: 'hsl(var(--muted-fg))', marginBottom: '1rem' }}>
          {subtitle}
        </p>
      )}
    </div>
  );

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
          <h1 style={{ fontSize: 'clamp(1.5rem, 4vw, 2rem)', fontWeight: 900 }}>
            Food donation form
          </h1>
          <p style={{ color: 'hsl(var(--muted-fg))', marginTop: '0.375rem', maxWidth: 640 }}>
            Donors submit food type, quantity, cooked / best-before times, and pickup details. Data is
            stored via <code style={{ fontSize: '0.85em' }}>POST /api/donations</code> and appears on the
            admin dashboard as <strong>Pending</strong>, then flows: {DONATION_STATUS_FLOW}.
          </p>
        </div>
      </div>

      <div className="container-xl" style={{ padding: '2.5rem 1.5rem' }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ maxWidth: 720, margin: '0 auto' }}
        >
          <div className="card" style={{ padding: '2.5rem' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                marginBottom: '2rem',
                paddingBottom: '1.5rem',
                borderBottom: '1px solid hsl(var(--border)/0.5)',
              }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 16,
                  background: 'hsl(var(--primary)/0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Leaf size={24} style={{ color: 'hsl(var(--primary))' }} />
              </div>
              <div>
                <h2 style={{ fontSize: '1.125rem', fontWeight: 700 }}>Your donation</h2>
                <p style={{ fontSize: '0.875rem', color: 'hsl(var(--muted-fg))' }}>
                  Helps NGOs judge suitability and plan pickup safely.
                </p>
              </div>
            </div>

            {error && (
              <div
                className="alert-error"
                style={{ marginBottom: '1.5rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}
              >
                <AlertCircle size={18} />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {section('📝', 'Basic food details')}
              <div className="form-group">
                <label className="form-label">
                  Veg / Non-veg <span style={{ color: 'hsl(var(--destructive))' }}>*</span>
                </label>
                <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="diet"
                      checked={form.dietType === 'veg'}
                      onChange={() => setForm((p) => ({ ...p, dietType: 'veg' }))}
                    />
                    Vegetarian
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="diet"
                      checked={form.dietType === 'non_veg'}
                      onChange={() => setForm((p) => ({ ...p, dietType: 'non_veg' }))}
                    />
                    Non-vegetarian
                  </label>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Food category (type)</label>
                  <select className="form-input" value={form.foodType} onChange={set('foodType')}>
                    {CATEGORY_OPTIONS.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Sub-category (optional)</label>
                  <input
                    className="form-input"
                    placeholder="e.g. rice, curry, snacks"
                    value={form.foodCategory}
                    onChange={set('foodCategory')}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">
                  Food name / short description <span style={{ color: 'hsl(var(--destructive))' }}>*</span>
                </label>
                <input
                  className="form-input"
                  placeholder='e.g. "Paneer curry + roti"'
                  value={form.foodName}
                  onChange={set('foodName')}
                />
              </div>

              {section('📦', 'Quantity', 'Important for NGOs to decide pickup capacity.')}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group" style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end' }}>
                  <div style={{ flex: 1 }}>
                    <label className="form-label">
                      Quantity <span style={{ color: 'hsl(var(--destructive))' }}>*</span>
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0.1"
                      className="form-input"
                      placeholder="e.g. 25 or 5"
                      value={form.quantity}
                      onChange={set('quantity')}
                    />
                  </div>
                  <div style={{ flexShrink: 0, width: '120px' }}>
                    <label className="form-label">&nbsp;</label>
                    <select className="form-input" value={form.unit} onChange={set('unit')}>
                      {UNIT_OPTIONS.map((u) => (
                        <option key={u} value={u}>
                          {u}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Serves how many people? (optional)</label>
                  <input
                    type="number"
                    min="1"
                    className="form-input"
                    placeholder="e.g. 20 people"
                    value={form.servingSize}
                    onChange={set('servingSize')}
                  />
                </div>
              </div>

              {section('⏰', 'Expiry / time', 'Reduces risk of spoiled food.')}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">
                    <Clock size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 6 }} />
                    Cooked / prepared at (optional)
                  </label>
                  <input
                    type="datetime-local"
                    className="form-input"
                    value={form.cookedAt}
                    onChange={set('cookedAt')}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">
                    Best before / expiry <span style={{ color: 'hsl(var(--destructive))' }}>*</span>
                  </label>
                  <input
                    type="datetime-local"
                    className="form-input"
                    value={form.expiryTime}
                    onChange={set('expiryTime')}
                  />
                </div>
              </div>

              {section('📍', 'Location')}
              <div className="form-group">
                <label className="form-label">Pin on map (lat/lng)</label>
                <MapPicker coordinates={form.location} onChange={set('location')} />
              </div>
              <div className="form-group">
                <label className="form-label">Address / street</label>
                <input
                  className="form-input"
                  placeholder="Building, street"
                  value={form.addressStreet}
                  onChange={set('addressStreet')}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">
                    City <span style={{ color: 'hsl(var(--destructive))' }}>*</span>
                  </label>
                  <input className="form-input" placeholder="Pune" value={form.city} onChange={set('city')} />
                </div>
                <div className="form-group">
                  <label className="form-label">Landmark (optional)</label>
                  <input
                    className="form-input"
                    placeholder="Near metro / temple"
                    value={form.landmark}
                    onChange={set('landmark')}
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">PIN code (optional)</label>
                <input className="form-input" value={form.pincode} onChange={set('pincode')} />
              </div>

              {section('📸', 'Food image (optional)', 'Builds trust with NGOs.')}
              <div className="form-group">
                <input ref={fileInputRef} type="file" accept="image/*" multiple hidden onChange={onFiles} />
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => fileInputRef.current?.click()}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  <Camera size={18} />
                  Choose photos (max 5)
                </button>
                {imageFiles.length > 0 && (
                  <p style={{ fontSize: '0.8125rem', color: 'hsl(var(--muted-fg))', marginTop: '0.5rem' }}>
                    {imageFiles.length} file(s) selected — uploaded with{' '}
                    <code style={{ fontSize: '0.85em' }}>multipart/form-data</code>
                  </p>
                )}
              </div>

              {section('🚚', 'Pickup details')}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Pickup window start (optional)</label>
                  <input
                    type="datetime-local"
                    className="form-input"
                    value={form.pickupWindowStart}
                    onChange={set('pickupWindowStart')}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Pickup window end (optional)</label>
                  <input
                    type="datetime-local"
                    className="form-input"
                    value={form.pickupWindowEnd}
                    onChange={set('pickupWindowEnd')}
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">
                  <Phone size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 6 }} />
                  Contact number for pickup
                </label>
                <input
                  className="form-input"
                  type="tel"
                  placeholder="Donor / on-site contact"
                  value={form.pickupContactPhone}
                  onChange={set('pickupContactPhone')}
                />
              </div>

              {section('⚠️', 'Special instructions')}
              <div className="form-group">
                <textarea
                  className="form-input"
                  placeholder='e.g. "Bring containers", "Call before arrival"'
                  value={form.specialInstructions}
                  onChange={set('specialInstructions')}
                  style={{ minHeight: '5rem' }}
                />
              </div>

              {section('⚡', 'Optional (extra detail)')}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Packaging</label>
                  <select
                    className="form-input"
                    value={form.packagingType}
                    onChange={set('packagingType')}
                  >
                    {PACKAGING.map((o) => (
                      <option key={o.value || 'x'} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Temperature</label>
                  <select
                    className="form-input"
                    value={form.foodTemperature}
                    onChange={set('foodTemperature')}
                  >
                    {TEMP.map((o) => (
                      <option key={o.value || 'y'} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Any other details (optional)</label>
                <textarea
                  className="form-input"
                  placeholder="Allergens, halal, packaging notes…"
                  value={form.description}
                  onChange={set('description')}
                  style={{ minHeight: '4rem' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  className="btn btn-outline btn-lg"
                  style={{ flex: '0 0 auto' }}
                  onClick={() => navigate(-1)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-lg"
                  disabled={loading}
                  style={{ flex: 1, justifyContent: 'center' }}
                >
                  {loading ? (
                    <>
                      <span
                        className="spinner"
                        style={{ width: 18, height: 18, borderTopColor: '#fff', display: 'inline-block' }}
                      />{' '}
                      Posting…
                    </>
                  ) : (
                    <>
                      Submit donation <ArrowRight size={18} />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
