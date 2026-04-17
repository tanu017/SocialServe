import express from 'express';
import User from '../models/User.js';
import DonationPost from '../models/DonationPost.js';
import NeedPost from '../models/NeedPost.js';
import { protect, authorize } from '../middleware/auth.js';
import { getPlatformSettings, updatePlatformSettings } from '../utils/platformSettings.js';

const router = express.Router();

const parseBoolean = (value) => {
  if (value === undefined) return undefined;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    if (value.toLowerCase() === 'true') return true;
    if (value.toLowerCase() === 'false') return false;
  }
  return undefined;
};

// Ensure every admin route requires auth + admin role.
router.use(protect, authorize('admin'));

// GET /admin/stats
router.get('/stats', async (req, res) => {
  try {
    const [
      totalUsers,
      totalDonators,
      totalReceivers,
      totalDonationPosts,
      donatedDonationPosts,
      totalNeedPosts,
      fulfilledNeedPosts,
      pendingVerificationUsers,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'donator' }),
      User.countDocuments({ role: 'receiver' }),
      DonationPost.countDocuments(),
      DonationPost.countDocuments({ status: 'donated' }),
      NeedPost.countDocuments(),
      NeedPost.countDocuments({ status: 'fulfilled' }),
      User.countDocuments({ isVerified: false, isActive: true }),
    ]);

    return res.status(200).json({
      success: true,
      message: 'Admin stats retrieved successfully.',
      data: {
        totalUsers,
        totalDonators,
        totalReceivers,
        totalDonationPosts,
        donatedDonationPosts,
        totalNeedPosts,
        fulfilledNeedPosts,
        pendingVerificationUsers,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to retrieve admin stats.',
      data: null,
    });
  }
});

// GET /admin/users
router.get('/users', async (req, res) => {
  try {
    const { role, search } = req.query;
    const isVerified = parseBoolean(req.query.isVerified);
    const pageNum = Number.parseInt(req.query.page, 10) || 1;
    const limitNum = Number.parseInt(req.query.limit, 10) || 20;
    const skip = (pageNum - 1) * limitNum;

    const filter = {};
    if (role) filter.role = role;
    if (isVerified !== undefined) filter.isVerified = isVerified;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const [users, total] = await Promise.all([
      User.find(filter)
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      User.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      message: 'Users retrieved successfully.',
      data: {
        users,
        total,
        page: pageNum,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to retrieve users.',
      data: null,
    });
  }
});

// GET /admin/users/:id
router.get('/users/:id', async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await User.findById(userId).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
        data: null,
      });
    }

    const [donationPosts, needPosts] = await Promise.all([
      DonationPost.find({ donator: userId }).sort({ createdAt: -1 }).limit(10),
      NeedPost.find({ receiver: userId }).sort({ createdAt: -1 }).limit(10),
    ]);

    return res.status(200).json({
      success: true,
      message: 'User details retrieved successfully.',
      data: {
        user,
        donationPosts,
        needPosts,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to retrieve user details.',
      data: null,
    });
  }
});

// PUT /admin/users/:id/verify
router.put('/users/:id/verify', async (req, res) => {
  try {
    const { isVerified, isActive } = req.body;
    const parsedVerified = parseBoolean(isVerified);
    const parsedActive = parseBoolean(isActive);

    if (parsedVerified === undefined && parsedActive === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Provide isVerified and/or isActive as true/false.',
        data: null,
      });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
        data: null,
      });
    }

    if (parsedVerified !== undefined) {
      user.isVerified = parsedVerified;
    }
    if (parsedActive !== undefined) {
      user.isActive = parsedActive;
    }

    await user.save();

    const safeUser = user.toObject();
    delete safeUser.password;

    return res.status(200).json({
      success: true,
      message: 'User status updated successfully.',
      data: safeUser,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to update user status.',
      data: null,
    });
  }
});

// DELETE /admin/users/:id
router.delete('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
        data: null,
      });
    }

    user.isActive = false;
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'User deactivated',
      data: null,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to deactivate user.',
      data: null,
    });
  }
});

// GET /admin/donations
router.get('/donations', async (req, res) => {
  try {
    const { status, category, search } = req.query;
    const pageNum = Number.parseInt(req.query.page, 10) || 1;
    const limitNum = Number.parseInt(req.query.limit, 10) || 20;
    const skip = (pageNum - 1) * limitNum;

    const filter = {};
    if (status) filter.status = status;
    if (category) filter.category = category;
    if (search) filter.title = { $regex: search, $options: 'i' };

    const [posts, total] = await Promise.all([
      DonationPost.find(filter)
        .populate('donator', 'name email avatar isVerified')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      DonationPost.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      message: 'Donation posts retrieved successfully.',
      data: {
        posts,
        total,
        page: pageNum,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to retrieve donation posts.',
      data: null,
    });
  }
});

// GET /admin/needs
router.get('/needs', async (req, res) => {
  try {
    const { status, urgency, category, search } = req.query;
    const pageNum = Number.parseInt(req.query.page, 10) || 1;
    const limitNum = Number.parseInt(req.query.limit, 10) || 20;
    const skip = (pageNum - 1) * limitNum;

    const filter = {};
    if (status) filter.status = status;
    if (urgency) filter.urgency = urgency;
    if (category) filter.category = category;
    if (search) filter.title = { $regex: search, $options: 'i' };

    const [posts, total] = await Promise.all([
      NeedPost.find(filter)
        .populate('receiver', 'name email avatar organizationName isVerified')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      NeedPost.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      message: 'Need posts retrieved successfully.',
      data: {
        posts,
        total,
        page: pageNum,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to retrieve need posts.',
      data: null,
    });
  }
});

// DELETE /admin/donations/:id
router.delete('/donations/:id', async (req, res) => {
  try {
    const post = await DonationPost.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Donation post not found.',
        data: null,
      });
    }

    await DonationPost.findByIdAndDelete(req.params.id);

    return res.status(200).json({
      success: true,
      message: 'Donation post deleted successfully.',
      data: null,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete donation post.',
      data: null,
    });
  }
});

// DELETE /admin/needs/:id
router.delete('/needs/:id', async (req, res) => {
  try {
    const post = await NeedPost.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Need post not found.',
        data: null,
      });
    }

    await NeedPost.findByIdAndDelete(req.params.id);

    return res.status(200).json({
      success: true,
      message: 'Need post deleted successfully.',
      data: null,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete need post.',
      data: null,
    });
  }
});

// GET /admin/platform-settings
router.get('/platform-settings', async (req, res) => {
  try {
    const settings = await getPlatformSettings();
    return res.status(200).json({
      success: true,
      message: 'Platform settings retrieved successfully.',
      data: { settings },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to retrieve platform settings.',
      data: null,
    });
  }
});

// PUT /admin/platform-settings
router.put('/platform-settings', async (req, res) => {
  try {
    const settings = await updatePlatformSettings(req.body || {});
    return res.status(200).json({
      success: true,
      message: 'Platform settings updated successfully.',
      data: { settings },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to update platform settings.',
      data: null,
    });
  }
});

export default router;
