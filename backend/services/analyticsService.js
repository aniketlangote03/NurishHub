/**
 * Analytics Service
 * Complex aggregation pipelines for platform analytics
 */

const Donation = require('../models/Donation');
const User = require('../models/User');
const Request = require('../models/Request');
const Pickup = require('../models/Pickup');
const Feedback = require('../models/Feedback');

/**
 * Get comprehensive platform analytics
 * @param {number} days - number of days to look back
 */
const getPlatformAnalytics = async (days = 30) => {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const [
    userStats,
    donationStats,
    donationByStatus,
    donationByFoodType,
    areaWiseDistribution,
    requestStats,
    pickupStats,
    ratingStats,
    donationsOverTime,
    topDonors,
    topNGOs,
    wasteReduced,
  ] = await Promise.all([

    // ── User stats ──────────────────────────────────────────────────────────
    User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 },
          active: { $sum: { $cond: ['$isActive', 1, 0] } },
        },
      },
    ]),

    // ── Donation totals ──────────────────────────────────────────────────────
    Donation.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          thisMonth: {
            $sum: { $cond: [{ $gte: ['$createdAt', since] }, 1, 0] },
          },
          totalQuantityKg: {
            $sum: {
              $cond: [{ $eq: ['$quantity.unit', 'kg'] }, '$quantity.value', 0],
            },
          },
          avgServingSize: { $avg: '$servingSize' },
        },
      },
    ]),

    // ── Donations by status ──────────────────────────────────────────────────
    Donation.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),

    // ── Donations by food type ───────────────────────────────────────────────
    Donation.aggregate([
      { $group: { _id: '$foodType', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]),

    // ── Area-wise donation distribution ──────────────────────────────────────
    Donation.aggregate([
      {
        $group: {
          _id: '$address.city',
          total: { $sum: 1 },
          delivered: { $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] } },
          available: { $sum: { $cond: [{ $eq: ['$status', 'available'] }, 1, 0] } },
        },
      },
      { $match: { _id: { $ne: null } } },
      { $sort: { total: -1 } },
      { $limit: 15 },
    ]),

    // ── Request stats ────────────────────────────────────────────────────────
    Request.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]),

    // ── Pickup stats ─────────────────────────────────────────────────────────
    Pickup.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]),

    // ── Platform rating ──────────────────────────────────────────────────────
    Feedback.aggregate([
      { $match: { isHidden: false } },
      {
        $group: {
          _id: '$category',
          avgRating: { $avg: '$rating' },
          count: { $sum: 1 },
        },
      },
    ]),

    // ── Donations over time (daily chart data) ───────────────────────────────
    Donation.aggregate([
      { $match: { createdAt: { $gte: since } } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' },
          },
          count: { $sum: 1 },
          delivered: {
            $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] },
          },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } },
      {
        $project: {
          date: {
            $dateFromParts: {
              year: '$_id.year',
              month: '$_id.month',
              day: '$_id.day',
            },
          },
          count: 1,
          delivered: 1,
          _id: 0,
        },
      },
    ]),

    // ── Top 5 donors ─────────────────────────────────────────────────────────
    Donation.aggregate([
      { $match: { status: { $in: ['delivered', 'picked_up'] } } },
      { $group: { _id: '$donorId', donations: { $sum: 1 } } },
      { $sort: { donations: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'donor',
        },
      },
      { $unwind: '$donor' },
      { $project: { name: '$donor.name', email: '$donor.email', donations: 1 } },
    ]),

    // ── Top 5 NGOs ───────────────────────────────────────────────────────────
    Request.aggregate([
      { $match: { status: 'fulfilled' } },
      { $group: { _id: '$ngoId', fulfilled: { $sum: 1 } } },
      { $sort: { fulfilled: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'ngo',
        },
      },
      { $unwind: '$ngo' },
      { $project: { name: '$ngo.name', email: '$ngo.email', fulfilled: 1 } },
    ]),

    // ── Estimated food waste reduced (kg delivered) ────────────────────────
    Donation.aggregate([
      { $match: { status: 'delivered', 'quantity.unit': 'kg' } },
      { $group: { _id: null, totalKg: { $sum: '$quantity.value' } } },
    ]),
  ]);

  // Format user stats into a map
  const users = userStats.reduce(
    (acc, r) => ({ ...acc, [r._id]: { total: r.count, active: r.active } }),
    {}
  );

  const donations = donationStats[0] || { total: 0, thisMonth: 0, totalQuantityKg: 0 };

  const statusMap = donationByStatus.reduce((acc, r) => ({ ...acc, [r._id]: r.count }), {});

  return {
    period: `${days} days`,
    generatedAt: new Date().toISOString(),
    users,
    donations: {
      ...donations,
      byStatus: statusMap,
      byFoodType: donationByFoodType,
    },
    requests: requestStats.reduce((acc, r) => ({ ...acc, [r._id]: r.count }), {}),
    pickups: pickupStats.reduce((acc, r) => ({ ...acc, [r._id]: r.count }), {}),
    ratings: ratingStats,
    areaWiseDistribution,
    donationsOverTime,
    topDonors,
    topNGOs,
    impact: {
      wasteReducedKg: wasteReduced[0]?.totalKg || 0,
      estimatedPeopleFed: Math.round((wasteReduced[0]?.totalKg || 0) * 4),
    },
  };
};

module.exports = { getPlatformAnalytics };
