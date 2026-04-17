import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { getPlatformSettings } from '../utils/platformSettings.js';

/**
 * When maintenance mode is on, block most API traffic unless the caller is an admin (valid Bearer JWT).
 */
export default async function maintenanceModeMiddleware(req, res, next) {
  try {
    const settings = await getPlatformSettings();
    if (!settings.maintenanceMode) {
      return next();
    }

    const url = req.originalUrl.split('?')[0];

    if (req.method === 'GET' && (url === '/' || url === '')) {
      return next();
    }

    if (url.startsWith('/api/v1/platform/public')) {
      return next();
    }
    if (url === '/api/v1/auth/login') {
      return next();
    }

    const token = req.headers.authorization?.split(' ')[1];
    if (token && process.env.JWT_SECRET) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select('role');
        if (user?.role === 'admin') {
          return next();
        }
      } catch {
        /* fall through to 503 */
      }
    }

    return res.status(503).json({
      success: false,
      message: 'The platform is temporarily unavailable for maintenance. Please try again later.',
      code: 'MAINTENANCE',
    });
  } catch (error) {
    return next(error);
  }
}
