import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import PostGrid from '../../components/posts/PostGrid';
import { getDonations, getNeeds, needDonation } from '../../services/postService';

export default function HomePage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  
  const [donations, setDonations] = useState([]);
  const [needs, setNeeds] = useState([]);
  const [loadingDonations, setLoadingDonations] = useState(true);
  const [loadingNeeds, setLoadingNeeds] = useState(true);

  // Fetch featured donations and needs on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoadingDonations(true);
        const donationsRes = await getDonations({ page: 1, limit: 6 });
        setDonations(donationsRes.data.data || donationsRes.data);
      } catch (error) {
        console.error('Error fetching donations:', error);
      } finally {
        setLoadingDonations(false);
      }

      try {
        setLoadingNeeds(true);
        const needsRes = await getNeeds({ page: 1, limit: 3 });
        setNeeds(needsRes.data.data || needsRes.data);
      } catch (error) {
        console.error('Error fetching needs:', error);
      } finally {
        setLoadingNeeds(false);
      }
    };

    fetchData();
  }, []);

  // Handle donation CTA click
  const handleDonationCTA = (donationId) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    
    needDonation(donationId)
      .then(() => {
        // Show success message or navigate to detail page
        navigate(`/donation/${donationId}`);
      })
      .catch((error) => {
        console.error('Error requesting donation:', error);
      });
  };

  return (
    <div className="w-full">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-green-50 to-teal-50 py-20 px-6 text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
          Give What You Have. Get What You Need.
        </h1>
        <p className="text-xl text-gray-600 mt-4 mb-8">
          SocialServe connects donors with those in need — one item at a time.
        </p>
        
        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
          <button
            onClick={() => navigate('/browse/donations')}
            className="bg-green-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-green-700 transition-colors"
          >
            Browse Donations
          </button>
          <button
            onClick={() => navigate('/register')}
            className="border-2 border-green-600 text-green-600 px-8 py-3 rounded-lg font-medium hover:bg-green-50 transition-colors"
          >
            Post a Need
          </button>
        </div>

        {/* Trust Text */}
        <p className="text-sm text-gray-600">
          Free to join. No commission. 100% community-driven.
        </p>
      </section>

      {/* Stats Row */}
      <section className="bg-white py-10">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Stat Card 1 */}
            <div className="text-center">
              <p className="text-3xl font-bold text-green-600">1,200+</p>
              <p className="text-gray-500 text-sm mt-2">Donations Posted</p>
            </div>

            {/* Stat Card 2 */}
            <div className="text-center">
              <p className="text-3xl font-bold text-green-600">850+</p>
              <p className="text-gray-500 text-sm mt-2">Needs Fulfilled</p>
            </div>

            {/* Stat Card 3 */}
            <div className="text-center">
              <p className="text-3xl font-bold text-green-600">3,000+</p>
              <p className="text-gray-500 text-sm mt-2">Members</p>
            </div>

            {/* Stat Card 4 */}
            <div className="text-center">
              <p className="text-3xl font-bold text-green-600">42</p>
              <p className="text-gray-500 text-sm mt-2">Cities</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Donations Section */}
      <section className="py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold text-gray-800">Recent Donations</h2>
            <a
              href="/browse/donations"
              className="text-green-600 hover:text-green-700 font-medium text-sm"
            >
              View All →
            </a>
          </div>
          <PostGrid
            posts={donations}
            type="donation"
            loading={loadingDonations}
            onCTAClick={handleDonationCTA}
          />
        </div>
      </section>

      {/* Featured Needs Section */}
      <section className="py-12 px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold text-gray-800">Recent Needs</h2>
            <a
              href="/browse/needs"
              className="text-green-600 hover:text-green-700 font-medium text-sm"
            >
              View All →
            </a>
          </div>
          <PostGrid
            posts={needs}
            type="need"
            loading={loadingNeeds}
            onCTAClick={() => {}} // Needs don't have CTA in this context
          />
        </div>
      </section>

      {/* Footer */}
      <footer className="text-center text-gray-400 text-sm py-8">
        SocialServe © 2026 — Connecting communities.
      </footer>
    </div>
  );
}
