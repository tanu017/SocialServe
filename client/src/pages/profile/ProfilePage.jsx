import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import DashboardLayout from '../../components/common/DashboardLayout';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { getMe } from '../../services/authService';
import { getDonatorSidebarLinks, getReceiverSidebarLinks } from '../../config/dashboardNav';

const emptyAddress = () => ({
  street: '',
  city: '',
  state: '',
  pincode: '',
  country: '',
});

function mapUserToForm(u) {
  if (!u) {
    return {
      name: '',
      email: '',
      phone: '',
      bio: '',
      organizationName: '',
      contactPerson: '',
      website: '',
      avatar: '',
      address: emptyAddress(),
    };
  }
  return {
    name: u.name || '',
    email: u.email || '',
    phone: u.phone || '',
    bio: u.bio || '',
    organizationName: u.organizationName || '',
    contactPerson: u.contactPerson || '',
    website: u.website || '',
    avatar: u.avatar || '',
    address: { ...emptyAddress(), ...(u.address || {}) },
  };
}

const inputClass =
  'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-green-500';

export default function ProfilePage() {
  const { user, updateProfile } = useAuth();
  const { unreadCount } = useSocket();
  const [formData, setFormData] = useState(() => mapUserToForm(user));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const sidebarLinks = useMemo(() => {
    if (user?.role === 'receiver') return getReceiverSidebarLinks(unreadCount);
    return getDonatorSidebarLinks(unreadCount);
  }, [user?.role, unreadCount]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await getMe();
        const payload = res?.data?.data ?? res?.data;
        const u = payload?.user ?? payload;
        if (!cancelled && u?._id) {
          setFormData(mapUserToForm(u));
        }
      } catch {
        if (!cancelled && user) {
          setFormData(mapUserToForm(user));
        }
        toast.error('Could not refresh profile from server.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddressChange = (e) => {
    const { name, value } = e.target;
    const field = name.replace('address.', '');
    setFormData((prev) => ({
      ...prev,
      address: { ...prev.address, [field]: value },
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name?.trim()) {
      toast.error('Name is required.');
      return;
    }
    setSaving(true);
    try {
      await updateProfile({
        name: formData.name.trim(),
        phone: formData.phone,
        bio: formData.bio,
        organizationName: formData.organizationName,
        contactPerson: formData.contactPerson,
        website: formData.website,
        avatar: formData.avatar,
        address: formData.address,
      });
      toast.success('Profile saved.');
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Could not save profile.';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout sidebarLinks={sidebarLinks} pageTitle="Profile">
        <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-gray-500">Loading profile…</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout sidebarLinks={sidebarLinks} pageTitle="Profile">
      <div className="mx-auto max-w-3xl">
        <p className="mb-6 text-sm text-gray-600">
          Update your public information. Your email is tied to your account and cannot be changed here.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div>
            <label htmlFor="name" className="mb-1 block text-sm font-medium text-gray-700">
              Full name <span className="text-red-500">*</span>
            </label>
            <input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={inputClass}
              required
              autoComplete="name"
            />
          </div>

          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              readOnly
              disabled
              className={`${inputClass} cursor-not-allowed bg-gray-100 text-gray-600`}
            />
          </div>

          <div>
            <label htmlFor="phone" className="mb-1 block text-sm font-medium text-gray-700">
              Phone
            </label>
            <input
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className={inputClass}
              autoComplete="tel"
            />
          </div>

          <div>
            <label htmlFor="bio" className="mb-1 block text-sm font-medium text-gray-700">
              About you
            </label>
            <textarea
              id="bio"
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              rows={4}
              maxLength={500}
              placeholder="Tell others about yourself or your organization — what you donate, what you need, or how you help."
              className={`${inputClass} resize-y min-h-[100px]`}
            />
            <p className="mt-1 text-xs text-gray-400">{formData.bio?.length || 0} / 500</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="organizationName" className="mb-1 block text-sm font-medium text-gray-700">
                Organization name
              </label>
              <input
                id="organizationName"
                name="organizationName"
                value={formData.organizationName}
                onChange={handleChange}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="contactPerson" className="mb-1 block text-sm font-medium text-gray-700">
                Contact person
              </label>
              <input
                id="contactPerson"
                name="contactPerson"
                value={formData.contactPerson}
                onChange={handleChange}
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label htmlFor="website" className="mb-1 block text-sm font-medium text-gray-700">
              Website
            </label>
            <input
              id="website"
              name="website"
              type="url"
              value={formData.website}
              onChange={handleChange}
              placeholder="https://"
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="avatar" className="mb-1 block text-sm font-medium text-gray-700">
              Profile photo URL
            </label>
            <input
              id="avatar"
              name="avatar"
              type="url"
              value={formData.avatar}
              onChange={handleChange}
              placeholder="https://…"
              className={inputClass}
            />
          </div>

          <div>
            <p className="mb-2 text-sm font-medium text-gray-700">Address</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <input
                  name="address.street"
                  value={formData.address.street}
                  onChange={handleAddressChange}
                  placeholder="Street"
                  className={inputClass}
                />
              </div>
              <input
                name="address.city"
                value={formData.address.city}
                onChange={handleAddressChange}
                placeholder="City"
                className={inputClass}
              />
              <input
                name="address.state"
                value={formData.address.state}
                onChange={handleAddressChange}
                placeholder="State / region"
                className={inputClass}
              />
              <input
                name="address.pincode"
                value={formData.address.pincode}
                onChange={handleAddressChange}
                placeholder="PIN / ZIP"
                className={inputClass}
              />
              <input
                name="address.country"
                value={formData.address.country}
                onChange={handleAddressChange}
                placeholder="Country"
                className={inputClass}
              />
            </div>
          </div>

          <div className="flex justify-end border-t border-gray-100 pt-4">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-green-600 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:opacity-60"
            >
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
