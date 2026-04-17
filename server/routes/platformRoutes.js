import express from 'express';
import { getPlatformSettings } from '../utils/platformSettings.js';

const router = express.Router();

// GET /platform/public — anonymous; safe subset for UI banner / gating
router.get('/public', async (req, res) => {
  try {
    const s = await getPlatformSettings();
    return res.status(200).json({
      success: true,
      data: {
        maintenanceMode: s.maintenanceMode,
        announcementEnabled: s.announcementEnabled,
        announcementMessage: s.announcementMessage || '',
        allowRegistration: s.allowRegistration,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to load platform settings.',
    });
  }
});

export default router;
