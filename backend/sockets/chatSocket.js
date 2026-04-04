/**
 * Socket.io — Chat Events
 * Handles all real-time chat functionality
 */

const Message = require('../models/Message');
const logger = require('../config/logger');

/**
 * Register chat socket event handlers
 * @param {import('socket.io').Socket} socket
 * @param {import('socket.io').Server} io
 * @param {object} onlineUsers - shared online users map
 */
const registerChatHandlers = (socket, io, onlineUsers) => {
  const userId = socket.user._id.toString();

  // ── Typing indicators ─────────────────────────────────────────────────────
  socket.on('chat:typing', ({ receiverId }) => {
    if (!receiverId) return;
    socket.to(`user_${receiverId}`).emit('chat:typing', {
      senderId: userId,
      senderName: socket.user.name,
    });
  });

  socket.on('chat:stop-typing', ({ receiverId }) => {
    if (!receiverId) return;
    socket.to(`user_${receiverId}`).emit('chat:stop-typing', { senderId: userId });
  });

  // ── Mark messages as read ─────────────────────────────────────────────────
  socket.on('chat:read', async ({ senderId }) => {
    try {
      await Message.updateMany(
        { senderId, receiverId: userId, status: { $ne: 'read' } },
        { status: 'read', readAt: new Date() }
      );
      // Notify sender their messages were read
      socket.to(`user_${senderId}`).emit('chat:messages-read', { readBy: userId });
    } catch (err) {
      logger.error(`chat:read error: ${err.message}`);
    }
  });

  // ── Join/leave room for group-style tracking ───────────────────────────────
  socket.on('chat:join-room', ({ roomId }) => {
    socket.join(`room_${roomId}`);
  });

  socket.on('chat:leave-room', ({ roomId }) => {
    socket.leave(`room_${roomId}`);
  });
};

module.exports = registerChatHandlers;
