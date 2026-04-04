import { useState, useEffect, useContext } from 'react';
import { useAuth } from '../hooks/useAuth';
import { NotificationContext } from '../context/NotificationContext';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { PageLoader } from '../components/ui/Spinner';
import {
  Star, Send, MessageSquare, TrendingUp, Award,
} from 'lucide-react';
import { feedbackAPI } from '../services/api';
import { formatDate, getInitials } from '../utils/helpers';

function StarRating({ value, onChange, size = 28, readonly = false }) {
  const [hover, setHover] = useState(0);
  return (
    <div style={{ display: 'flex', gap: '4px' }}>
      {[1, 2, 3, 4, 5].map(star => (
        <button key={star}
          onClick={() => !readonly && onChange?.(star)}
          onMouseEnter={() => !readonly && setHover(star)}
          onMouseLeave={() => !readonly && setHover(0)}
          style={{
            cursor: readonly ? 'default' : 'pointer',
            transition: 'transform var(--transition-fast)',
            transform: (hover === star || value === star) ? 'scale(1.15)' : 'scale(1)',
          }}
        >
          <Star
            size={size}
            fill={(hover || value) >= star ? '#fbbf24' : 'transparent'}
            color={(hover || value) >= star ? '#fbbf24' : 'var(--text-tertiary)'}
            style={{ transition: 'all var(--transition-fast)' }}
          />
        </button>
      ))}
    </div>
  );
}

export default function Feedback() {
  const { user } = useAuth();
  const { success, error } = useContext(NotificationContext);
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ rating: 0, comment: '' });

  useEffect(() => {
    const load = async () => {
      try {
        const data = await feedbackAPI.getAll();
        setFeedbacks(data);
      } catch {}
      setLoading(false);
    };
    load();
  }, []);

  const avgRating = feedbacks.length > 0
    ? (feedbacks.reduce((s, f) => s + f.rating, 0) / feedbacks.length).toFixed(1)
    : '0.0';

  const handleSubmit = async () => {
    if (!form.rating) { error('Please select a rating'); return; }
    if (!form.comment) { error('Please add a comment'); return; }
    setSubmitting(true);
    try {
      const fb = await feedbackAPI.submit({
        userId: user?.id,
        userName: user?.name,
        ...form,
      });
      setFeedbacks(prev => [fb, ...prev]);
      setForm({ rating: 0, comment: '' });
      success('Thank you for your feedback! 🙏');
    } catch {
      error('Failed to submit feedback');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <PageLoader />;

  return (
    <div>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: 'var(--space-2)' }}>Feedback</h1>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: 'var(--space-6)' }}>
        Share your experience and help us improve
      </p>

      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
        gap: 'var(--space-6)', alignItems: 'start',
      }}>
        {/* Submit Feedback */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <Card variant="elevated" style={{ padding: 'var(--space-6)' }} hoverable={false}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 'var(--space-5)' }}>
              Rate Your Experience
            </h3>

            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 'var(--space-5)' }}>
              <StarRating value={form.rating} onChange={r => setForm(p => ({ ...p, rating: r }))} size={36} />
            </div>

            {form.rating > 0 && (
              <p style={{
                textAlign: 'center', fontSize: '0.85rem', color: 'var(--accent-400)',
                marginBottom: 'var(--space-4)', fontWeight: 600,
              }}>
                {['', 'Need Improvement', 'Fair', 'Good', 'Great', 'Excellent'][form.rating]} ⭐
              </p>
            )}

            <Input label="Your Feedback" multiline rows={4} value={form.comment}
              onChange={v => setForm(p => ({ ...p, comment: v }))}
              placeholder="Tell us what you think... What do you love? What can we improve?"
              required
            />

            <Button fullWidth loading={submitting} onClick={handleSubmit}
              icon={Send} style={{ marginTop: 'var(--space-4)' }} size="lg">
              Submit Feedback
            </Button>
          </Card>

          {/* Summary stats */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
            <Card variant="default" style={{ padding: 'var(--space-4)', textAlign: 'center' }}>
              <div style={{
                fontSize: '2rem', fontWeight: 800, fontFamily: 'var(--font-heading)',
                background: 'linear-gradient(135deg, var(--accent-400), var(--accent-600))',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              }}>
                {avgRating}
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', margin: 'var(--space-1) 0' }}>
                <StarRating value={Math.round(Number(avgRating))} readonly size={16} />
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>Average Rating</p>
            </Card>
            <Card variant="default" style={{ padding: 'var(--space-4)', textAlign: 'center' }}>
              <div style={{
                fontSize: '2rem', fontWeight: 800, fontFamily: 'var(--font-heading)',
                color: 'var(--primary-400)',
              }}>
                {feedbacks.length}
              </div>
              <MessageSquare size={16} style={{ color: 'var(--text-tertiary)', margin: 'var(--space-1) auto' }} />
              <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>Total Reviews</p>
            </Card>
          </div>
        </div>

        {/* Feedback List */}
        <div>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 'var(--space-4)' }}>
            Recent Feedback
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }} className="stagger-children">
            {feedbacks.map(fb => (
              <Card key={fb.id} variant="default" style={{ padding: 'var(--space-5)' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-3)' }}>
                  <div style={{
                    width: '38px', height: '38px', borderRadius: '50%',
                    background: 'linear-gradient(135deg, var(--primary-600), var(--primary-800))',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', fontSize: '0.7rem', fontWeight: 700, flexShrink: 0,
                  }}>
                    {getInitials(fb.userName)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-1)' }}>
                      <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{fb.userName}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                        {formatDate(fb.createdAt)}
                      </span>
                    </div>
                    <div style={{ marginBottom: 'var(--space-2)' }}>
                      <StarRating value={fb.rating} readonly size={14} />
                    </div>
                    <p style={{
                      fontSize: '0.85rem', color: 'var(--text-secondary)',
                      lineHeight: 1.6, fontStyle: 'italic',
                    }}>
                      "{fb.comment}"
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
