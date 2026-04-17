import express from 'express';
import User from '../models/User.js';

const router = express.Router();

// GET /users/:id - public user profile
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select(
      'name avatar role isVerified bio createdAt website organizationName contactPerson isActive'
    );

    if (!user || user?.isActive === false) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        data: null
      });
    }

    const safeUser = user.toObject();
    delete safeUser.isActive;

    return res.status(200).json({
      success: true,
      message: 'User retrieved successfully',
      data: safeUser
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to retrieve user',
      data: null
    });
  }
});

export default router;
