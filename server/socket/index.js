import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Message from '../models/Message.js';
import Conversation from '../models/Conversation.js';

export default function initSocket(io) {

  // Auth middleware for socket connections
  // Client must pass { auth: { token: 'Bearer xxx' } } when connecting
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token?.replace('Bearer ', '');
      if (!token) return next(new Error('Authentication required'));
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');
      if (!user) return next(new Error('User not found'));
      socket.user = user;
      next();
    } catch (err) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {

    // Join a personal room named after the user's _id (for DM notifications)
    socket.join(socket.user._id.toString());

    // Join a conversation room (must match io.to(String(id)) when broadcasting)
    socket.on('join:conversation', (conversationId) => {
      if (conversationId != null) socket.join(String(conversationId));
    });

    // Leave a conversation room
    socket.on('leave:conversation', (conversationId) => {
      if (conversationId != null) socket.leave(String(conversationId));
    });

    // Send a message
    // payload: { conversationId, text }
    socket.on('message:send', async (payload, callback) => {
      try {
        const { conversationId, text } = payload;
        const roomId = conversationId != null ? String(conversationId) : '';
        if (!text?.trim()) return callback?.({ error: 'Empty message' });

        // Verify sender is a participant
        const conversation = await Conversation.findById(roomId);
        if (!conversation) return callback?.({ error: 'Conversation not found' });
        const isParticipant = conversation.participants.some(
          p => p.toString() === socket.user._id.toString()
        );
        if (!isParticipant) return callback?.({ error: 'Not a participant' });

        // Save message to DB
        const message = await Message.create({
          conversation: roomId,
          sender: socket.user._id,
          text: text.trim(),
          readBy: [socket.user._id]
        });

        // Update conversation lastMessage + lastMessageAt
        await Conversation.findByIdAndUpdate(roomId, {
          lastMessage: text.trim(),
          lastMessageAt: new Date()
        });

        // Populate sender for the emit payload
        await message.populate('sender', 'name avatar');

        // Emit to all clients in the conversation room (including sender)
        io.to(roomId).emit('message:receive', message);

        // Notify the OTHER participant's personal room (for unread badge)
        const otherParticipants = conversation.participants.filter(
          p => p.toString() !== socket.user._id.toString()
        );
        otherParticipants.forEach(participantId => {
          io.to(participantId.toString()).emit('notification:newMessage', {
            conversationId: roomId,
            senderName: socket.user.name,
            preview: text.trim().substring(0, 60)
          });
        });

        callback?.({ success: true, message });
      } catch (err) {
        callback?.({ error: err.message });
      }
    });

    // Mark messages as read
    // payload: { conversationId }
    socket.on('message:read', async (payload) => {
      try {
        const { conversationId } = payload;
        const roomId = conversationId != null ? String(conversationId) : '';
        await Message.updateMany(
          { conversation: roomId, readBy: { $ne: socket.user._id } },
          { $addToSet: { readBy: socket.user._id } }
        );
        // Notify others in the room that messages were read
        socket.to(roomId).emit('message:readAck', {
          conversationId: roomId,
          readBy: socket.user._id
        });
      } catch (err) {
        console.error('message:read error', err.message);
      }
    });

    // Typing indicator
    // payload: { conversationId, isTyping }
    socket.on('user:typing', (payload) => {
      const roomId =
        payload?.conversationId != null ? String(payload.conversationId) : '';
      if (!roomId) return;
      socket.to(roomId).emit('user:typing', {
        userId: socket.user._id,
        name: socket.user.name,
        isTyping: payload.isTyping
      });
    });

    socket.on('disconnect', () => {
      // cleanup handled automatically by socket.io room management
    });
  });
}
