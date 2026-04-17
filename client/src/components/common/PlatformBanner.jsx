import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getPublicPlatform } from '../../services/platformService';

export default function PlatformBanner() {
  const { user, loading: authLoading } = useAuth();
  const [publicInfo, setPublicInfo] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const res = await getPublicPlatform();
        const data = res?.data?.data ?? res?.data;
        if (!cancelled) {
          setPublicInfo(data || null);
        }
      } catch {
        if (!cancelled) {
          setPublicInfo(null);
        }
      }
    };

    load();
    const id = window.setInterval(load, 60_000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, []);

  if (authLoading || !publicInfo) {
    return null;
  }

  const isAdmin = user?.role === 'admin';
  const maintenance = publicInfo.maintenanceMode && !isAdmin;
  const announcement =
    publicInfo.announcementEnabled && (publicInfo.announcementMessage || '').trim().length > 0;

  if (!maintenance && !announcement) {
    return null;
  }

  return (
    <div className="flex w-full flex-col">
      {maintenance && (
        <div
          className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-center text-sm text-amber-950"
          role="status"
        >
          The platform is in maintenance. Log in as an admin to manage the site; most actions are
          temporarily unavailable.
        </div>
      )}
      {announcement && (
        <div
          className="border-b border-emerald-200 bg-emerald-50 px-4 py-2 text-center text-sm text-emerald-950"
          role="status"
        >
          {publicInfo.announcementMessage.trim()}
        </div>
      )}
    </div>
  );
}
