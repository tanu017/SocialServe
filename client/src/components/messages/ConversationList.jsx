import { useCallback, useEffect, useMemo, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';

const getResponseData = (response) => {
  if (Array.isArray(response?.data?.data)) return response.data.data;
  if (Array.isArray(response?.data)) return response.data;
  return [];
};

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

const getPostType = (conversation) => {
  const rawType =
    conversation?.postType ||
    conversation?.relatedPostType ||
    conversation?.post?.type ||
    conversation?.relatedPost?.type ||
    '';
  const normalized = String(rawType).toLowerCase();
  return normalized === 'donation' || normalized === 'need' ? normalized : '';
};

const getRelatedPostTitle = (conversation) => {
  const rp = conversation?.relatedPost;
  if (rp && typeof rp === 'object' && rp.title) return String(rp.title).trim();
  return '';
};

const getLastMessagePreview = (conversation) => {
  if (conversation?.lastMessage) return conversation.lastMessage;
  if (conversation?.latestMessage?.text) return conversation.latestMessage.text;
  if (conversation?.messages?.length) {
    const latest = conversation.messages[conversation.messages.length - 1];
    return latest?.text || 'No messages yet';
  }
  return 'No messages yet';
};

const getConversationTime = (conversation) => {
  const rawTime =
    conversation?.lastMessageAt ||
    conversation?.updatedAt ||
    conversation?.createdAt ||
    null;
  if (!rawTime) return '';

  const time = new Date(rawTime);
  if (Number.isNaN(time.getTime())) return '';
  return formatDistanceToNow(time, { addSuffix: true });
};

const getUnreadCount = (conversation, currentUserId, fallback = 0) => {
  if (Array.isArray(conversation?.messages)) {
    return conversation.messages.reduce((count, message) => {
      const readBy = Array.isArray(message?.readBy) ? message.readBy : [];
      const hasRead = readBy.some((entry) => {
        if (typeof entry === 'string') return entry === currentUserId;
        return entry?._id === currentUserId;
      });
      return hasRead ? count : count + 1;
    }, 0);
  }

  if (typeof conversation?.unreadCount === 'number') {
    return conversation.unreadCount;
  }

  return fallback;
};

export default function ConversationList({ selectedId, onSelect }) {
  const { user } = useAuth();
  const { socket } = useSocket();
  const currentUserId = user?._id;

  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fallbackUnread, setFallbackUnread] = useState({});

  const fetchConversations = useCallback(async () => {
    try {
      const response = await api.get('/conversations');
      setConversations(getResponseData(response));
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
      setConversations([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  useEffect(() => {
    if (!socket) return undefined;

    const handleNotification = (payload) => {
      if (payload?.conversationId) {
        setFallbackUnread((prev) => ({
          ...prev,
          [payload.conversationId]: (prev[payload.conversationId] || 0) + 1
        }));
      }
      fetchConversations();
    };

    socket.on('notification:newMessage', handleNotification);
    return () => socket.off('notification:newMessage', handleNotification);
  }, [socket, fetchConversations]);

  const normalizedConversations = useMemo(
    () => conversations.filter((conversation) => conversation?._id),
    [conversations]
  );

  if (loading) {
    return (
      <aside className="h-full w-80 overflow-y-auto border-r border-gray-200">
        <h2 className="px-4 pt-4 pb-2 text-lg font-semibold">Messages</h2>
        <div className="space-y-2 px-4 pb-4">
          {[1, 2, 3].map((item) => (
            <div key={item} className="animate-pulse rounded-md border border-gray-100 p-3">
              <div className="mb-2 h-3 w-2/3 rounded bg-gray-200" />
              <div className="h-2 w-full rounded bg-gray-100" />
            </div>
          ))}
        </div>
      </aside>
    );
  }

  return (
    <aside className="h-full w-80 overflow-y-auto border-r border-gray-200">
      <h2 className="px-4 pt-4 pb-2 text-lg font-semibold">Messages</h2>

      {!normalizedConversations.length ? (
        <p className="px-4 py-4 text-sm text-gray-500">
          No conversations yet. Browse donations or needs to start chatting.
        </p>
      ) : (
        normalizedConversations.map((conversation) => {
          const conversationId = conversation._id;
          const otherParticipant = getOtherParticipant(conversation, currentUserId);
          const name = otherParticipant?.name || 'Unknown User';
          const avatar = otherParticipant?.avatar;
          const unreadCount = getUnreadCount(
            conversation,
            currentUserId,
            fallbackUnread[conversationId] || 0
          );
          const isSelected = selectedId === conversationId;
          const postType = getPostType(conversation);
          const relatedTitle = getRelatedPostTitle(conversation);
          const time = getConversationTime(conversation);
          const preview = getLastMessagePreview(conversation);

          return (
            <button
              key={conversationId}
              type="button"
              onClick={() => onSelect?.(conversation)}
              className={`flex w-full cursor-pointer items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 ${
                isSelected ? 'border-l-2 border-green-500 bg-green-50' : ''
              }`}
            >
              {avatar ? (
                <img src={avatar} alt={name} className="h-10 w-10 rounded-full object-cover" />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-sm font-semibold text-green-800">
                  {getInitials(name)}
                </div>
              )}

              <div className="min-w-0 flex-1">
                <div className="mb-1 flex items-center justify-between gap-2">
                  <p className="truncate text-sm font-medium text-gray-900">{name}</p>
                  {time ? <span className="text-xs text-gray-400">{time}</span> : null}
                </div>
                {relatedTitle ? (
                  <p
                    className="mb-1 truncate text-[11px] text-gray-500"
                    title={`Re: ${relatedTitle}`}
                  >
                    Re: {relatedTitle}
                  </p>
                ) : null}
                <div className="flex items-center gap-2">
                  <p className="truncate text-xs text-gray-500">{preview}</p>
                  {postType ? (
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                        postType === 'donation'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-orange-100 text-orange-700'
                      }`}
                    >
                      {postType}
                    </span>
                  ) : null}
                </div>
              </div>

              {unreadCount > 0 ? (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-green-500 px-1.5 text-[10px] font-semibold text-white">
                  {unreadCount}
                </span>
              ) : null}
            </button>
          );
        })
      )}
    </aside>
  );
}
