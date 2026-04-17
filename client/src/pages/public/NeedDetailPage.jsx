import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getNeedById, helpNeed } from '../../services/postService';
import { useAuth } from '../../context/AuthContext';
import { formatDistanceToNow } from 'date-fns';

const NeedDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [loadingRequest, setLoadingRequest] = useState(false);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        setLoading(true);
        const response = await getNeedById(id);
        setPost(response.data.data || response.data);
        setError(null);
      } catch (err) {
        setError('Failed to load need details');
        toast.error(err?.response?.data?.message || 'Failed to load need details');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [id]);

  const handleHelp = async () => {
    if (!isAuthenticated) {
      toast.error('Please log in to offer help.');
      navigate('/login');
      return;
    }
    if (user?.role !== 'donator') {
      toast.error('Only donators can offer help.');
      return;
    }
    try {
      setLoadingRequest(true);
      const response = await helpNeed(id);
      const conversationId = response.data?.data?.conversationId || response.data?.conversationId;
      toast.success('You offered to help! Check your messages.');
      navigate(`/dashboard/donator/messages/${conversationId}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to offer help');
      console.error(err);
    } finally {
      setLoadingRequest(false);
    }
  };

  const handleLoginRedirect = () => {
    toast.error('Please log in to offer help.');
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="text-center py-12">
          <p className="text-red-600 text-lg">{error || 'Post not found'}</p>
        </div>
      </div>
    );
  }

  const {
    title = '',
    description = '',
    category = 'General',
    urgency = 'medium',
    quantityNeeded = 0,
    unit = 'pcs',
    images = [],
    receiver = {},
    location = {},
    status = 'open',
    tags = [],
    createdAt = new Date(),
  } = post;

  const receiverName = receiver?.name || 'Anonymous';
  const isVerified = receiver?.isVerified || false;
  const receiverBio = receiver?.bio || 'No bio provided';

  // Color maps
  const urgencyColorMap = {
    critical: { bg: 'bg-red-100', text: 'text-red-800', label: 'Critical' },
    high: { bg: 'bg-orange-100', text: 'text-orange-800', label: 'High' },
    medium: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Medium' },
    low: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Low' },
  };

  const statusColorMap = {
    open: { bg: 'bg-green-100', text: 'text-green-800', label: 'Open' },
    partially_fulfilled: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Partially Fulfilled' },
    fulfilled: { bg: 'bg-purple-100', text: 'text-purple-800', label: 'Fulfilled' },
    closed: { bg: 'bg-red-100', text: 'text-red-800', label: 'Closed' },
  };

  const urgencyColor = urgencyColorMap[urgency] || urgencyColorMap.medium;
  const statusColor = statusColorMap[status] || statusColorMap.open;

  // Determine CTA button state
  const isDonator = isAuthenticated && user?.role === 'donator';
  const isReceiver = isAuthenticated && user?.role === 'receiver';
  const isCTADisabled = !isDonator && isAuthenticated;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Image Gallery and Receiver Info */}
        <div className="lg:col-span-2">
          {/* Image Gallery */}
          <div className="bg-white rounded-xl overflow-hidden border border-gray-200">
            {/* Main Image */}
            <div className="bg-gray-100 h-96 flex items-center justify-center overflow-hidden">
              {images && images.length > 0 ? (
                <img
                  src={images[selectedImageIndex]}
                  alt={title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-gray-400 text-center">
                  <div className="text-4xl mb-2">🤝</div>
                  <p>No image available</p>
                </div>
              )}
            </div>

            {/* Thumbnails */}
            {images && images.length > 1 && (
              <div className="p-4 bg-white border-t border-gray-200 flex gap-2 overflow-x-auto">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImageIndex(idx)}
                    className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                      idx === selectedImageIndex
                        ? 'border-blue-600'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <img
                      src={img}
                      alt={`Thumbnail ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Receiver Info Card */}
          <div className="mt-6 bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-start gap-4">
              {/* Avatar */}
              <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white text-lg font-bold flex-shrink-0">
                {receiverName.charAt(0).toUpperCase()}
              </div>

              {/* Receiver Details */}
              <div className="flex-grow">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-lg font-bold text-gray-900">{receiverName}</h3>
                  {isVerified && (
                    <span className="inline-block bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full font-medium flex items-center gap-1">
                      ✓ Verified
                    </span>
                  )}
                </div>

                <p className="text-gray-600 text-sm mb-4 line-clamp-2">{receiverBio}</p>

                <button
                  onClick={() => navigate(`/profile/${receiver._id}`)}
                  className="text-blue-600 hover:text-blue-700 font-medium text-sm underline"
                >
                  View Profile
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Details Sidebar */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 space-y-4">
            {/* Title */}
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
            </div>

            {/* Badges Row */}
            <div className="flex flex-wrap gap-2">
              <span className="inline-block bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full font-medium capitalize">
                {category}
              </span>
              <span
                className={`inline-block text-sm px-3 py-1 rounded-full font-medium capitalize ${urgencyColor.bg} ${urgencyColor.text}`}
              >
                {urgencyColor.label}
              </span>
            </div>

            {/* Quantity */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <p className="text-lg font-semibold text-gray-900">
                Needed: {quantityNeeded} {unit}
              </p>
            </div>

            {/* Location */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h3 className="font-semibold text-gray-900 mb-2">Location</h3>
              <div className="space-y-1 text-gray-700">
                <p className="text-sm">{location.city}, {location.state}</p>
                {location.pincode && <p className="text-sm text-gray-500">{location.pincode}</p>}
              </div>
            </div>

            {/* Status Badge */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <span
                className={`inline-block text-sm px-3 py-1 rounded-full font-medium capitalize ${statusColor.bg} ${statusColor.text}`}
              >
                {statusColor.label}
              </span>
            </div>

            {/* Tags */}
            {tags && tags.length > 0 && (
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="inline-block bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Posted Date */}
            <div className="text-sm text-gray-500 text-center">
              Posted {formatDistanceToNow(new Date(createdAt), { addSuffix: true })}
            </div>

            {/* CTA Button */}
            {!isAuthenticated ? (
              <button
                onClick={handleLoginRedirect}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl text-lg font-semibold transition-colors"
              >
                Login to Help
              </button>
            ) : isCTADisabled ? (
              <div className="relative group">
                <button
                  disabled
                  className="w-full bg-gray-400 text-white py-3 rounded-xl text-lg font-semibold cursor-not-allowed opacity-60"
                >
                  I Can Help
                </button>
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-sm rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  Only donators can offer help
                </div>
              </div>
            ) : (
              <button
                onClick={handleHelp}
                disabled={loadingRequest}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl text-lg font-semibold transition-colors disabled:opacity-60"
              >
                {loadingRequest ? 'Processing...' : 'I Can Help'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Description Section */}
      <div className="mt-8 bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">About This Need</h2>
        <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{description}</p>
      </div>
    </div>
  );
};

export default NeedDetailPage;
