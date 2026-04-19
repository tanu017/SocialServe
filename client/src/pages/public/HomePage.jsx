import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { canUseMessagingAndPosting } from '../../utils/verification';
import PostGrid from '../../components/posts/PostGrid';
import { getDonations, getNeeds, needDonation, helpNeed } from '../../services/postService';

function IconJoin() {
  return (
    <svg className="h-7 w-7 text-green-800" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
    </svg>
  );
}

function IconBrowse() {
  return (
    <svg className="h-7 w-7 text-green-800" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
    </svg>
  );
}

function IconConnect() {
  return (
    <svg className="h-7 w-7 text-green-800" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 0 1-.825-.242m9.345-8.334a2.126 2.126 0 0 0-.476-.095 48.64 48.64 0 0 0-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0 0 11.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
    </svg>
  );
}

function IconHeartOutline() {
  return (
    <svg className="mt-0.5 h-5 w-5 shrink-0 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
    </svg>
  );
}

export default function HomePage() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const verified = canUseMessagingAndPosting(user);
  
  const [donations, setDonations] = useState([]);
  const [needs, setNeeds] = useState([]);
  const [loadingDonations, setLoadingDonations] = useState(true);
  const [loadingNeeds, setLoadingNeeds] = useState(true);

  // Fetch featured donations and needs on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoadingDonations(true);
        const res = await getDonations({ page: 1, limit: 6 });
        const responseData = res?.data || {};
        const data = responseData?.data || {};
        const donations = data?.posts || responseData?.donations || responseData || [];
        setDonations(Array.isArray(donations) ? donations : []);
      } catch (error) {
        console.error('Error fetching donations:', error);
        setDonations([]);
      } finally {
        setLoadingDonations(false);
      }

      try {
        setLoadingNeeds(true);
        const res = await getNeeds({ page: 1, limit: 3 });
        const responseData = res?.data || {};
        const data = responseData?.data || {};
        const needs = data?.posts || responseData?.needs || responseData || [];
        setNeeds(Array.isArray(needs) ? needs : []);
      } catch (error) {
        console.error('Error fetching needs:', error);
        setNeeds([]);
      } finally {
        setLoadingNeeds(false);
      }
    };

    fetchData();
  }, []);

  // Handle donation CTA click
  const handleDonationCTA = async (donationId) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (!verified) {
      navigate('/account/pending-verification');
      return;
    }

    try {
      const response = await needDonation(donationId);
      const conversationId = response.data?.data?.conversationId || response.data?.conversationId;
      navigate(`/dashboard/receiver/messages/${conversationId}`);
    } catch (error) {
      console.error('Error requesting donation:', error);
    }
  };

  const handleNeedCTA = async (needId) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (!verified) {
      navigate('/account/pending-verification');
      return;
    }

    try {
      const response = await helpNeed(needId);
      const conversationId = response.data?.data?.conversationId || response.data?.conversationId;
      navigate(`/dashboard/donator/messages/${conversationId}`);
    } catch (error) {
      console.error('Error offering help:', error);
    }
  };

  return (
    <div className="w-full">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-green-50 to-teal-50 py-20 px-6 text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
          Give What You Have. Get What You Need.
        </h1>
        <p className="text-xl text-gray-600 mt-4 mb-10">
          SocialServe connects donors with those in need — one item at a time.
        </p>

        {/* CTAs: discover (browse) + share (create) */}
        <div className="mx-auto mb-6 max-w-xl space-y-9 sm:max-w-2xl sm:space-y-10">
          <div>
            <p className="mb-4 text-xs font-semibold uppercase tracking-normal text-green-800/80 sm:mb-5">
              Discover
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
              <button
                type="button"
                onClick={() => navigate('/browse/donations')}
                className="rounded-lg bg-green-600 px-6 py-3 text-center text-sm font-medium text-white shadow-sm transition-colors hover:bg-green-700 sm:text-base"
              >
                Browse Donations
              </button>
              <button
                type="button"
                onClick={() => navigate('/browse/needs')}
                className="rounded-lg bg-green-600 px-6 py-3 text-center text-sm font-medium text-white shadow-sm transition-colors hover:bg-green-700 sm:text-base"
              >
                Browse Needs
              </button>
            </div>
          </div>
          <div>
            <p className="mb-4 text-xs font-semibold uppercase tracking-normal text-green-800/80 sm:mb-5">
              Share
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
              <button
                type="button"
                onClick={() =>
                  !isAuthenticated
                    ? navigate('/login')
                    : verified
                      ? navigate('/dashboard/donator/posts/new')
                      : navigate('/account/pending-verification')
                }
                className="rounded-lg border-2 border-green-600 bg-white px-6 py-3 text-center text-sm font-medium text-green-600 transition-colors hover:bg-green-50 sm:text-base"
              >
                Post a Donation
              </button>
              <button
                type="button"
                onClick={() =>
                  !isAuthenticated
                    ? navigate('/login')
                    : verified
                      ? navigate('/dashboard/receiver/needs/new')
                      : navigate('/account/pending-verification')
                }
                className="rounded-lg border-2 border-green-600 bg-white px-6 py-3 text-center text-sm font-medium text-green-600 transition-colors hover:bg-green-50 sm:text-base"
              >
                Post a Need
              </button>
            </div>
          </div>
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

      {/* How it works */}
      <section className="bg-white py-16 px-6 border-t border-gray-100">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-center text-3xl font-bold text-gray-900 mb-4">How It Works</h2>
          <p className="text-center text-gray-600 max-w-2xl mx-auto mb-12">
            Get started in three simple steps — whether you are giving items away or asking for support.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm hover:shadow-md transition-shadow">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-amber-50">
                <IconJoin />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Join the Community</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Register as a donor to list items you can give, or as a receiver to request what you need from people nearby.
              </p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm hover:shadow-md transition-shadow">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-50">
                <IconBrowse />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Share &amp; Browse</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Post donations or needs, then browse what others are offering or looking for in your area.
              </p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm hover:shadow-md transition-shadow">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-orange-50">
                <IconConnect />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Connect &amp; Help</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Use in-app messaging to coordinate pickup or delivery and make a tangible difference for someone in your community.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Mission / story */}
      <section className="bg-stone-50 py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Making a Difference Together</h2>
              <p className="text-gray-600 leading-relaxed mb-8">
                SocialServe is more than a listings site — it is a community of people who believe practical help should be
                easy to give and dignified to receive. Whether you are clearing out gently used items or navigating a tough
                season, we connect you with neighbors who want to help.
              </p>
              <ul className="space-y-4">
                <li className="flex gap-3 text-gray-700">
                  <IconHeartOutline />
                  <span>Safe, profile-based connections built around trust and clarity.</span>
                </li>
                <li className="flex gap-3 text-gray-700">
                  <IconHeartOutline />
                  <span>Direct messaging between givers and receivers — no middleman fees.</span>
                </li>
                <li className="flex gap-3 text-gray-700">
                  <IconHeartOutline />
                  <span>Less waste going to landfill, more resources reaching people who need them.</span>
                </li>
              </ul>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:gap-4 items-stretch">
              <div className="overflow-hidden rounded-2xl shadow-md h-[min(52vw,22rem)] sm:h-[min(48vw,26rem)]">
                <img
                  src="/images/mission-volunteers-boxes.jpg"
                  alt="Volunteers sorting donated food and supplies"
                  className="h-full w-full object-cover"
                  loading="lazy"
                  decoding="async"
                />
              </div>
              <div className="overflow-hidden rounded-2xl shadow-md h-[min(52vw,22rem)] sm:h-[min(48vw,26rem)]">
                <img
                  src="/images/mission-community-help.jpg"
                  alt="Community members with hands together in support"
                  className="h-full w-full object-cover"
                  loading="lazy"
                  decoding="async"
                />
              </div>
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
            onCTAClick={handleNeedCTA}
          />
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white py-12 px-6">
        <div className="max-w-6xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <svg className="h-6 w-6 text-green-600" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
            <span className="text-xl font-bold text-gray-900">SocialServe</span>
          </div>
          <p className="text-gray-500 text-sm max-w-md mx-auto mb-6">
            Building stronger communities through generosity and practical support.
          </p>
          <p className="text-gray-400 text-xs">© {new Date().getFullYear()} SocialServe. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
