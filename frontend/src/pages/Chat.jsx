import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useChat } from '../hooks/useChat';
import { PageLoader } from '../components/ui/Spinner';
import {
  Send, Search, Smile, Paperclip, MoreVertical,
  Phone, Video, ArrowLeft, MessageSquare,
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
    <>
      <style>{`
        .chat-page-wrapper {
          display: flex;
          flex-direction: column;
          padding: 1.5rem;
          height: calc(100vh - 64px - 3rem);
          min-height: 500px;
          box-sizing: border-box;
        }
        .chat-grid {
          display: grid;
          grid-template-columns: 300px 1fr;
          flex: 1;
          overflow: hidden;
          border-radius: 1rem;
          border: 1px solid hsl(var(--border));
          background: hsl(var(--card));
          box-shadow: 0 2px 8px hsl(var(--primary) / 0.05);
          min-height: 0;
        }
        .chat-sidebar {
          border-right: 1px solid hsl(var(--border));
          display: flex;
          flex-direction: column;
          background: hsl(var(--card));
          overflow: hidden;
        }
        .chat-sidebar-header {
          padding: 1rem 1rem 0.75rem;
          border-bottom: 1px solid hsl(var(--border));
          flex-shrink: 0;
        }
        .chat-search-input {
          width: 100%;
          padding: 0.45rem 0.75rem 0.45rem 2rem;
          background: hsl(var(--muted));
          border: 1px solid hsl(var(--border));
          border-radius: 0.5rem;
          color: hsl(var(--foreground));
          font-size: 0.8rem;
          outline: none;
          font-family: inherit;
          transition: border-color 0.2s;
        }
        .chat-search-input:focus {
          border-color: hsl(var(--primary));
        }
        .chat-contacts-list {
          flex: 1;
          overflow-y: auto;
        }
        .chat-contact-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem 1rem;
          cursor: pointer;
          transition: background 0.15s;
          border-left: 3px solid transparent;
        }
        .chat-contact-item:hover {
          background: hsl(var(--muted));
        }
        .chat-contact-item.active {
          background: hsl(var(--primary) / 0.08);
          border-left-color: hsl(var(--primary));
        }
        .chat-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: hsl(var(--primary));
          display: flex;
          align-items: center;
          justify-content: center;
          color: hsl(var(--primary-fg));
          font-size: 0.75rem;
          font-weight: 700;
          flex-shrink: 0;
          position: relative;
        }
        .chat-avatar-sm {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: hsl(var(--primary));
          display: flex;
          align-items: center;
          justify-content: center;
          color: hsl(var(--primary-fg));
          font-size: 0.7rem;
          font-weight: 700;
          flex-shrink: 0;
        }
        .status-dot {
          position: absolute;
          bottom: 0;
          right: 0;
          width: 10px;
          height: 10px;
          border-radius: 50%;
          border: 2px solid hsl(var(--card));
        }
        .status-dot.online { background: #22c55e; }
        .status-dot.offline { background: #94a3b8; }
        .chat-panel {
          display: flex;
          flex-direction: column;
          height: 100%;
          background: hsl(var(--background));
          overflow: hidden;
        }
        .chat-panel-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.75rem 1.25rem;
          border-bottom: 1px solid hsl(var(--border));
          flex-shrink: 0;
          background: hsl(var(--card));
        }
        .chat-messages-area {
          flex: 1;
          overflow-y: auto;
          padding: 1.25rem;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        .chat-input-bar {
          padding: 0.75rem 1rem;
          border-top: 1px solid hsl(var(--border));
          display: flex;
          align-items: center;
          gap: 0.5rem;
          flex-shrink: 0;
          background: hsl(var(--card));
        }
        .chat-input {
          flex: 1;
          padding: 0.55rem 0.9rem;
          background: hsl(var(--muted));
          border: 1.5px solid hsl(var(--border));
          border-radius: 9999px;
          color: hsl(var(--foreground));
          font-size: 0.875rem;
          outline: none;
          font-family: inherit;
          transition: border-color 0.2s;
        }
        .chat-input:focus {
          border-color: hsl(var(--primary));
        }
        .chat-send-btn {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: hsl(var(--primary));
          display: flex;
          align-items: center;
          justify-content: center;
          color: hsl(var(--primary-fg));
          cursor: pointer;
          transition: transform 0.15s, opacity 0.15s;
          flex-shrink: 0;
          border: none;
          box-shadow: 0 2px 8px hsl(var(--primary) / 0.3);
        }
        .chat-send-btn:hover { transform: scale(1.07); }
        .chat-send-btn:active { transform: scale(0.95); }
        .chat-icon-btn {
          width: 32px;
          height: 32px;
          border-radius: 0.5rem;
          display: flex;
          align-items: center;
          justify-content: center;
          color: hsl(var(--muted-fg));
          border: none;
          background: none;
          cursor: pointer;
          transition: background 0.15s, color 0.15s;
        }
        .chat-icon-btn:hover {
          background: hsl(var(--muted));
          color: hsl(var(--foreground));
        }
        .msg-bubble {
          max-width: 70%;
          padding: 0.625rem 0.875rem;
          animation: fadeInUp 0.2s ease-out;
        }
        .msg-bubble.mine {
          border-radius: 1rem 1rem 0.25rem 1rem;
          background: hsl(var(--primary));
          color: hsl(var(--primary-fg));
          align-self: flex-end;
        }
        .msg-bubble.theirs {
          border-radius: 1rem 1rem 1rem 0.25rem;
          background: hsl(var(--muted));
          color: hsl(var(--foreground));
          align-self: flex-start;
        }
        .msg-time {
          font-size: 0.65rem;
          opacity: 0.65;
          text-align: right;
          margin-top: 0.2rem;
        }
        .typing-bubble {
          display: flex;
          gap: 4px;
          align-items: center;
          padding: 0.625rem 0.875rem;
          border-radius: 1rem 1rem 1rem 0.25rem;
          background: hsl(var(--muted));
          align-self: flex-start;
          animation: fadeIn 0.3s ease-out;
        }
        .typing-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: hsl(var(--muted-fg));
        }
        @keyframes typing {
          0%, 100% { opacity: 0.3; transform: translateY(0); }
          50% { opacity: 1; transform: translateY(-4px); }
        }
        .typing-dot:nth-child(1) { animation: typing 1.4s infinite 0s; }
        .typing-dot:nth-child(2) { animation: typing 1.4s infinite 0.2s; }
        .typing-dot:nth-child(3) { animation: typing 1.4s infinite 0.4s; }
        .chat-empty {
          display: flex;
          align-items: center;
          justify-content: center;
          flex-direction: column;
          gap: 1rem;
          color: hsl(var(--muted-fg));
          height: 100%;
        }
        @media (max-width: 768px) {
          .chat-page-wrapper { padding: 0; height: calc(100vh - 64px); }
          .chat-grid { border-radius: 0; border-left: none; border-right: none; }
          .chat-sidebar { display: ${activeContact ? 'none' : 'flex'} !important; }
          .chat-grid { grid-template-columns: 1fr !important; }
          .chat-back-btn { display: flex !important; }
        }
      `}</style>

      <div className="chat-page-wrapper">
        <div className="chat-grid">
          {/* ── Sidebar: Contacts ── */}
          <div className="chat-sidebar">
            <div className="chat-sidebar-header">
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.65rem', color: 'hsl(var(--foreground))' }}>
                Messages
              </h3>
              <div style={{ position: 'relative' }}>
                <Search size={14} style={{
                  position: 'absolute', left: '0.6rem', top: '50%', transform: 'translateY(-50%)',
                  color: 'hsl(var(--muted-fg))',
                }} />
                <input
                  type="text"
                  placeholder="Search contacts..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="chat-search-input"
                />
              </div>
            </div>

            <div className="chat-contacts-list">
              {filteredContacts.length === 0 ? (
                <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'hsl(var(--muted-fg))', fontSize: '0.85rem' }}>
                  No contacts found
                </div>
              ) : (
                filteredContacts.map(c => (
                  <div
                    key={c._id}
                    className={`chat-contact-item ${activeContact?._id === c._id ? 'active' : ''}`}
                    onClick={() => setActiveContact(c)}
                  >
                    <div className="chat-avatar">
                      {getInitials(c.name || 'User')}
                      <span className={`status-dot ${c.status === 'active' ? 'online' : 'offline'}`} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontWeight: 600, fontSize: '0.875rem', color: 'hsl(var(--foreground))' }}>{c.name}</p>
                      <p style={{
                        fontSize: '0.75rem', color: 'hsl(var(--muted-fg))',
                        textTransform: 'capitalize',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        {c.role}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* ── Chat Panel ── */}
          {activeContact ? (
            <div className="chat-panel">
              {/* Header */}
              <div className="chat-panel-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <button
                    className="chat-back-btn chat-icon-btn"
                    style={{ display: 'none' }}
                    onClick={() => setActiveContact(null)}
                  >
                    <ArrowLeft size={20} />
                  </button>
                  <div className="chat-avatar-sm">{getInitials(activeContact.name || 'User')}</div>
                  <div>
                    <p style={{ fontWeight: 600, fontSize: '0.9rem', color: 'hsl(var(--foreground))' }}>
                      {activeContact.name}
                    </p>
                    <p style={{ fontSize: '0.7rem', color: '#22c55e', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
                      Online
                    </p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.25rem' }}>
                  {[Phone, Video, MoreVertical].map((Icon, i) => (
                    <button key={i} className="chat-icon-btn">
                      <Icon size={16} />
                    </button>
                  ))}
                </div>
              </div>

              {/* Messages */}
              <div className="chat-messages-area">
                {activeMessages.length === 0 ? (
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '0.5rem', color: 'hsl(var(--muted-fg))' }}>
                    <MessageSquare size={32} style={{ opacity: 0.3 }} />
                    <p style={{ fontSize: '0.85rem' }}>No messages yet. Say hi!</p>
                  </div>
                ) : (
                  activeMessages.map((msg) => {
                    const rawSender = msg.senderId;
                    const senderIdStr =
                      rawSender && typeof rawSender === 'object' && rawSender._id != null
                        ? String(rawSender._id)
                        : String(rawSender ?? '');
                    const isMine = senderIdStr === String(user?._id ?? '');
                    return (
                      <div
                        key={msg._id || msg.messageId || `msg-${msg.createdAt}`}
                        className={`msg-bubble ${isMine ? 'mine' : 'theirs'}`}
                      >
                        <p style={{ fontSize: '0.875rem', lineHeight: 1.5 }}>{msg.text}</p>
                        <p className="msg-time">
                          {formatTime(msg.createdAt || msg.timestamp)}
                        </p>
                      </div>
                    );
                  })
                )}

                {/* Typing indicator */}
                {typingStatus[activeContact._id] && (
                  <div className="typing-bubble">
                    <div className="typing-dot" />
                    <div className="typing-dot" />
                    <div className="typing-dot" />
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Bar */}
              <div className="chat-input-bar">
                <button className="chat-icon-btn" style={{ color: 'hsl(var(--muted-fg))' }}>
                  <Paperclip size={18} />
                </button>
                <input
                  type="text"
                  placeholder="Type a message..."
                  value={newMsg}
                  onChange={handleChange}
                  onKeyDown={handleKeyPress}
                  className="chat-input"
                />
                <button className="chat-icon-btn" style={{ color: 'hsl(var(--muted-fg))' }}>
                  <Smile size={18} />
                </button>
                <button onClick={handleSend} className="chat-send-btn" disabled={!newMsg.trim()}>
                  <Send size={16} />
                </button>
              </div>
            </div>
          ) : (
            <div className="chat-empty">
              <div style={{
                width: 64, height: 64, borderRadius: '50%',
                background: 'hsl(var(--muted))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <MessageSquare size={28} style={{ opacity: 0.4, color: 'hsl(var(--primary))' }} />
              </div>
              <p style={{ fontWeight: 600, fontSize: '1rem', color: 'hsl(var(--foreground))' }}>
                Your Messages
              </p>
              <p style={{ fontSize: '0.85rem', textAlign: 'center', maxWidth: 220 }}>
                Select a conversation from the left to start chatting
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
