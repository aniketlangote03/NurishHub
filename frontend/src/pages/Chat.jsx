import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, MessageCircle, Users, Utensils, Building2, Truck, Hash } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useChat } from '../hooks/useChat';

const ROOMS = [
  { id: 'general',    label: 'General',    icon: Hash,        color: '#10b981' },
  { id: 'donors',     label: 'Donors',     icon: Utensils,    color: '#f59e0b' },
  { id: 'volunteers', label: 'Volunteers', icon: Truck,       color: '#8b5cf6' },
  { id: 'ngos',       label: 'NGOs',       icon: Building2,   color: '#3b82f6' },
];

const ROLE_COLORS = {
  admin:     '#ef4444',
  donor:     '#10b981',
  volunteer: '#8b5cf6',
  ngo:       '#3b82f6',
  system:    '#6b7280',
  user:      '#6b7280',
};

const SAMPLE_MSGS = {
  general:    [
    { id: 'g1', sender: 'Priya Sharma',  role: 'volunteer', text: 'Ready for pickups in Andheri today! 🚴', time: '10:15 AM' },
    { id: 'g2', sender: 'Food For All',  role: 'ngo',       text: 'We need 30+ servings by 1 PM please 🙏', time: '10:18 AM' },
    { id: 'g3', sender: 'Amit Bakery',   role: 'donor',     text: 'Fresh bread available now — 25 kg!', time: '10:20 AM' },
  ],
  donors:     [
    { id: 'd1', sender: 'Hotel Residency', role: 'donor', text: 'Posted: 40 servings of rice & dal 🍽️', time: '9:30 AM' },
    { id: 'd2', sender: 'Spice Garden',    role: 'donor', text: 'Vegetable curry expiring at 3 PM — urgent!', time: '9:45 AM' },
  ],
  volunteers: [
    { id: 'v1', sender: 'Rohan Mehta', role: 'volunteer', text: 'En route to Bandra pickup now 🛵', time: '11:00 AM' },
    { id: 'v2', sender: 'Kavya Nair',  role: 'volunteer', text: 'Completed delivery #47 ✅', time: '11:20 AM' },
  ],
  ngos: [
    { id: 'n1', sender: 'Hope Foundation', role: 'ngo', text: 'Received 25 kg bread — thank you all! ❤️', time: '12:00 PM' },
    { id: 'n2', sender: 'Nourish India',   role: 'ngo', text: 'Can we get a pickup from Dadar tomorrow morning?', time: '12:15 PM' },
  ],
};

