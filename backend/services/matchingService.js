/**
 * Matching Service
 * Core algorithm for matching donors to nearest NGOs and auto-assigning volunteers
 *
 * Strategy:
 *  1. Find available NGOs within radius, sorted by distance
 *  2. Prioritize by: distance (closer = better) + donation urgency (expiry soon = more urgent)
 *  3. Find available volunteers nearest to the donation pickup point
 *  4. Score and rank candidates
 */

const User = require('../models/User');
const Donation = require('../models/Donation');
const Pickup = require('../models/Pickup');
const Notification = require('../models/Notification');
const logger = require('../config/logger');

// ─── Find nearest NGOs for a donation ────────────────────────────────────────
/**
 * Returns ranked list of NGOs within radius of a donation, scored by distance + capacity
 * @param {string} donationId
 * @param {number} radiusKm - search radius in km (default 30)
 * @returns {Array} ranked NGOs with score and distance
 */
const findNearestNGOs = async (donationId, radiusKm = 30) => {
  const donation = await Donation.findById(donationId);
  if (!donation) throw new Error('Donation not found');

  const [lng, lat] = donation.location.coordinates;

  // Geo query: NGOs within radius
  const ngos = await User.find({
    role: 'ngo',
    isActive: true,
    location: {
      $near: {
        $geometry: { type: 'Point', coordinates: [lng, lat] },
        $maxDistance: radiusKm * 1000,
      },
    },
  }).select('name email phone ngoDetails location address');

  if (!ngos.length) {
    logger.info(`No NGOs found within ${radiusKm}km of donation ${donationId}`);
    return [];
  }

  // Urgency factor: 0–1 (higher = more urgent, expiring sooner)
  const now = Date.now();
  const expiryMs = new Date(donation.expiryTime).getTime() - now;
  const urgency = Math.max(0, Math.min(1, 1 - expiryMs / (24 * 60 * 60 * 1000))); // 1 if expiring within 24h

  // Calculate Haversine distance and score each NGO
  const scored = ngos.map((ngo) => {
    const [ngoLng, ngoLat] = ngo.location.coordinates;
    const distKm = haversineDistance(lat, lng, ngoLat, ngoLng);

    // Score: max 100. Distance weighted 70%, urgency 30%
    const distScore = Math.max(0, 70 - (distKm / radiusKm) * 70);
    const urgencyScore = urgency * 30;
    const totalScore = distScore + urgencyScore;

    return {
      ngo: ngo.toObject(),
      distanceKm: Math.round(distKm * 10) / 10,
      urgencyFactor: Math.round(urgency * 100) / 100,
      score: Math.round(totalScore * 10) / 10,
    };
  });

  // Sort by score descending
  return scored.sort((a, b) => b.score - a.score);
};

// ─── Find nearest available volunteer for a donation ─────────────────────────
/**
 * Returns ranked volunteers available for pickup near the donation location
 * @param {string} donationId
 * @param {number} radiusKm
 * @returns {Array} ranked volunteers with score and distance
 */
const findNearestVolunteers = async (donationId, radiusKm = 15) => {
  const donation = await Donation.findById(donationId);
  if (!donation) throw new Error('Donation not found');

  const [lng, lat] = donation.location.coordinates;

  const volunteers = await User.find({
    role: 'volunteer',
    isActive: true,
    'volunteerDetails.availability': true,
    location: {
      $near: {
        $geometry: { type: 'Point', coordinates: [lng, lat] },
        $maxDistance: radiusKm * 1000,
      },
    },
  }).select('name email phone volunteerDetails location address');

  // Filter out volunteers with active pickups
  const active = await Pickup.find({
    status: { $in: ['assigned', 'accepted', 'en_route_pickup', 'picked_up', 'en_route_delivery'] },
  }).distinct('volunteerId');

  const activeSet = new Set(active.map(String));

  const available = volunteers.filter((v) => !activeSet.has(String(v._id)));

  const scored = available.map((vol) => {
    const [vLng, vLat] = vol.location.coordinates;
    const distKm = haversineDistance(lat, lng, vLat, vLng);
    const rating = vol.volunteerDetails?.rating || 0;
    const pickups = vol.volunteerDetails?.totalPickups || 0;

    // Score: distance 60%, rating 25%, experience 15%
    const distScore = Math.max(0, 60 - (distKm / radiusKm) * 60);
    const ratingScore = (rating / 5) * 25;
    const expScore = Math.min(15, (pickups / 20) * 15);
    const totalScore = distScore + ratingScore + expScore;

    return {
      volunteer: vol.toObject(),
      distanceKm: Math.round(distKm * 10) / 10,
      score: Math.round(totalScore * 10) / 10,
    };
  });

  return scored.sort((a, b) => b.score - a.score);
};

// ─── Auto-assign best volunteer ───────────────────────────────────────────────
/**
 * Automatically picks the best available volunteer and creates a Pickup record
 * @param {string} donationId
 * @param {string|null} ngoId - destination NGO (optional)
 * @param {string|null} requestId
 * @returns {object|null} created Pickup or null if no volunteers found
 */
const autoAssignVolunteer = async (donationId, ngoId = null, requestId = null) => {
  const ranked = await findNearestVolunteers(donationId, 20);

  if (!ranked.length) {
    logger.warn(`AutoAssign: No available volunteers found for donation ${donationId}`);
    return null;
  }

  const best = ranked[0];
  const volunteerId = best.volunteer._id;
  const donation = await Donation.findById(donationId);

  // Create pickup record
  const pickup = await Pickup.create({
    volunteerId,
    donationId,
    requestId,
    ngoId,
    pickupLocation: donation.location,
    status: 'assigned',
  });

  // Update donation
  await Donation.findByIdAndUpdate(donationId, {
    status: 'assigned',
    assignedVolunteer: volunteerId,
  });

  // Mark volunteer unavailable
  await User.findByIdAndUpdate(volunteerId, {
    'volunteerDetails.availability': false,
  });

  // Notify volunteer
  await Notification.create({
    userId: volunteerId,
    type: 'pickup_assigned',
    title: 'New Pickup Task Assigned',
    body: `You have been auto-assigned to pick up: ${donation.foodName}`,
    data: { pickupId: pickup._id, donationId },
    channels: ['in_app'],
    priority: 'high',
  });

  logger.info(`AutoAssign: Volunteer ${volunteerId} assigned to donation ${donationId} (score: ${best.score})`);
  return { pickup, volunteer: best };
};

// ─── Get area-wise matching stats ─────────────────────────────────────────────
const getMatchingStats = async () => {
  return await Donation.aggregate([
    {
      $group: {
        _id: '$address.city',
        total: { $sum: 1 },
        available: { $sum: { $cond: [{ $eq: ['$status', 'available'] }, 1, 0] } },
        delivered: { $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] } },
      },
    },
    { $sort: { total: -1 } },
    { $limit: 20 },
  ]);
};

// ─── Haversine distance formula ───────────────────────────────────────────────
const haversineDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371; // Earth radius in km
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const toRad = (deg) => (deg * Math.PI) / 180;

module.exports = {
  findNearestNGOs,
  findNearestVolunteers,
  autoAssignVolunteer,
  getMatchingStats,
  haversineDistance,
};
