import { createContext, useState, useCallback, useEffect } from 'react';
import { chatAPI, adminAPI } from '../services/api';
import { socketService } from '../services/socket';
import { useNotification } from '../hooks/useNotification';
import { useAuth } from '../hooks/useAuth';

export const ChatContext = createContext(null);

export function ChatProvider({ children }) {
  const { user } = useAuth();
  const { error } = useNotification();
  
  const [contacts, setContacts] = useState([]);
  const [messages, setMessages] = useState({}); // { [contactId]: [message1, message2] }
  const [activeContact, setActiveContact] = useState(null);
  const [typingStatus, setTypingStatus] = useState({}); // { [userId]: boolean }

  // ─── HTTP Fills ────────────────────────────────────────────────────────────
  
  const fetchContacts = useCallback(async () => {
    try {
      if (user?.role === 'admin') {
        const res = await adminAPI.getUsers({ limit: 100 });
        if (res.success) {
          const uid = user?._id != null ? String(user._id) : '';
          setContacts(
            res.data.users
              .filter((u) => String(u._id) !== uid)
              .map((u) => ({
                _id: String(u._id),
                name: u.name,
                role: u.role,
                status: u.isActive ? 'active' : 'inactive',
              }))
          );
        }
      } else {
        const res = await chatAPI.getContacts();
        if (res.success) {
          setContacts(res.data.conversations.map(c => ({
            _id: String(c._id),
            name: c.user?.name,
            role: c.user?.role,
            status: c.user?.isActive ? 'active' : 'inactive',
            lastMessage: c.lastMessage
          })));
        }
      }
    } catch (err) {
      console.error('Failed to fetch chat contacts', err);
    }
  }, [user]);

  const fetchMessages = useCallback(async (contactId) => {
    if (!contactId) return;
    try {
      const res = await chatAPI.getMessages(contactId);
      if (res.success) {
        setMessages(prev => ({
          ...prev,
          [contactId]: res.data.messages || []
        }));
      }
    } catch (err) {
      error('Failed to fetch messages: ' + err);
    }
  }, [error]);

  // ─── Actions ───────────────────────────────────────────────────────────────

  const sendMessage = async (receiverId, text) => {
    // 1. Optimistic Update
    const tempId = 'temp_' + Date.now();
    const tempMessage = {
      _id: tempId,
      senderId: user?._id,
      receiverId,
      text,
      status: 'sent',
      createdAt: new Date().toISOString()
    };

    setMessages(prev => ({
      ...prev,
      [receiverId]: [...(prev[receiverId] || []), tempMessage]
    }));

    try {
      // 2. API Call
      const res = await chatAPI.sendMessage(receiverId, text);
      if (res.success) {
        const saved = res.data.message;
        const normalized = saved
          ? {
              ...saved,
              _id: saved._id,
              senderId: saved.senderId?._id != null ? String(saved.senderId._id) : String(saved.senderId),
              receiverId: saved.receiverId?._id != null ? String(saved.receiverId._id) : String(saved.receiverId),
            }
          : null;
        setMessages((prev) => ({
          ...prev,
          [receiverId]: prev[receiverId].map((m) =>
            m._id === tempId && normalized ? normalized : m
          ),
        }));
      }
    } catch (err) {
      error('Failed to send message: ' + err);
      // Remove failed message from UI
      setMessages(prev => ({
        ...prev,
        [receiverId]: prev[receiverId].filter(m => m._id !== tempId)
      }));
    }
  };

  const notifyTyping = (receiverId, isTyping) => {
    if (isTyping) {
      socketService.emit('chat:typing', { receiverId });
    } else {
      socketService.emit('chat:stop-typing', { receiverId });
    }
  };

  // ─── Socket Subscriptions ──────────────────────────────────────────────────
  useEffect(() => {
    if (!user) return;

    const handleMessageReceived = (raw) => {
      const msg = {
        ...raw,
        _id: raw._id ?? raw.messageId,
        senderId: raw.senderId != null ? String(raw.senderId) : raw.senderId,
        receiverId: raw.receiverId != null ? String(raw.receiverId) : raw.receiverId,
      };
      const uid = String(user._id);
      const sid = String(msg.senderId);
      const contactId = sid === uid && msg.receiverId ? String(msg.receiverId) : sid;

      setMessages((prev) => {
        const list = prev[contactId] || [];
        const mid = msg._id != null ? String(msg._id) : null;
        if (mid && list.some((m) => String(m._id) === mid)) return prev;
        return { ...prev, [contactId]: [...list, msg] };
      });
    };

    const handleTyping = ({ senderId }) => {
      setTypingStatus(prev => ({ ...prev, [senderId]: true }));
    };

    const handleStopTyping = ({ senderId }) => {
      setTypingStatus(prev => ({ ...prev, [senderId]: false }));
    };

    socketService.on('message:received', handleMessageReceived);
    socketService.on('chat:typing', handleTyping);
    socketService.on('chat:stop-typing', handleStopTyping);

    return () => {
      socketService.off('message:received', handleMessageReceived);
      socketService.off('chat:typing', handleTyping);
      socketService.off('chat:stop-typing', handleStopTyping);
    };
  }, [user]);

  return (
    <ChatContext.Provider value={{
      contacts,
      messages,
      activeContact,
      typingStatus,
      setActiveContact,
      fetchContacts,
      fetchMessages,
      sendMessage,
      notifyTyping,
    }}>
      {children}
    </ChatContext.Provider>
  );
}
