import { useEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import DashboardLayout from '../../components/common/DashboardLayout';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { getMe, uploadAvatar } from '../../services/authService';
import { getDonatorSidebarLinks, getReceiverSidebarLinks } from '../../config/dashboardNav';

const AVATAR_ACCEPT = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_AVATAR_BYTES = 5 * 1024 * 1024;

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
  const { user, updateProfile, applyUser } = useAuth();
  const { unreadCount } = useSocket();
  const [formData, setFormData] = useState(() => mapUserToForm(user));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const avatarInputRef = useRef(null);

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

  const processAvatarFile = async (file) => {
    if (!file) return;
    if (!AVATAR_ACCEPT.includes(file.type)) {
      toast.error('Please use a JPEG, PNG, or WebP image.');
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      toast.error('Image must be 5MB or smaller.');
      return;
    }
    setAvatarUploading(true);
    try {
      const res = await uploadAvatar(file);
      const payload = res?.data?.data ?? res?.data;
      const nextUser = payload?.user ?? payload;
      if (nextUser?._id) {
        applyUser(nextUser);
        setFormData((prev) => ({ ...prev, avatar: nextUser.avatar || '' }));
      }
      toast.success('Profile photo updated.');
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Upload failed.';
      toast.error(msg);
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleAvatarDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer?.files?.[0];
    if (file) processAvatarFile(file);
  };

  const handleRemoveAvatar = async () => {
    if (!formData.avatar) return;
    setAvatarUploading(true);
    try {
      await updateProfile({ avatar: '' });
      setFormData((prev) => ({ ...prev, avatar: '' }));
      toast.success('Profile photo removed.');
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Could not remove photo.';
      toast.error(msg);
    } finally {
      setAvatarUploading(false);
    }
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
        avatar: formData.avatar || '',
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
            <p className="mb-2 text-sm font-medium text-gray-700">Profile photo</p>
            <p className="mb-2 text-xs text-gray-500">One image — JPEG, PNG, or WebP, up to 5MB.</p>
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleAvatarDrop}
              className={`rounded-lg border-2 border-dashed p-6 text-center ${
                isDragging ? 'border-green-400 bg-green-50' : 'border-gray-300'
              } ${avatarUploading ? 'pointer-events-none opacity-60' : ''}`}
            >
              <p className="mb-3 text-sm text-gray-600">
                Drag and drop an image here, or click to browse
              </p>
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                disabled={avatarUploading}
                className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {avatarUploading ? 'Uploading…' : 'Browse image'}
              </button>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) processAvatarFile(file);
                  e.target.value = '';
                }}
                disabled={avatarUploading}
              />
            </div>
            {formData.avatar ? (
              <div className="mt-4 flex flex-wrap items-center gap-4">
                <img
                  src={formData.avatar}
                  alt="Profile preview"
                  className="h-24 w-24 rounded-lg border border-gray-200 object-cover"
                />
                <button
                  type="button"
                  onClick={handleRemoveAvatar}
                  disabled={avatarUploading}
                  className="text-sm font-medium text-red-600 hover:text-red-700 disabled:opacity-50"
                >
                  Remove photo
                </button>
              </div>
            ) : null}
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
