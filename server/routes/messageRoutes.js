import express from 'express';
import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

function isParticipant(conversation, userId) {
  const uid = userId?.toString?.() ?? String(userId);
  return conversation.participants.some((p) => p.toString() === uid);
}

// Mounted at /api/v1/conversations — GET / lists conversations for the current user
router.get('/', protect, async (req, res) => {
  try {
    const conversations = await Conversation.find({
      participants: req.user._id,
    })
      .populate('participants', 'name avatar role')
      .sort({ lastMessageAt: -1 });

    res.json(conversations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /:id/messages — messages in a conversation
router.get('/:id/messages', protect, async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.id);

    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    if (!isParticipant(conversation, req.user._id)) {
      return res.status(403).json({ message: 'Not authorized to view this conversation' });
    }

    const messages = await Message.find({ conversation: req.params.id })
      .populate('sender', 'name avatar')
      .sort({ createdAt: 1 });

    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /:id/messages — send a message (persist + broadcast like socket handler)
router.post('/:id/messages', protect, async (req, res) => {
  try {
    const text = typeof req.body?.text === 'string' ? req.body.text.trim() : '';
    if (!text) {
      return res.status(400).json({ message: 'Message text is required' });
    }

    const conversation = await Conversation.findById(req.params.id);

    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    if (!isParticipant(conversation, req.user._id)) {
      return res.status(403).json({ message: 'Not authorized to message in this conversation' });
    }

    const message = new Message({
      conversation: req.params.id,
      sender: req.user._id,
      text,
      readBy: [req.user._id],
    });

    await message.save();

    conversation.lastMessage = text;
    conversation.lastMessageAt = new Date();
    await conversation.save();

    await message.populate('sender', 'name avatar');

    const io = req.app.get('io');
    const roomId = String(req.params.id);
    if (io) {
      io.to(roomId).emit('message:receive', message);
      conversation.participants
        .filter((p) => p.toString() !== req.user._id.toString())
        .forEach((participantId) => {
          io.to(participantId.toString()).emit('notification:newMessage', {
            conversationId: roomId,
            senderName: req.user.name,
            preview: text.substring(0, 60),
          });
        });
    }

    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PUT /:id/read — mark as read
router.put('/:id/read', protect, async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.id);

    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    if (!isParticipant(conversation, req.user._id)) {
      return res.status(403).json({ message: 'Not authorized to update this conversation' });
    }

    await Message.updateMany(
      {
        conversation: req.params.id,
        readBy: { $ne: req.user._id },
      },
      { $push: { readBy: req.user._id } }
    );

    res.json({ success: true, message: 'Marked as read' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
