/**
 * Socket.io Handler
 * Real-time events: chat, notifications, pickup tracking, donation alerts
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');
const logger = require('../config/logger');

/**
 * Initialize Socket.io on the HTTP server
 * @param {import('socket.io').Server} io
 */
const initializeSocket = (io) => {
  // ─── Online users map: userId → socketId ─────────────────────────────────
  const onlineUsers = {};

  // ─── JWT Authentication Middleware for Socket.io ──────────────────────────
  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.split(' ')[1];

      if (!token) {
        return next(new Error('Authentication required'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('name role isActive');

      if (!user || !user.isActive) {
        return next(new Error('User not found or inactive'));
      }

      socket.user = user;
      next();
    } catch (err) {
      next(new Error('Invalid token'));
    }
  });

  // ─── Connection handler ───────────────────────────────────────────────────
  io.on('connection', (socket) => {
    const userId = socket.user._id.toString();
    logger.info(`Socket connected: ${socket.user.name} (${userId})`);

    // Track online status
    onlineUsers[userId] = socket.id;
    socket.join(`user_${userId}`); // Personal room for targeted notifications

    // Broadcast online status to contacts
    socket.broadcast.emit('user:online', { userId });

    // ─── Chat Events ──────────────────────────────────────────────────────

    // Typing indicator
    socket.on('chat:typing', ({ receiverId }) => {
      socket.to(`user_${receiverId}`).emit('chat:typing', {
        senderId: userId,
        senderName: socket.user.name,
      });
    });

    socket.on('chat:stop-typing', ({ receiverId }) => {
      socket.to(`user_${receiverId}`).emit('chat:stop-typing', { senderId: userId });
    });

    // ─── Pickup Tracking Events ───────────────────────────────────────────

    // Volunteer updates their location during pickup
    socket.on('pickup:location-update', ({ pickupId, coordinates }) => {
      if (socket.user.role !== 'volunteer') return;

      // Broadcast to all parties tracking this pickup
      io.to(`pickup_${pickupId}`).emit('pickup:location', {
        pickupId,
        volunteerId: userId,
        coordinates,
        updatedAt: new Date(),
      });
    });

    // Join a pickup tracking room (donor/ngo watching a pickup)
    socket.on('pickup:track', ({ pickupId }) => {
      socket.join(`pickup_${pickupId}`);
      logger.debug(`${userId} joined pickup tracking room: pickup_${pickupId}`);
    });

    socket.on('pickup:untrack', ({ pickupId }) => {
      socket.leave(`pickup_${pickupId}`);
    });

    // ─── Notification Events ──────────────────────────────────────────────

    // Client acknowledges receiving a notification
    socket.on('notification:ack', ({ notificationId }) => {
      logger.debug(`Notification ${notificationId} acknowledged by ${userId}`);
    });

    // ─── Donation Feed Events ─────────────────────────────────────────────

    // NGO subscribes to nearby donation alerts
    socket.on('donations:subscribe', ({ lat, lng, radius }) => {
      // Store subscription info on socket
      socket.donationSubscription = { lat, lng, radius };
      socket.join('donation-feed');
      logger.debug(`${userId} subscribed to donation feed at [${lat}, ${lng}]`);
    });

    socket.on('donations:unsubscribe', () => {
      socket.leave('donation-feed');
      delete socket.donationSubscription;
    });

    // ─── Disconnect ───────────────────────────────────────────────────────
    socket.on('disconnect', (reason) => {
      delete onlineUsers[userId];
      socket.broadcast.emit('user:offline', { userId });
      logger.info(`Socket disconnected: ${socket.user.name} - ${reason}`);
    });

    // ─── Error handler ────────────────────────────────────────────────────
    socket.on('error', (err) => {
      logger.error(`Socket error for ${userId}: ${err.message}`);
    });
  });

  return onlineUsers;
};

module.exports = initializeSocket;
