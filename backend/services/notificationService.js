/**
 * Notification Service
 * Centralized helper for creating in-app notifications + Socket.io delivery
 */

const Notification = require('../models/Notification');
const logger = require('../config/logger');

/**
 * Create and deliver a notification to a user
 * @param {object} io - Socket.io server instance
 * @param {object} params - notification parameters
 */
const notify = async (io, { userId, type, title, body, data = {}, priority = 'normal', channels = ['in_app'] }) => {
  try {
    // Persist in DB
    const notification = await Notification.create({
      userId,
      type,
      title,
      body,
      data,
      priority,
      channels,
    });

    // Real-time delivery via socket
    if (io) {
      io.to(`user_${userId}`).emit('notification:new', {
        id: notification._id,
        type,
        title,
        body,
        data,
        priority,
        createdAt: notification.createdAt,
      });
    }

    return notification;
  } catch (err) {
    logger.error(`Notification creation failed for user ${userId}: ${err.message}`);
    return null;
  }
};

// ─── Predefined notification senders ─────────────────────────────────────────

const notifyDonationRequested = (io, donorId, ngoName, donation) =>
  notify(io, {
    userId: donorId,
    type: 'donation_requested',
    title: 'New Request for Your Donation',
    body: `${ngoName} has requested your donation: ${donation.foodName}`,
    data: { donationId: donation._id },
    priority: 'high',
  });

const notifyRequestApproved = (io, ngoId, donationName) =>
  notify(io, {
    userId: ngoId,
    type: 'request_approved',
    title: 'Request Approved! 🎉',
    body: `Your request for "${donationName}" has been approved.`,
    data: {},
    priority: 'high',
  });

const notifyRequestRejected = (io, ngoId, donationName) =>
  notify(io, {
    userId: ngoId,
    type: 'request_rejected',
    title: 'Request Not Approved',
    body: `Your request for "${donationName}" was not approved.`,
    data: {},
    priority: 'normal',
  });

const notifyPickupAssigned = (io, volunteerId, donationName, pickupId) =>
  notify(io, {
    userId: volunteerId,
    type: 'pickup_assigned',
    title: 'New Pickup Task 📦',
    body: `You have been assigned to pick up: "${donationName}"`,
    data: { pickupId },
    priority: 'high',
  });

const notifyPickupDelivered = (io, ngoId, donationName) =>
  notify(io, {
    userId: ngoId,
    type: 'pickup_completed',
    title: 'Donation Delivered! ✅',
    body: `"${donationName}" has been successfully delivered to your location.`,
    data: {},
    priority: 'normal',
  });

const notifyNearbyDonation = (io, ngoId, donationName, distanceKm) =>
  notify(io, {
    userId: ngoId,
    type: 'nearby_donation',
    title: 'New Donation Nearby 📍',
    body: `"${donationName}" is available ${distanceKm}km from your location.`,
    data: {},
    priority: 'normal',
  });

module.exports = {
  notify,
  notifyDonationRequested,
  notifyRequestApproved,
  notifyRequestRejected,
  notifyPickupAssigned,
  notifyPickupDelivered,
  notifyNearbyDonation,
};
