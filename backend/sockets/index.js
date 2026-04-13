/**
 * Socket.io — Main Entry Point
 * Wires up all socket handlers with JWT authentication
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');
const registerChatHandlers = require('./chatSocket');
const registerNotificationHandlers = require('./notificationSocket');
const registerLocationHandlers = require('./locationSocket');
const logger = require('../config/logger');

// Shared online users map: userId (string) → socketId
const onlineUsers = {};

/**
 * Initialize Socket.io with all handlers
 * @param {import('socket.io').Server} io
 */
const initSockets = (io) => {

  // ── JWT Authentication Middleware ─────────────────────────────────────────
  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.split(' ')[1];

      if (!token) return next(new Error('Socket: Authentication token required'));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('name role isActive');

      if (!user || !user.isActive) return next(new Error('Socket: User not found or inactive'));

      socket.user = user;
      next();
    } catch (err) {
      next(new Error(`Socket auth failed: ${err.message}`));
    }
  });

  // ── Connection ────────────────────────────────────────────────────────────
  io.on('connection', (socket) => {
    const userId = socket.user._id.toString();
    logger.info(`🔌 Socket connected: ${socket.user.name} [${socket.user.role}] — ${socket.id}`);

    // Track online status
    onlineUsers[userId] = socket.id;
    socket.join(`user_${userId}`); // personal room

    // Broadcast online presence
    socket.broadcast.emit('user:online', { userId, name: socket.user.name });

    // Send current online users list to newly connected client
    socket.emit('users:online', Object.keys(onlineUsers));

    // ── Register handlers ─────────────────────────────────────────────────
    registerChatHandlers(socket, io, onlineUsers);
    registerNotificationHandlers(socket, io);
    registerLocationHandlers(socket, io);

    // ── Ping/Pong health ──────────────────────────────────────────────────
    socket.on('ping', () => socket.emit('pong', { ts: Date.now() }));

    // ── Disconnect ────────────────────────────────────────────────────────
    socket.on('disconnect', (reason) => {
      delete onlineUsers[userId];
      socket.broadcast.emit('user:offline', { userId });
      logger.info(`🔌 Socket disconnected: ${socket.user.name} — ${reason}`);
    });

    socket.on('error', (err) => {
      logger.error(`Socket error [${userId}]: ${err.message}`);
    });
  });

  logger.info('✅ Socket.io initialized');
  return onlineUsers;
};

module.exports = { initSockets, onlineUsers };
