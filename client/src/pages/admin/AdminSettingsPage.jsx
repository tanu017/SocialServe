import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import AdminLayout from './AdminLayout';
import api from '../../services/api';
import { changePassword } from '../../services/authService';

const defaultPlatform = {
  maintenanceMode: false,
  allowRegistration: true,
  allowNewDonationPosts: true,
  allowNewNeedPosts: true,
  announcementEnabled: false,
  announcementMessage: '',
};

function ToggleRow({ id, label, description, checked, disabled, onChange }) {
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-gray-100 bg-gray-50/80 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <label htmlFor={id} className="text-sm font-medium text-gray-900">
          {label}
        </label>
        {description && <p className="mt-0.5 text-xs text-gray-500">{description}</p>}
      </div>
      <button
        type="button"
        id={id}
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
          checked ? 'bg-emerald-600' : 'bg-gray-200'
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
            checked ? 'translate-x-5' : 'translate-x-0.5'
          }`}
        />
      </button>
    </div>
  );
}

export default function AdminSettingsPage() {
  const [platform, setPlatform] = useState(defaultPlatform);
  const [platformLoading, setPlatformLoading] = useState(true);
  const [platformSaving, setPlatformSaving] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwSubmitting, setPwSubmitting] = useState(false);

  const loadPlatform = useCallback(async () => {
    try {
      setPlatformLoading(true);
      const response = await api.get('/admin/platform-settings');
      const raw = response?.data?.data?.settings ?? response?.data?.settings;
      if (raw && typeof raw === 'object') {
        setPlatform({
          maintenanceMode: Boolean(raw.maintenanceMode),
          allowRegistration: raw.allowRegistration !== false,
          allowNewDonationPosts: raw.allowNewDonationPosts !== false,
          allowNewNeedPosts: raw.allowNewNeedPosts !== false,
          announcementEnabled: Boolean(raw.announcementEnabled),
          announcementMessage: typeof raw.announcementMessage === 'string' ? raw.announcementMessage : '',
        });
      }
    } catch (error) {
      console.error('Failed to load platform settings:', error);
      toast.error(error?.response?.data?.message || 'Failed to load platform settings');
    } finally {
      setPlatformLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPlatform();
  }, [loadPlatform]);

  const savePlatform = async () => {
    try {
      setPlatformSaving(true);
      await api.put('/admin/platform-settings', {
        maintenanceMode: platform.maintenanceMode,
        allowRegistration: platform.allowRegistration,
        allowNewDonationPosts: platform.allowNewDonationPosts,
        allowNewNeedPosts: platform.allowNewNeedPosts,
        announcementEnabled: platform.announcementEnabled,
        announcementMessage: platform.announcementMessage,
      });
      toast.success('Platform settings saved');
      await loadPlatform();
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to save platform settings');
    } finally {
      setPlatformSaving(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) {
      toast.error('Enter your current password and a new password');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('New password and confirmation do not match');
      return;
    }

    try {
      setPwSubmitting(true);
      await changePassword({ currentPassword, newPassword });
      toast.success('Password updated');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      const msg = error?.response?.data?.message || 'Could not update password';
      toast.error(msg);
    } finally {
      setPwSubmitting(false);
    }
  };

  return (
    <AdminLayout pageTitle="Settings">
      <div className="mx-auto flex max-w-3xl flex-col gap-8">
        <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">Security</h2>
          <p className="mt-1 text-sm text-gray-500">Update the password for your admin account.</p>

          <form onSubmit={handlePasswordSubmit} className="mt-6 space-y-4">
            <div>
              <label htmlFor="current-password" className="block text-sm font-medium text-gray-700">
                Current password
              </label>
              <input
                id="current-password"
                type="password"
                autoComplete="current-password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label htmlFor="new-password" className="block text-sm font-medium text-gray-700">
                New password
              </label>
              <input
                id="new-password"
                type="password"
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700">
                Confirm new password
              </label>
              <input
                id="confirm-password"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <button
              type="submit"
              disabled={pwSubmitting}
              className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {pwSubmitting ? 'Updating…' : 'Change password'}
            </button>
          </form>
        </section>

        <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Platform</h2>
              <p className="text-sm text-gray-500">
                Control site-wide behavior. Changes apply immediately after saving.
              </p>
            </div>
            <button
              type="button"
              onClick={savePlatform}
              disabled={platformLoading || platformSaving}
              className="mt-3 w-full rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60 sm:mt-0 sm:w-auto"
            >
              {platformSaving ? 'Saving…' : 'Save platform settings'}
            </button>
          </div>

          {platformLoading ? (
            <p className="mt-6 text-sm text-gray-500">Loading settings…</p>
          ) : (
            <div className="mt-6 space-y-3">
              <ToggleRow
                id="toggle-maintenance"
                label="Maintenance mode"
                description="Visitors and signed-in non-admins cannot use the API except login and this public banner. Admins keep full access."
                checked={platform.maintenanceMode}
                disabled={platformSaving}
                onChange={(next) => setPlatform((p) => ({ ...p, maintenanceMode: next }))}
              />
              <ToggleRow
                id="toggle-register"
                label="Allow new registrations"
                description="When off, the register API returns an error for new accounts."
                checked={platform.allowRegistration}
                disabled={platformSaving}
                onChange={(next) => setPlatform((p) => ({ ...p, allowRegistration: next }))}
              />
              <ToggleRow
                id="toggle-donations"
                label="Allow new donation posts"
                description="When off, donators cannot create new donation listings."
                checked={platform.allowNewDonationPosts}
                disabled={platformSaving}
                onChange={(next) => setPlatform((p) => ({ ...p, allowNewDonationPosts: next }))}
              />
              <ToggleRow
                id="toggle-needs"
                label="Allow new need posts"
                description="When off, receivers cannot create new need listings."
                checked={platform.allowNewNeedPosts}
                disabled={platformSaving}
                onChange={(next) => setPlatform((p) => ({ ...p, allowNewNeedPosts: next }))}
              />
              <ToggleRow
                id="toggle-announce"
                label="Show site-wide announcement"
                description="Displays a green banner at the top for all visitors (below the maintenance notice if both are on)."
                checked={platform.announcementEnabled}
                disabled={platformSaving}
                onChange={(next) => setPlatform((p) => ({ ...p, announcementEnabled: next }))}
              />
              <div>
                <label htmlFor="announcement-text" className="block text-sm font-medium text-gray-700">
                  Announcement message
                </label>
                <textarea
                  id="announcement-text"
                  rows={3}
                  maxLength={500}
                  value={platform.announcementMessage}
                  onChange={(e) => setPlatform((p) => ({ ...p, announcementMessage: e.target.value }))}
                  placeholder="Short message shown in the banner (max 500 characters)."
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
                <p className="mt-1 text-xs text-gray-400">{platform.announcementMessage.length}/500</p>
              </div>
            </div>
          )}
        </section>
      </div>
    </AdminLayout>
  );
}
