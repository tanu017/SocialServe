import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { getDonations, getNeeds, helpNeed, needDonation } from '../../services/postService';
import { useAuth } from '../../context/AuthContext';
import { canUseMessagingAndPosting } from '../../utils/verification';
import PostGrid from '../../components/posts/PostGrid';

const PROFILE_POST_LIMIT = 12;

const roleLabelMap = {
  donator: 'Donator',
  receiver: 'Receiver',
  admin: 'NGO'
};

const formatDate = (value) => {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return 'Unknown';
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(date);
};

const getInitials = (name = '') => {
  const initials = String(name)
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('');
  return initials || 'U';
};

export default function PublicProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id || id === 'undefined') {
      setLoading(false);
      setProfile(null);
      setPosts([]);
      return;
    }

    const loadProfile = async () => {
      try {
        setLoading(true);

        const profileResponse = await api.get(`/users/${id}`);
        const userData = profileResponse?.data?.data || null;
        setProfile(userData);

        if (!userData) {
          setPosts([]);
          return;
        }

        const listResponse =
          userData.role === 'donator'
            ? await getDonations({ donatorId: id, limit: PROFILE_POST_LIMIT, page: 1 })
            : await getNeeds({ receiverId: id, limit: PROFILE_POST_LIMIT, page: 1 });

        const listData = listResponse?.data?.data || {};
        const nextPosts = Array.isArray(listData?.posts) ? listData.posts : [];
        setPosts(nextPosts);
      } catch (error) {
        console.error('Failed to load public profile:', error);
        toast.error(error?.response?.data?.message || 'Failed to load profile');
        setProfile(null);
        setPosts([]);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [id]);

  const handleNeed = async (postId) => {
    if (!isAuthenticated) {
      toast.error('Please log in to request a donation.');
      navigate('/login');
      return;
    }
    if (!canUseMessagingAndPosting(user)) {
      toast.error('Your account must be verified before you can request donations.');
      navigate('/account/pending-verification');
      return;
    }

    try {
      const response = await needDonation(postId);
      const conversationId = response?.data?.data?.conversationId || response?.data?.conversationId;
      toast.success('Conversation started! Check your messages.');
      navigate(`/dashboard/receiver/messages/${conversationId}`);
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to request donation');
    }
  };

  const handleHelp = async (postId) => {
    if (!isAuthenticated) {
      toast.error('Please log in to offer help.');
      navigate('/login');
      return;
    }
    if (!canUseMessagingAndPosting(user)) {
      toast.error('Your account must be verified before you can offer help.');
      navigate('/account/pending-verification');
      return;
    }

    try {
      const response = await helpNeed(postId);
      const conversationId = response?.data?.data?.conversationId || response?.data?.conversationId;
      toast.success('You offered to help! Check your messages.');
      navigate(`/dashboard/donator/messages/${conversationId}`);
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to offer help');
    }
  };

  const roleLabel = useMemo(() => {
    if (!profile?.role) return 'Member';
    if (profile.role === 'receiver' && profile.organizationName) return 'NGO';
    return roleLabelMap[profile.role] || 'Member';
  }, [profile]);

  const isDonatorProfile = profile?.role === 'donator';

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        {loading ? (
          <div className="space-y-4 animate-pulse">
            <div className="h-6 w-48 rounded bg-gray-200" />
            <div className="h-4 w-72 rounded bg-gray-100" />
            <div className="h-4 w-56 rounded bg-gray-100" />
          </div>
        ) : !profile ? (
          <p className="text-sm text-gray-500">Profile not found.</p>
        ) : (
          <div className="flex flex-col gap-6 sm:flex-row">
            {profile?.avatar ? (
              <img src={profile.avatar} alt={profile.name || 'User'} className="h-24 w-24 rounded-full object-cover" />
            ) : (
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-green-100 text-3xl font-semibold text-green-700">
                {getInitials(profile?.name)}
              </div>
            )}

            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold text-gray-900">{profile?.name || 'User'}</h1>
                {profile?.isVerified ? (
                  <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-700">
                    ✓ Verified
                  </span>
                ) : null}
                <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-700">
                  {roleLabel}
                </span>
              </div>

              <p className="mt-3 text-sm text-gray-600">{profile?.bio || 'No bio added yet.'}</p>
              <p className="mt-2 text-sm text-gray-600">Member since {formatDate(profile?.createdAt)}</p>

              {profile?.website ? (
                <p className="mt-1 text-sm">
                  <a
                    href={profile.website}
                    target="_blank"
                    rel="noreferrer"
                    className="text-green-700 hover:text-green-800 hover:underline"
                  >
                    {profile.website}
                  </a>
                </p>
              ) : null}

              {profile?.role === 'receiver' ? (
                <div className="mt-2 text-sm text-gray-600">
                  <p>Organization: {profile?.organizationName || '—'}</p>
                  <p>Contact Person: {profile?.contactPerson || '—'}</p>
                </div>
              ) : null}
            </div>
          </div>
        )}
      </div>

      {!loading && profile ? (
        <section className="mt-8">
          <h2 className="mb-4 text-xl font-semibold text-gray-900">
            {isDonatorProfile ? `Donations by ${profile.name}` : `Needs posted by ${profile.name}`}
          </h2>
          <PostGrid
            posts={posts.slice(0, PROFILE_POST_LIMIT)}
            type={isDonatorProfile ? 'donation' : 'need'}
            loading={false}
            onCTAClick={isDonatorProfile ? handleNeed : handleHelp}
          />
        </section>
      ) : null}
    </div>
  );
}
