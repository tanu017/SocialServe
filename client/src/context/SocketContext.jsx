import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { canUseMessagingAndPosting } from '../utils/verification';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { isAuthenticated, token, user } = useAuth();
  const socketRef = useRef(null);
  const [socket, setSocket] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const mayUseMessaging = canUseMessagingAndPosting(user);

  useEffect(() => {
    if (isAuthenticated && token && mayUseMessaging) {
      const socket = io('/', {
        auth: { token: 'Bearer ' + token },
        transports: ['websocket'],
        reconnectionAttempts: 5
      });
      socketRef.current = socket;

      socket.on('connect', () => {
        setSocket(socket);
        console.log('Socket connected:', socket.id);
      });
      socket.on('disconnect', () => {
        setSocket(null);
      });
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

    if ((!isAuthenticated || !mayUseMessaging) && socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      setSocket(null);
      setUnreadCount(0);
    }

    return undefined;
  }, [isAuthenticated, token, mayUseMessaging]);

  const value = {
    socket,
    unreadCount,
    setUnreadCount,
    joinConversation: (id) =>
      socketRef.current?.emit('join:conversation', id != null ? String(id) : id),
    leaveConversation: (id) =>
      socketRef.current?.emit('leave:conversation', id != null ? String(id) : id),
    sendMessage: (conversationId, text, callback) =>
      socketRef.current?.emit('message:send', { conversationId: String(conversationId), text }, callback),
    sendTyping: (conversationId, isTyping) =>
      socketRef.current?.emit('user:typing', {
        conversationId: conversationId != null ? String(conversationId) : conversationId,
        isTyping,
      }),
    markRead: (conversationId) =>
      socketRef.current?.emit('message:read', { conversationId: String(conversationId) })
  };

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
};

export const useSocket = () => useContext(SocketContext);
