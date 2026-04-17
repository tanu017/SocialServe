import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { format, isSameDay, isToday, isYesterday } from 'date-fns';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';

const getOtherParticipant = (conversation, currentUserId) => {
  const participants = Array.isArray(conversation?.participants) ? conversation.participants : [];
  const uid = currentUserId != null ? String(currentUserId) : '';
  return participants.find((participant) => String(participant?._id) !== uid) || participants[0];
};

const getInitials = (name = '') =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('') || '?';

const getMessagesFromResponse = (response) => {
  if (Array.isArray(response?.data?.data)) return response.data.data;
  if (Array.isArray(response?.data?.messages)) return response.data.messages;
  if (Array.isArray(response?.data)) return response.data;
  return [];
};

const getMessageDate = (message) => {
  const raw = message?.createdAt || message?.updatedAt;
  const date = raw ? new Date(raw) : null;
  return date && !Number.isNaN(date.getTime()) ? date : null;
};

const getPostMeta = (conversation) => {
  const rp = conversation?.relatedPost ?? conversation?.post;
  const typeRaw = conversation?.postType || '';
  const type = String(typeRaw).toLowerCase();
  const postType = type === 'donation' || type === 'need' ? type : null;

  let postId = conversation?.postId ?? null;
  let title = 'Related post';
  if (rp != null && typeof rp === 'object' && !Array.isArray(rp)) {
    postId = rp._id ?? postId;
    title = (rp.title || rp.name || '').trim() ? (rp.title || rp.name) : 'Related post';
  } else if (rp != null) {
    postId = rp;
  }

  return { postType, postId, title };
};

