/**
 * Location & Pickup-Status Socket Handler
 * ─────────────────────────────────────────────────────────────────────────────
 * Events (inbound from volunteer client)
 *   volunteer:location   { lat, lng, pickupId? }
 *   pickup:status-update { pickupId, status, lat?, lng? }
 *
 * Events (broadcast to all / rooms)
 *   volunteer:location   { volunteerId, name, lat, lng, pickupId? }  → io.emit
 *   pickup:status-update { pickupId, status, volunteerId, label }    → io.emit
 */

const User   = require('../models/User');
const Pickup = require('../models/Pickup');
const logger = require('../config/logger');

// Human-readable labels for each status
const STATUS_LABELS = {
  assigned        : '📋 Assigned',
  accepted        : '✅ Accepted',
  en_route_pickup : '🚴 En Route to Pickup',
  picked_up       : '📦 Picked Up',
  en_route_delivery: '🚚 En Route to NGO',
  delivered       : '🎉 Delivered',
  cancelled       : '❌ Cancelled',
  failed          : '⚠️ Failed',
};

/**
 * @param {import('socket.io').Socket} socket
 * @param {import('socket.io').Server}  io
 */
const registerLocationHandlers = (socket, io) => {
  const { user } = socket; // attached by JWT middleware in index.js

  // ── volunteer:location ────────────────────────────────────────────────────
  socket.on('volunteer:location', async (data) => {
    try {
      if (user.role !== 'volunteer') return; // only volunteers send GPS

      const { lat, lng, pickupId } = data || {};
      if (typeof lat !== 'number' || typeof lng !== 'number') return;

      // Persist live location to User model (GeoJSON)
      await User.findByIdAndUpdate(user._id, {
        location: {
          type       : 'Point',
          coordinates: [lng, lat], // MongoDB: [lng, lat]
        },
      });

      // Broadcast to everyone so NGO/Admin/Donor dashboards update in real time
      io.emit('volunteer:location', {
        volunteerId: user._id.toString(),
        name       : user.name,
        lat,
        lng,
        pickupId   : pickupId || null,
        ts         : Date.now(),
      });

    } catch (err) {
      logger.error(`volunteer:location error [${user._id}]: ${err.message}`);
    }
  });

  // ── pickup:status-update (socket shortcut — mirrors REST endpoint) ─────────
  // Volunteer can emit this directly without an extra HTTP call when changing
  // from en_route_pickup → picked_up or en_route_delivery → delivered etc.
  socket.on('pickup:status-update', async (data) => {
    try {
      if (user.role !== 'volunteer') return;

      const { pickupId, status, lat, lng } = data || {};
      if (!pickupId || !status) return;

      const pickup = await Pickup.findById(pickupId);
      if (!pickup) return;

      // Security: volunteer can only update their own pickup
      const volId = pickup.volunteerId?._id
        ? pickup.volunteerId._id.toString()
        : pickup.volunteerId.toString();
      if (volId !== user._id.toString()) return;

      // Broadcast the status change to all clients
      io.emit('pickup:status-update', {
        pickupId   : pickupId,
        status,
        label      : STATUS_LABELS[status] || status,
        volunteerId: user._id.toString(),
        volunteerName: user.name,
        lat        : lat || null,
        lng        : lng || null,
        ts         : Date.now(),
      });

      logger.info(`📦 pickup:status-update — ${user.name} → ${status} [${pickupId}]`);

    } catch (err) {
      logger.error(`pickup:status-update error [${user._id}]: ${err.message}`);
    }
  });
};

module.exports = registerLocationHandlers;
