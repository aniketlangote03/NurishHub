/**
 * Chat Controller
 * Message sending, retrieval, and conversation management
 */

const Message = require('../models/Message');
const User = require('../models/User');
const { asyncHandler, AppError } = require('../middleware/error');

// ─── @route  POST /api/messages ──────────────────────────────────────────────
const sendMessage = asyncHandler(async (req, res) => {
  const { receiverId, text, messageType, attachment, donationRef } = req.body;

  if (!text && !attachment) {
    throw new AppError('Message must have text or an attachment.', 400);
  }

  // Verify receiver exists
  const receiver = await User.findById(receiverId);
  if (!receiver) throw new AppError('Receiver not found.', 404);

  // Prevent messaging self
  if (receiverId === req.user._id.toString()) {
    throw new AppError('You cannot message yourself.', 400);
  }

  const message = await Message.create({
    senderId: req.user._id,
    receiverId,
    text,
    messageType: messageType || 'text',
    attachment,
    donationRef,
    status: 'sent',
  });

  // Real-time delivery via Socket.io
  const io = req.app.get('io');
  if (io) {
    const receiverSocketId = req.app.get('onlineUsers')?.[receiverId];
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('message:received', {
        messageId: message._id,
        senderId: req.user._id,
        text,
        createdAt: message.createdAt,
      });
      // Mark as delivered
      await Message.findByIdAndUpdate(message._id, {
        status: 'delivered',
        deliveredAt: new Date(),
      });
    }
  }

  res.status(201).json({
    success: true,
    message: 'Message sent.',
    data: { message },
  });
});

// ─── @route  GET /api/messages/:userId ───────────────────────────────────────
const getConversation = asyncHandler(async (req, res) => {
  const otherUserId = req.params.userId;
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(parseInt(req.query.limit, 10) || 50, 100);

  // Verify user exists
  const otherUser = await User.findById(otherUserId).select('name avatar role');
  if (!otherUser) throw new AppError('User not found.', 404);

  const messages = await Message.getConversation(req.user._id, otherUserId, page, limit);

  // Mark all received messages as read
  await Message.updateMany(
    {
      senderId: otherUserId,
      receiverId: req.user._id,
      status: { $ne: 'read' },
    },
    { status: 'read', readAt: new Date() }
  );

  // Notify sender that messages are read via socket
  const io = req.app.get('io');
  if (io) {
    io.to(`user_${otherUserId}`).emit('messages:read', {
      readBy: req.user._id,
    });
  }

  res.status(200).json({
    success: true,
    data: {
      messages: messages.reverse(), // oldest first
      otherUser,
      pagination: { page, limit },
    },
  });
});

// ─── @route  GET /api/messages ────────────────────────────────────────────────
const getConversationList = asyncHandler(async (req, res) => {
  const conversations = await Message.getConversationList(req.user._id);

  // Populate user details for each conversation
  const populatedConversations = await Promise.all(
    conversations.map(async (conv) => {
      const user = await User.findById(conv._id).select('name avatar role isActive');
      return { ...conv, user };
    })
  );

  res.status(200).json({
    success: true,
    data: { conversations: populatedConversations },
  });
});

// ─── @route  DELETE /api/messages/:id ────────────────────────────────────────
const deleteMessage = asyncHandler(async (req, res) => {
  const message = await Message.findById(req.params.id);
  if (!message) throw new AppError('Message not found.', 404);

  const senderId = message.senderId._id ? message.senderId._id.toString() : message.senderId.toString();
  const receiverId = message.receiverId._id ? message.receiverId._id.toString() : message.receiverId.toString();
  const userId = req.user._id.toString();

  if (senderId === userId) {
    message.deletedBySender = true;
  } else if (receiverId === userId) {
    message.deletedByReceiver = true;
  } else {
    throw new AppError('Not authorized to delete this message.', 403);
  }

  // Permanently delete if both parties deleted
  if (message.deletedBySender && message.deletedByReceiver) {
    await Message.findByIdAndDelete(req.params.id);
    return res.status(200).json({ success: true, message: 'Message permanently deleted.' });
  }

  await message.save();
  res.status(200).json({ success: true, message: 'Message deleted.' });
});

// ─── @route  GET /api/messages/unread/count ──────────────────────────────────
const getUnreadCount = asyncHandler(async (req, res) => {
  const count = await Message.countDocuments({
    receiverId: req.user._id,
    status: { $ne: 'read' },
    deletedByReceiver: false,
  });

  res.status(200).json({ success: true, data: { unreadCount: count } });
});

module.exports = { sendMessage, getConversation, getConversationList, deleteMessage, getUnreadCount };