export default function ChatWindow({ conversation, onBack, currentUser }) {
  const { user } = useAuth();
  const resolvedUser = currentUser || user;
  const { socket, joinConversation, leaveConversation, sendTyping, markRead, setUnreadCount } =
    useSocket();

  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [typingUser, setTypingUser] = useState('');
  const [loading, setLoading] = useState(true);

  const bottomRef = useRef(null);
  const textareaRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const tempMessageIdRef = useRef(0);

  const currentUserId = resolvedUser?._id;
  const conversationId = conversation?._id;
  const otherParticipant = useMemo(
    () => getOtherParticipant(conversation, currentUserId),
    [conversation, currentUserId]
  );
  const postMeta = useMemo(() => getPostMeta(conversation), [conversation]);

  useEffect(() => {
    if (!conversationId) return undefined;

    const loadMessages = async () => {
      setLoading(true);
      try {
        const response = await api.get(`/conversations/${conversationId}/messages`);
        setMessages(getMessagesFromResponse(response));
      } catch (error) {
        console.error('Failed to load messages:', error);
        toast.error('Failed to load messages');
        setMessages([]);
      } finally {
        setLoading(false);
      }
    };

    loadMessages();
    joinConversation(conversationId);
    markRead(conversationId);
    setUnreadCount(0);

    return () => {
      leaveConversation(conversationId);
    };
  }, [conversationId, joinConversation, leaveConversation, markRead, setUnreadCount]);

  useEffect(() => {
    if (!socket) return undefined;

    const handleMessageReceive = (msg) => {
      const messageConversationId =
        typeof msg?.conversation === 'string'
          ? msg.conversation
          : msg?.conversation?._id || msg?.conversation?.toString?.() || null;
      if (
        messageConversationId &&
        String(messageConversationId) !== String(conversationId)
      ) {
        return;
      }

      setMessages((prev) => {
        const incomingId = msg?._id != null ? String(msg._id) : null;
        if (incomingId && prev.some((existing) => String(existing?._id) === incomingId)) {
          return prev;
        }
        return [...prev, msg];
      });
    };

    const handleTyping = ({ name, isTyping }) => {
      if (isTyping) {
        setTypingUser(name || 'Someone');
      } else {
        setTypingUser('');
      }
    };

    const handleReadAck = () => {
      // Optional read-by UI updates can be added here later.
    };

    socket.on('message:receive', handleMessageReceive);
    socket.on('user:typing', handleTyping);
    socket.on('message:readAck', handleReadAck);

    return () => {
      socket.off('message:receive', handleMessageReceive);
      socket.off('user:typing', handleTyping);
      socket.off('message:readAck', handleReadAck);
    };
  }, [socket, conversationId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingUser]);

  useEffect(
    () => () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    },
    []
  );

  const resizeTextarea = () => {
    if (!textareaRef.current) return;
    textareaRef.current.style.height = 'auto';
    const nextHeight = Math.min(textareaRef.current.scrollHeight, 96);
    textareaRef.current.style.height = `${nextHeight}px`;
  };

  const scheduleTypingStop = () => {
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      if (conversationId) {
        sendTyping(conversationId, false);
      }
    }, 1500);
  };

  const handleInputChange = (event) => {
    const value = event.target.value;
    setMessageText(value);
    resizeTextarea();

    if (conversationId) {
      sendTyping(conversationId, true);
      scheduleTypingStop();
    }
  };

  const handleSend = async () => {
    const text = messageText.trim();
    if (!text || !conversationId) return;

    const optimisticId = `temp-${Date.now()}-${tempMessageIdRef.current++}`;
    const optimisticMessage = {
      _id: optimisticId,
      conversation: conversationId,
      sender: { _id: currentUserId, name: resolvedUser?.name, avatar: resolvedUser?.avatar },
      text,
      createdAt: new Date().toISOString(),
      readBy: [currentUserId],
    };

    setMessages((prev) => [...prev, optimisticMessage]);
    setMessageText('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    sendTyping(conversationId, false);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    try {
      const { data: saved } = await api.post(`/conversations/${conversationId}/messages`, { text });
      setMessages((prev) => {
        const withoutTemp = prev.filter((m) => m._id !== optimisticId);
        const savedId = saved?._id != null ? String(saved._id) : null;
        const deduped = savedId
          ? withoutTemp.filter((m) => String(m?._id) !== savedId)
          : withoutTemp;
        return [...deduped, saved];
      });
    } catch (error) {
      setMessages((prev) => prev.filter((msg) => msg._id !== optimisticId));
      const msg =
        error.response?.data?.message ||
        error.response?.data?.error ||
        'Failed to send message';
      toast.error(typeof msg === 'string' ? msg : 'Failed to send message');
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  const formatSeparator = (date) => {
    if (isToday(date)) return 'Today';
    if (isYesterday(date)) return 'Yesterday';
    return format(date, 'MMM d, yyyy');
  };

  const getMessageSenderId = (message) => {
    if (typeof message?.sender === 'string') return message.sender;
    return message?.sender?._id;
  };

  if (!conversationId) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-gray-500">
        Select a conversation to start chatting.
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center gap-3 border-b border-gray-200 bg-white px-4 py-3">
        <button
          type="button"
          onClick={onBack}
          className="rounded-md p-1 text-gray-600 hover:bg-gray-100 md:hidden"
          aria-label="Go back"
        >
          &lt;
        </button>

        {otherParticipant?.avatar ? (
          <img
            src={otherParticipant.avatar}
            alt={otherParticipant?.name || 'User'}
            className="h-10 w-10 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-sm font-semibold text-green-800">
            {getInitials(otherParticipant?.name || 'Unknown User')}
          </div>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h2 className="truncate text-sm font-semibold text-gray-900">
              {otherParticipant?.name || 'Unknown User'}
            </h2>
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-gray-600">
              {otherParticipant?.role === 'receiver' ? 'receiver' : 'donator'}
            </span>
          </div>
        </div>

        {postMeta.postType && postMeta.postId ? (
          <Link
            to={`/posts/${postMeta.postType}/${postMeta.postId}`}
            className="max-w-48 truncate rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700 hover:bg-green-100"
            title={`Re: ${postMeta.title}`}
          >
            Re: {postMeta.title}
          </Link>
        ) : null}
      </header>

      <div className="flex flex-1 flex-col gap-2 overflow-y-auto px-4 py-4">
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-green-600" />
          </div>
        ) : !messages.length ? (
          <p className="text-center text-sm text-gray-500">No messages yet. Say hello!</p>
        ) : (
          messages.map((message, index) => {
            const date = getMessageDate(message);
            const previousDate = getMessageDate(messages[index - 1]);
            const showSeparator =
              !!date && (!previousDate || !isSameDay(date, previousDate));
            const isOwn =
              String(getMessageSenderId(message) ?? '') === String(currentUserId ?? '');

            return (
              <div key={message._id || `${message.text}-${index}`}>
                {showSeparator ? (
                  <div className="my-2 flex justify-center">
                    <span className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-500">
                      {formatSeparator(date)}
                    </span>
                  </div>
                ) : null}

                <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                  <div className="max-w-xs md:max-w-sm">
                    <div
                      className={`rounded-2xl px-4 py-2 ${
                        isOwn
                          ? 'rounded-tr-sm bg-green-600 text-white'
                          : 'rounded-tl-sm bg-gray-100 text-gray-900'
                      }`}
                    >
                      <p className="whitespace-pre-wrap break-words text-sm">{message.text}</p>
                    </div>
                    <p className="mt-1 text-xs text-gray-400">
                      {date ? format(date, 'h:mm a') : ''}
                    </p>
                  </div>
                </div>
              </div>
            );
          })
        )}

        {typingUser ? (
          <div className="self-start rounded-xl bg-gray-100 px-3 py-1 text-xs italic text-gray-500">
            {typingUser} is typing...
          </div>
        ) : null}

        <div ref={bottomRef} />
      </div>

      <div className="border-t border-gray-200 bg-white px-4 py-3">
        <div className="flex items-end">
          <textarea
            ref={textareaRef}
            rows={1}
            value={messageText}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="max-h-24 min-h-[40px] flex-1 resize-none rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:border-green-500"
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={!messageText.trim()}
            className="ml-2 rounded-xl bg-green-600 px-4 py-2 text-white disabled:cursor-not-allowed disabled:bg-green-300"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
