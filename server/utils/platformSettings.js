import PlatformSettings from '../models/PlatformSettings.js';

const allowedKeys = [
  'maintenanceMode',
  'allowRegistration',
  'allowNewDonationPosts',
  'allowNewNeedPosts',
  'announcementEnabled',
];

export async function getPlatformSettings() {
  let doc = await PlatformSettings.findOne();
  if (!doc) {
    doc = await PlatformSettings.create({});
  }
  return doc;
}

export function sanitizePlatformUpdates(body = {}) {
  const clean = {};
  for (const key of allowedKeys) {
    if (typeof body[key] === 'boolean') {
      clean[key] = body[key];
    }
  }
  if (typeof body.announcementMessage === 'string') {
    clean.announcementMessage = body.announcementMessage.slice(0, 500);
  }
  return clean;
}

export async function updatePlatformSettings(body) {
  const $set = sanitizePlatformUpdates(body);
  if (Object.keys($set).length === 0) {
    return getPlatformSettings();
  }
  const doc = await PlatformSettings.findOneAndUpdate(
    {},
    { $set },
    { new: true, upsert: true, setDefaultsOnInsert: true, runValidators: true }
  );
  return doc;
}
