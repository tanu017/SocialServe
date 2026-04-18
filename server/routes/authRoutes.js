import express from 'express';
import User from '../models/User.js';
import generateToken from '../utils/generateToken.js';
import { protect } from '../middleware/auth.js';
import { getPlatformSettings } from '../utils/platformSettings.js';

const router = express.Router();

// POST /register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, phone, organizationName } = req.body;

    // Validate required fields
    if (!name || !email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields.',
      });
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered.',
      });
    }

    const platformSettings = await getPlatformSettings();
    if (!platformSettings.allowRegistration) {
      return res.status(403).json({
        success: false,
        message: 'New registrations are temporarily disabled.',
      });
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      role,
      phone,
      organizationName,
    });

    // Generate token
    const token = generateToken(user._id);

    // Return response without password
    const userResponse = user.toObject();
    delete userResponse.password;

    return res.status(201).json({
      success: true,
      message: 'User registered successfully.',
      data: {
        token,
        user: userResponse,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Registration failed.',
    });
  }
});

// POST /login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password.',
      });
    }

    // Find user with password field
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    // Compare passwords
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    // Generate token
    const token = generateToken(user._id);

    // Return response without password
    const userResponse = user.toObject();
    delete userResponse.password;

    return res.status(200).json({
      success: true,
      message: 'Login successful.',
      data: {
        token,
        user: userResponse,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Login failed.',
    });
  }
});

// GET /me (protected)
router.get('/me', protect, async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      message: 'User retrieved successfully.',
      data: {
        user: req.user,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to retrieve user.',
    });
  }
});

// POST /logout
router.post('/logout', (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'Logged out successfully.',
  });
});

// PUT /profile (protected) — update user fields; email cannot be changed here
router.put('/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    const {
      name,
      phone,
      bio,
      organizationName,
      contactPerson,
      website,
      avatar,
      address,
    } = req.body;

    if (name !== undefined) {
      const trimmed = String(name).trim();
      if (!trimmed) {
        return res.status(400).json({
          success: false,
          message: 'Name cannot be empty.',
        });
      }
      user.name = trimmed;
    }
    if (phone !== undefined) user.phone = phone || '';
    if (bio !== undefined) {
      const b = String(bio || '').trim();
      if (b.length > 500) {
        return res.status(400).json({
          success: false,
          message: 'Description must be 500 characters or less.',
        });
      }
      user.bio = b || undefined;
    }
    if (organizationName !== undefined) user.organizationName = organizationName || '';
    if (contactPerson !== undefined) user.contactPerson = contactPerson || '';
    if (website !== undefined) user.website = website || '';
    if (avatar !== undefined) user.avatar = avatar || '';

    if (address !== undefined && typeof address === 'object' && address !== null) {
      user.address = user.address || {};
      const { street, city, state, pincode, country } = address;
      if (street !== undefined) user.address.street = street || '';
      if (city !== undefined) user.address.city = city || '';
      if (state !== undefined) user.address.state = state || '';
      if (pincode !== undefined) user.address.pincode = pincode || '';
      if (country !== undefined) user.address.country = country || '';
    }

    await user.save();

    const userResponse = user.toObject();
    delete userResponse.password;

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      data: {
        user: userResponse,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Profile update failed.',
    });
  }
});

// PUT /change-password (protected)
router.put('/change-password', protect, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Validate required fields
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide current and new passwords.',
      });
    }

    // Get user with password field
    const user = await User.findById(req.user._id).select('+password');

    // Verify current password
    const isPasswordValid = await user.comparePassword(currentPassword);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect.',
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Password changed successfully.',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Password change failed.',
    });
  }
});

export default router;
