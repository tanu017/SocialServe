import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { isAuthenticated, token } = useAuth();
  const socketRef = useRef(null);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (isAuthenticated && token) {
      const socket = io('/', {
        auth: { token: 'Bearer ' + token },
        transports: ['websocket'],
        reconnectionAttempts: 5
      });
      socketRef.current = socket;

      socket.on('connect', () => console.log('Socket connected:', socket.id));
      socket.on('connect_error', (err) => console.error('Socket error:', err.message));

      // Listen for new message notifications -> increment unreadCount
      socket.on('notification:newMessage', () => {
        setUnreadCount((prev) => prev + 1);
      });

      return () => {
        socket.disconnect();
        socketRef.current = null;
      };
    }

    if (!isAuthenticated && socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    return undefined;
  }, [isAuthenticated, token]);

  const value = {
    socket: socketRef.current,
    unreadCount,
    setUnreadCount,
    joinConversation: (id) => socketRef.current?.emit('join:conversation', id),
    leaveConversation: (id) => socketRef.current?.emit('leave:conversation', id),
    sendMessage: (conversationId, text, callback) =>
      socketRef.current?.emit('message:send', { conversationId, text }, callback),
    sendTyping: (conversationId, isTyping) =>
      socketRef.current?.emit('user:typing', { conversationId, isTyping }),
    markRead: (conversationId) =>
      socketRef.current?.emit('message:read', { conversationId })
  };

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
};

export const useSocket = () => useContext(SocketContext);
