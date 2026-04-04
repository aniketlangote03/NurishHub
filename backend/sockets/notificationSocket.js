/**
 * Socket.io — Notification & Tracking Events
 */

const logger = require('../config/logger');

/**
 * Register notification and pickup-tracking socket handlers
 * @param {import('socket.io').Socket} socket
 * @param {import('socket.io').Server} io
 */
const registerNotificationHandlers = (socket, io) => {
  const userId = socket.user._id.toString();

  // ── Acknowledge notification ──────────────────────────────────────────────
  socket.on('notification:ack', ({ notificationId }) => {
    logger.debug(`Notification ${notificationId} acked by ${userId}`);
  });

  // ── Subscribe to donation feed (NGO: nearby donation alerts) ─────────────
  socket.on('donations:subscribe', ({ lat, lng, radius = 10 }) => {
    socket.donationSubscription = { lat: parseFloat(lat), lng: parseFloat(lng), radius: parseFloat(radius) };
    socket.join('donation-feed');
    logger.debug(`${userId} subscribed to donation feed [${lat}, ${lng}] r=${radius}km`);
  });

  socket.on('donations:unsubscribe', () => {
    socket.leave('donation-feed');
    delete socket.donationSubscription;
  });

  // ── Pickup location tracking ──────────────────────────────────────────────
  socket.on('pickup:location-update', ({ pickupId, coordinates }) => {
    if (socket.user.role !== 'volunteer') return;
    io.to(`pickup_${pickupId}`).emit('pickup:location', {
      pickupId,
      volunteerId: userId,
      coordinates,
      updatedAt: new Date().toISOString(),
    });
  });

  socket.on('pickup:track', ({ pickupId }) => {
    socket.join(`pickup_${pickupId}`);
  });

  socket.on('pickup:untrack', ({ pickupId }) => {
    socket.leave(`pickup_${pickupId}`);
  });
};

module.exports = registerNotificationHandlers;
