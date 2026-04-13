import { createContext, useState, useCallback, useContext } from 'react';

export const ChatContext = createContext(null);

export function ChatProvider({ children }) {
  const [messages, setMessages] = useState([
    { id: 1, sender: 'System', text: '👋 Welcome to NourishHub Chat! Connect with donors, volunteers & NGOs.', time: new Date().toLocaleTimeString(), role: 'system' },
  ]);
  const [activeRoom, setActiveRoom] = useState('general');

  const sendMessage = useCallback((text, user) => {
    if (!text.trim()) return;
    const msg = {
      id: Date.now(),
      sender: user?.name || 'Anonymous',
      text: text.trim(),
      time: new Date().toLocaleTimeString(),
      role: user?.role || 'user',
    };
    setMessages(prev => [...prev, msg]);
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return (
    <ChatContext.Provider value={{
      messages,
      activeRoom,
      setActiveRoom,
      sendMessage,
      clearMessages,
    }}>
      {children}
    </ChatContext.Provider>
  );
}
