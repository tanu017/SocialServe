import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import DashboardLayout from '../../components/common/DashboardLayout';
import ConversationList from '../../components/messages/ConversationList';
import ChatWindow from '../../components/messages/ChatWindow';
import api from '../../services/api';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import { getDonatorSidebarLinks } from '../../config/dashboardNav';

const getConversationsFromResponse = (response) => {
  if (Array.isArray(response?.data?.data)) return response.data.data;
  if (Array.isArray(response?.data)) return response.data;
  return [];
};

export default function DonatorInboxPage() {
  const navigate = useNavigate();
  const { conversationId } = useParams();
  const { unreadCount } = useSocket();
  const { user } = useAuth();

  const [selectedConversation, setSelectedConversation] = useState(null);

  const sidebarLinks = useMemo(() => getDonatorSidebarLinks(unreadCount), [unreadCount]);

  useEffect(() => {
    if (!conversationId) return;

    const selectFromRoute = async () => {
      try {
        const response = await api.get('/conversations');
        const conversations = getConversationsFromResponse(response);
        const matched = conversations.find((conversation) => conversation?._id === conversationId);
        if (matched) {
          setSelectedConversation(matched);
        }
      } catch (error) {
        console.error('Failed to auto-select conversation:', error);
      }
    };

    selectFromRoute();
  }, [conversationId]);

  const handleSelectConversation = (conversation) => {
    setSelectedConversation(conversation);
    if (conversation?._id) {
      navigate(`/dashboard/donator/messages/${conversation._id}`);
    }
  };

  const handleBackToList = () => {
    setSelectedConversation(null);
    navigate('/dashboard/donator/messages');
  };

  return (
    <DashboardLayout sidebarLinks={sidebarLinks} pageTitle="Messages">
      <div className="h-[calc(100vh-140px)] overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div className="hidden h-full md:flex md:flex-row">
          <div className="w-80 shrink-0 border-r border-gray-200">
            <ConversationList selectedId={selectedConversation?._id} onSelect={handleSelectConversation} />
          </div>
          <div className="flex-1">
            {selectedConversation ? (
              <ChatWindow conversation={selectedConversation} onBack={handleBackToList} currentUser={user} />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-gray-500">
                Select a conversation to start chatting
              </div>
            )}
          </div>
        </div>

        <div className="h-full md:hidden">
          {!selectedConversation ? (
            <ConversationList selectedId={selectedConversation?._id} onSelect={handleSelectConversation} />
          ) : (
            <ChatWindow conversation={selectedConversation} onBack={handleBackToList} currentUser={user} />
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
