import mongoose from 'mongoose';

const platformSettingsSchema = new mongoose.Schema(
  {
    maintenanceMode: {
      type: Boolean,
      default: false,
    },
    allowRegistration: {
      type: Boolean,
      default: true,
    },
    allowNewDonationPosts: {
      type: Boolean,
      default: true,
    },
    allowNewNeedPosts: {
      type: Boolean,
      default: true,
    },
    announcementEnabled: {
      type: Boolean,
      default: false,
    },
    announcementMessage: {
      type: String,
      default: '',
      maxlength: 500,
      trim: true,
    },
  },
  { timestamps: true }
);

const PlatformSettings = mongoose.model('PlatformSettings', platformSettingsSchema);

export default PlatformSettings;
