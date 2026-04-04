import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useChat } from '../hooks/useChat';
import { PageLoader } from '../components/ui/Spinner';
import {
  Send, Search, Smile, Paperclip, MoreVertical,
  Phone, Video, ArrowLeft,
} from 'lucide-react';
import { formatTime, getInitials } from '../utils/helpers';

export default function Chat() {
  const { user } = useAuth();
  const { 
    contacts, messages, activeContact, setActiveContact, 
    fetchContacts, fetchMessages, sendMessage, typingStatus, notifyTyping 
  } = useChat();

  const [newMsg, setNewMsg] = useState('');
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchContacts().finally(() => setLoading(false));
  }, [fetchContacts]);

  useEffect(() => {
    if (activeContact?._id) {
      fetchMessages(activeContact._id);
    }
  }, [activeContact, fetchMessages]);

  const activeMessages = activeContact ? (messages[activeContact._id] || []) : [];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeMessages]);

  const handleSend = async () => {
    if (!newMsg.trim() || !activeContact) return;
    await sendMessage(activeContact._id, newMsg.trim());
    setNewMsg('');
    notifyTyping(activeContact._id, false);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleChange = (e) => {
    setNewMsg(e.target.value);
    if (activeContact) {
      notifyTyping(activeContact._id, e.target.value.length > 0);
    }
  };

  const filteredContacts = contacts.filter(c =>
    c.name?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <PageLoader />;

  return (
    <div style={{
      display: 'grid', gridTemplateColumns: '320px 1fr',
      gap: 0, height: 'calc(100vh - var(--navbar-height) - 3rem)',
      borderRadius: 'var(--radius-xl)', overflow: 'hidden',
      border: '1px solid var(--border-color)',
      background: 'var(--bg-secondary)',
    }} className="chat-grid">
      {/* Contact List */}
      <div style={{
        borderRight: '1px solid var(--border-color)',
        display: 'flex', flexDirection: 'column',
      }} className="chat-contacts">
        <div style={{
          padding: 'var(--space-4) var(--space-4) var(--space-3)',
          borderBottom: '1px solid var(--border-color)',
        }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 'var(--space-3)' }}>Messages</h3>
          <div style={{ position: 'relative' }}>
            <Search size={15} style={{
              position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)',
              color: 'var(--text-tertiary)',
            }} />
            <input
              type="text" placeholder="Search contacts..."
              value={search} onChange={e => setSearch(e.target.value)}
              style={{
                width: '100%', padding: '0.5rem 0.75rem 0.5rem 2rem',
                background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)', color: 'var(--text-primary)',
                fontSize: '0.8rem', outline: 'none',
              }}
            />
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {filteredContacts.map(c => {
            const active = activeContact?._id === c._id;
            return (
              <div key={c._id} onClick={() => setActiveContact(c)} style={{
                display: 'flex', alignItems: 'center', gap: 'var(--space-3)',
                padding: 'var(--space-3) var(--space-4)', cursor: 'pointer',
                background: active ? 'rgba(16, 185, 129, 0.08)' : 'transparent',
                borderLeft: active ? '3px solid var(--primary-500)' : '3px solid transparent',
                transition: 'all var(--transition-fast)',
              }}
              onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'var(--bg-tertiary)'; }}
              onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}
              >
                <div style={{ position: 'relative' }}>
                  <div style={{
                    width: '40px', height: '40px', borderRadius: '50%',
                    background: 'linear-gradient(135deg, var(--primary-600), var(--primary-800))',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', fontSize: '0.75rem', fontWeight: 700,
                  }}>
                    {getInitials(c.name || 'User')}
                  </div>
                  <div style={{
                    position: 'absolute', bottom: '0', right: '0',
                    width: '10px', height: '10px', borderRadius: '50%',
                    background: c.status === 'active' ? 'var(--success)' : 'var(--slate-500)',
                    border: '2px solid var(--bg-secondary)',
                  }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontWeight: 600, fontSize: '0.9rem' }}>{c.name}</p>
                  <p style={{
                    fontSize: '0.75rem', color: 'var(--text-tertiary)',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    textTransform: 'capitalize',
                  }}>
                    {c.role}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Chat Area */}
      {activeContact ? (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          {/* Chat header */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: 'var(--space-3) var(--space-5)',
            borderBottom: '1px solid var(--border-color)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
              <button className="chat-back-btn" style={{ display: 'none', color: 'var(--text-secondary)' }}
                onClick={() => setActiveContact(null)}>
                <ArrowLeft size={20} />
              </button>
              <div style={{
                width: '36px', height: '36px', borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--primary-600), var(--primary-800))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontSize: '0.7rem', fontWeight: 700,
              }}>
                {getInitials(activeContact.name || 'User')}
              </div>
              <div>
                <p style={{ fontWeight: 600, fontSize: '0.9rem' }}>{activeContact.name}</p>
                <p style={{ fontSize: '0.7rem', color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <span className="status-dot online" /> Online
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
              {[Phone, Video, MoreVertical].map((Icon, i) => (
                <button key={i} style={{
                  width: '32px', height: '32px', borderRadius: 'var(--radius-md)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--text-secondary)', transition: 'all var(--transition-fast)',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-tertiary)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                >
                  <Icon size={16} />
                </button>
              ))}
            </div>
          </div>

          {/* Messages */}
          <div style={{
            flex: 1, overflowY: 'auto', padding: 'var(--space-5)',
            display: 'flex', flexDirection: 'column', gap: 'var(--space-3)',
          }}>
            {activeMessages.map((msg) => {
              const rawSender = msg.senderId;
              const senderIdStr =
                rawSender && typeof rawSender === 'object' && rawSender._id != null
                  ? String(rawSender._id)
                  : String(rawSender ?? '');
              const isMine = senderIdStr === String(user?._id ?? '');
              return (
                <div key={msg._id || msg.messageId || `msg-${msg.createdAt}`} style={{
                  display: 'flex', justifyContent: isMine ? 'flex-end' : 'flex-start',
                  animation: 'fadeInUp 0.2s ease-out',
                }}>
                  <div style={{
                    maxWidth: '70%', padding: 'var(--space-3) var(--space-4)',
                    borderRadius: isMine
                      ? 'var(--radius-lg) var(--radius-lg) var(--radius-sm) var(--radius-lg)'
                      : 'var(--radius-lg) var(--radius-lg) var(--radius-lg) var(--radius-sm)',
                    background: isMine
                      ? 'linear-gradient(135deg, var(--primary-600), var(--primary-500))'
                      : 'var(--bg-tertiary)',
                    color: isMine ? '#fff' : 'var(--text-primary)',
                  }}>
                    <p style={{ fontSize: '0.875rem', lineHeight: 1.5 }}>{msg.text}</p>
                    <p style={{
                      fontSize: '0.65rem', marginTop: 'var(--space-1)',
                      opacity: 0.7, textAlign: 'right',
                    }}>
                      {formatTime(msg.createdAt || msg.timestamp)}
                    </p>
                  </div>
                </div>
              );
            })}

            {/* Typing indicator */}
            {typingStatus[activeContact._id] && (
              <div style={{
                display: 'flex', justifyContent: 'flex-start',
                animation: 'fadeIn 0.3s ease-out',
              }}>
                <div style={{
                  padding: 'var(--space-3) var(--space-4)',
                  borderRadius: 'var(--radius-lg) var(--radius-lg) var(--radius-lg) var(--radius-sm)',
                  background: 'var(--bg-tertiary)',
                  display: 'flex', gap: '4px', alignItems: 'center',
                }}>
                  {[0, 1, 2].map(i => (
                    <div key={i} style={{
                      width: '6px', height: '6px', borderRadius: '50%',
                      background: 'var(--text-tertiary)',
                      animation: `typing 1.4s infinite ${i * 0.2}s`,
                    }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div style={{
            padding: 'var(--space-3) var(--space-4)',
            borderTop: '1px solid var(--border-color)',
            display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
          }}>
            <button style={{ color: 'var(--text-tertiary)', display: 'flex' }}>
              <Paperclip size={18} />
            </button>
            <input
              type="text" placeholder="Type a message..."
              value={newMsg} onChange={handleChange}
              onKeyDown={handleKeyPress}
              style={{
                flex: 1, padding: '0.6rem 0.9rem',
                background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-full)', color: 'var(--text-primary)',
                fontSize: '0.875rem', outline: 'none',
                transition: 'border-color var(--transition-fast)',
              }}
              onFocus={e => e.currentTarget.style.borderColor = 'var(--primary-500)'}
              onBlur={e => e.currentTarget.style.borderColor = 'var(--border-color)'}
            />
            <button style={{ color: 'var(--text-tertiary)', display: 'flex' }}>
              <Smile size={18} />
            </button>
            <button onClick={handleSend} style={{
              width: '36px', height: '36px', borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--primary-600), var(--primary-500))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', transition: 'transform var(--transition-fast)',
              boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)',
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      ) : (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexDirection: 'column', gap: 'var(--space-4)', color: 'var(--text-tertiary)',
        }}>
          <Send size={48} style={{ opacity: 0.2 }} />
          <p>Select a conversation to start chatting</p>
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .chat-grid { grid-template-columns: 1fr !important; }
          .chat-contacts { display: ${activeContact ? 'none' : 'flex'} !important; }
          .chat-back-btn { display: flex !important; }
        }
      `}</style>
    </div>
  );
}