export default function Chat() {
  const { user } = useAuth();
  const { activeRoom, setActiveRoom } = useChat();
  const [input, setInput] = useState('');
  const [roomMsgs, setRoomMsgs] = useState(SAMPLE_MSGS);
  const bottomRef = useRef(null);

  const messages = roomMsgs[activeRoom] || [];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeRoom]);

  const send = () => {
    if (!input.trim()) return;
    const msg = {
      id: Date.now(),
      sender: user?.name || 'You',
      role: user?.role || 'user',
      text: input.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isOwn: true,
    };
    setRoomMsgs(prev => ({ ...prev, [activeRoom]: [...(prev[activeRoom] || []), msg] }));
    setInput('');
  };

  const currentRoom = ROOMS.find(r => r.id === activeRoom);

  return (
    <div style={{
      height: 'calc(100vh - 64px)',
      display: 'flex',
      background: 'hsl(var(--background))',
      fontFamily: 'var(--font-sans, Inter, sans-serif)',
    }}>

      {/* ── Sidebar ── */}
      <div style={{
        width: 220, flexShrink: 0,
        borderRight: '1px solid hsl(var(--border, 220 13% 91%))',
        background: 'hsl(var(--card, 0 0% 100%))',
        display: 'flex', flexDirection: 'column', padding: '1.25rem 0.75rem', gap: 6,
      }}>
        <p style={{ fontSize: '0.7rem', fontWeight: 700, color: 'hsl(var(--muted-fg, 220 9% 46%))', letterSpacing: '0.08em', padding: '0 0.5rem', marginBottom: 4, textTransform: 'uppercase' }}>
          Channels
        </p>
        {ROOMS.map(room => (
          <button key={room.id}
            onClick={() => setActiveRoom(room.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '0.55rem 0.75rem', borderRadius: 10, border: 'none', cursor: 'pointer',
              background: activeRoom === room.id ? room.color + '18' : 'transparent',
              color: activeRoom === room.id ? room.color : 'hsl(var(--foreground, 224 71% 4%))',
              fontWeight: activeRoom === room.id ? 700 : 500,
              fontSize: '0.875rem', transition: 'all 0.15s', textAlign: 'left', width: '100%',
            }}
          >
            <room.icon size={15} />
            # {room.label}
            {activeRoom === room.id && (
              <span style={{ marginLeft: 'auto', width: 7, height: 7, borderRadius: '50%', background: room.color }} />
            )}
          </button>
        ))}

        {/* Online people */}
        <div style={{ marginTop: 'auto', padding: '0.75rem 0.5rem', borderTop: '1px solid hsl(var(--border, 220 13% 91%))' }}>
          <p style={{ fontSize: '0.7rem', fontWeight: 700, color: 'hsl(var(--muted-fg, 220 9% 46%))', letterSpacing: '0.08em', marginBottom: 8, textTransform: 'uppercase' }}>
            Online — 6
          </p>
          {['Priya S.', 'Rohan M.', 'Food For All'].map(name => (
            <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', flexShrink: 0 }} />
              <span style={{ fontSize: '0.78rem', color: 'hsl(var(--foreground, 224 71% 4%))' }}>{name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Main chat area ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>

        {/* Header */}
        <div style={{
          padding: '0.9rem 1.5rem', borderBottom: '1px solid hsl(var(--border, 220 13% 91%))',
          display: 'flex', alignItems: 'center', gap: 12,
          background: 'hsl(var(--card, 0 0% 100%))',
        }}>
          {currentRoom && <currentRoom.icon size={20} color={currentRoom.color} />}
          <div>
            <p style={{ fontWeight: 700, fontSize: '0.95rem' }}> # {currentRoom?.label}</p>
            <p style={{ fontSize: '0.7rem', color: 'hsl(var(--muted-fg, 220 9% 46%))' }}>NourishHub community channel</p>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', color: 'hsl(var(--muted-fg, 220 9% 46%))' }}>
            <Users size={15} />
            <span>6 online</span>
          </div>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: 4 }}>
          <AnimatePresence initial={false}>
            {messages.map((msg) => {
              const isOwn = msg.isOwn;
              const roleColor = ROLE_COLORS[msg.role] || '#6b7280';
              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  style={{
                    display: 'flex', flexDirection: isOwn ? 'row-reverse' : 'row',
                    alignItems: 'flex-end', gap: 10, marginBottom: 8,
                  }}
                >
                  {/* Avatar */}
                  {!isOwn && (
                    <div style={{
                      width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
                      background: roleColor + '22', border: `2px solid ${roleColor}44`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '0.8rem', fontWeight: 700, color: roleColor,
                    }}>
                      {(msg.sender || 'U')[0].toUpperCase()}
                    </div>
                  )}

                  <div style={{ maxWidth: '68%', display: 'flex', flexDirection: 'column', alignItems: isOwn ? 'flex-end' : 'flex-start' }}>
                    {!isOwn && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                        <span style={{ fontSize: '0.78rem', fontWeight: 700, color: roleColor }}>{msg.sender}</span>
                        <span style={{ fontSize: '0.65rem', padding: '1px 6px', borderRadius: 6, background: roleColor + '18', color: roleColor, fontWeight: 600, textTransform: 'capitalize' }}>{msg.role}</span>
                      </div>
                    )}
                    <div style={{
                      padding: '0.55rem 0.9rem', borderRadius: isOwn ? '16px 4px 16px 16px' : '4px 16px 16px 16px',
                      background: isOwn
                        ? 'linear-gradient(135deg, #10b981, #047857)'
                        : 'hsl(var(--muted, 210 40% 96%))',
                      color: isOwn ? '#fff' : 'hsl(var(--foreground, 224 71% 4%))',
                      fontSize: '0.875rem', lineHeight: 1.5, fontWeight: 500,
                      boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                    }}>
                      {msg.text}
                    </div>
                    <span style={{ fontSize: '0.65rem', color: 'hsl(var(--muted-fg, 220 9% 46%))', marginTop: 3 }}>{msg.time}</span>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
          <div ref={bottomRef} />
        </div>

        {/* Input bar */}
        <div style={{
          padding: '0.9rem 1.5rem', borderTop: '1px solid hsl(var(--border, 220 13% 91%))',
          display: 'flex', gap: 10, alignItems: 'center',
          background: 'hsl(var(--card, 0 0% 100%))',
        }}>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && send()}
            placeholder={`Message #${currentRoom?.label}...`}
            style={{
              flex: 1, padding: '0.65rem 1rem', borderRadius: 12, border: '1px solid hsl(var(--border, 220 13% 91%))',
              fontSize: '0.9rem', outline: 'none', background: 'hsl(var(--background))', color: 'hsl(var(--foreground, 224 71% 4%))',
              transition: 'border-color 0.2s',
            }}
            onFocus={e => e.target.style.borderColor = '#10b981'}
            onBlur={e => e.target.style.borderColor = 'hsl(var(--border, 220 13% 91%))'}
          />
          <button
            onClick={send}
            style={{
              width: 42, height: 42, borderRadius: 12, border: 'none', cursor: 'pointer',
              background: input.trim() ? 'linear-gradient(135deg, #10b981, #047857)' : 'hsl(var(--muted, 210 40% 96%))',
              color: input.trim() ? '#fff' : 'hsl(var(--muted-fg, 220 9% 46%))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.2s', flexShrink: 0,
            }}
          >
            <Send size={17} />
          </button>
        </div>
      </div>
    </div>
  );
}
