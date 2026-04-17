import express from 'express';
import DonationPost from '../models/DonationPost.js';
import { protect, authorize } from '../middleware/auth.js';
import { getPlatformSettings } from '../utils/platformSettings.js';
import { multerUpload, uploadToCloudinary } from '../middleware/upload.js';
import { findOrCreateConversationForPair } from '../utils/conversationHelpers.js';

const router = express.Router();

// 1. GET / — Get all open donation posts with filters
router.get('/', async (req, res) => {
  try {
    const { category, city, condition, donatorId, page = 1, limit = 12 } = req.query;

    const filter = { status: 'open' };

    if (category) filter.category = category;
    if (condition) filter.condition = condition;
    if (city) filter['location.city'] = city;
    if (donatorId) filter.donator = donatorId;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const total = await DonationPost.countDocuments(filter);
    const posts = await DonationPost.find(filter)
      .populate('donator', 'name avatar isVerified')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const pages = Math.ceil(total / limitNum);

    res.json({
      success: true,
      message: 'Posts retrieved successfully',
      data: {
        posts,
        total,
        page: pageNum,
        pages,
        pagination: {
          total,
          page: pageNum,
          pages,
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
      data: null,
    });
  }
});

// 2. POST / — Create a new donation post with image uploads
router.post('/', protect, authorize('donator'), multerUpload, async (req, res) => {
  try {
    const platformSettings = await getPlatformSettings();
    if (!platformSettings.allowNewDonationPosts) {
      return res.status(403).json({
        success: false,
        message: 'Creating new donation posts is temporarily disabled.',
      });
    }

    const {
      title,
      description,
      category,
      quantity,
      unit,
      condition,
      location,
      pickupAvailable,
      deliveryAvailable,
      tags,
    } = req.body;

    // Parse location if it's a JSON string
    let parsedLocation = location;
    if (typeof location === 'string') {
      parsedLocation = JSON.parse(location);
    }

    // Upload images to Cloudinary
    const imageUrls = [];
    if (req.files && req.files.images) {
      for (const file of req.files.images) {
        const imageUrl = await uploadToCloudinary(file.buffer, 'SocialServe/donations');
        imageUrls.push(imageUrl);
      }
    }

    const newPost = new DonationPost({
      title,
      description,
      category,
      quantity,
      unit,
      condition,
      location: parsedLocation,
      pickupAvailable: pickupAvailable === 'true' || pickupAvailable === true,
      deliveryAvailable: deliveryAvailable === 'true' || deliveryAvailable === true,
      images: imageUrls,
      tags: tags ? (typeof tags === 'string' ? JSON.parse(tags) : tags) : [],
      donator: req.user._id,
    });

    await newPost.save();

    res.status(201).json({
      success: true,
      message: 'Donation post created successfully',
      data: newPost,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
      data: null,
    });
  }
});

// 3. GET /me — Get all posts by the current donator
router.get('/me', protect, authorize('donator'), async (req, res) => {
  try {
    const posts = await DonationPost.find({ donator: req.user._id })
      .populate('donator', 'name avatar isVerified')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      message: 'Your posts retrieved successfully',
      data: posts,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
      data: null,
    });
  }
});

// 4. GET /:id — Get a single donation post by ID
router.get('/:id', async (req, res) => {
  try {
    const post = await DonationPost.findById(req.params.id).populate(
      'donator',
      'name avatar role isVerified bio'
    );

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
        data: null,
      });
    }

    res.json({
      success: true,
      message: 'Post retrieved successfully',
      data: post,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
      data: null,
    });
  }
});

// 5. PUT /:id — Update a donation post
router.put('/:id', protect, authorize('donator'), multerUpload, async (req, res) => {
  try {
    const post = await DonationPost.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
        data: null,
      });
    }

    // Check if the user is the donator
    if (post.donator.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this post',
        data: null,
      });
    }

    const {
      title,
      description,
      category,
      quantity,
      unit,
      condition,
      location,
      pickupAvailable,
      deliveryAvailable,
      status,
      tags,
    } = req.body;

    // Update allowed fields
    if (title) post.title = title;
    if (description) post.description = description;
    if (category) post.category = category;
    if (quantity) post.quantity = quantity;
    if (unit) post.unit = unit;
    if (condition) post.condition = condition;
    if (location) {
      post.location = typeof location === 'string' ? JSON.parse(location) : location;
    }
    if (pickupAvailable !== undefined) {
      post.pickupAvailable = pickupAvailable === 'true' || pickupAvailable === true;
    }
    if (deliveryAvailable !== undefined) {
      post.deliveryAvailable = deliveryAvailable === 'true' || deliveryAvailable === true;
    }
    if (status) post.status = status;
    if (tags) {
      post.tags = typeof tags === 'string' ? JSON.parse(tags) : tags;
    }

    // Handle new images
    if (req.files && req.files.images) {
      const imageUrls = [];
      for (const file of req.files.images) {
        const imageUrl = await uploadToCloudinary(file.buffer, 'SocialServe/donations');
        imageUrls.push(imageUrl);
      }
      post.images = imageUrls;
    }

    await post.save();

    res.json({
      success: true,
      message: 'Post updated successfully',
      data: post,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
      data: null,
    });
  }
});

// 6. DELETE /:id — Delete a donation post
router.delete('/:id', protect, authorize('donator'), async (req, res) => {
  try {
    const post = await DonationPost.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
        data: null,
      });
    }

    // Check if the user is the donator
    if (post.donator.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this post',
        data: null,
      });
    }

    await DonationPost.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Post deleted successfully',
      data: null,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
      data: null,
    });
  }
});

// 7. POST /:id/need — Request a donation (create/retrieve conversation)
router.post('/:id/need', protect, authorize('receiver'), async (req, res) => {
  try {
    // Find the donation post
    const post = await DonationPost.findById(req.params.id);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
        data: null,
      });
    }

    const { conversation, created } = await findOrCreateConversationForPair({
      userIdA: req.user._id,
      userIdB: post.donator,
      relatedPostId: post._id,
      postType: 'donation',
    });

    return res.status(created ? 201 : 200).json({
      success: true,
      message: created ? 'Conversation created successfully' : 'Conversation already exists',
      data: {
        conversationId: conversation._id,
      },
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
      data: null,
    });
  }
});

// 8. PUT /:id/choose/:receiverId — Choose a receiver for the donation
router.put('/:id/choose/:receiverId', protect, authorize('donator'), async (req, res) => {
  try {
    const post = await DonationPost.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
        data: null,
      });
    }

    // Check if the user is the donator
    if (post.donator.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to choose a receiver for this post',
        data: null,
      });
    }

    post.chosenReceiver = req.params.receiverId;
    post.status = 'in_progress';

    await post.save();

    res.json({
      success: true,
      message: 'Receiver chosen successfully',
      data: post,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
      data: null,
    });
  }
});

export default router;
