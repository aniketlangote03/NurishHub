/**
 * Matching Controller
 * Exposes the matching service via REST API
 */

const { asyncHandler, AppError } = require('../middleware/error');
const { sendSuccess } = require('../utils/apiResponse');
const {
  findNearestNGOs,
  findNearestVolunteers,
  autoAssignVolunteer,
  getMatchingStats,
} = require('../services/matchingService');

/**
 * @swagger
 * /api/matching/nearby:
 *   get:
 *     summary: Find nearby NGOs or donors for a donation
 *     tags: [Matching]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: donationId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [ngos, volunteers]
 *       - in: query
 *         name: radius
 *         schema:
 *           type: number
 *           default: 20
 */
// ─── @route  GET /api/matching/nearby ────────────────────────────────────────
const getNearbyMatches = asyncHandler(async (req, res) => {
  const { donationId, type = 'ngos', radius = 20 } = req.query;

  if (!donationId) throw new AppError('donationId query parameter is required.', 400);

  let results;
  if (type === 'volunteers') {
    results = await findNearestVolunteers(donationId, parseFloat(radius));
    return sendSuccess(res, {
      message: `Found ${results.length} available volunteers within ${radius}km.`,
      data: { volunteers: results, count: results.length, radius: `${radius}km` },
    });
  }

  results = await findNearestNGOs(donationId, parseFloat(radius));
  sendSuccess(res, {
    message: `Found ${results.length} NGOs within ${radius}km.`,
    data: { ngos: results, count: results.length, radius: `${radius}km` },
  });
});

// ─── @route  POST /api/matching/auto-assign ───────────────────────────────────
const autoAssign = asyncHandler(async (req, res) => {
  const { donationId, ngoId, requestId } = req.body;

  if (!donationId) throw new AppError('donationId is required.', 400);

  const result = await autoAssignVolunteer(donationId, ngoId, requestId);

  if (!result) {
    return sendSuccess(res, {
      statusCode: 200,
      message: 'No available volunteers found in range. Try expanding the radius.',
      data: { assigned: false },
    });
  }

  sendSuccess(res, {
    statusCode: 201,
    message: `Volunteer auto-assigned successfully (score: ${result.volunteer.score}).`,
    data: { assigned: true, pickup: result.pickup, volunteer: result.volunteer },
  });
});

// ─── @route  GET /api/matching/stats ─────────────────────────────────────────
const getStats = asyncHandler(async (req, res) => {
  const stats = await getMatchingStats();
  sendSuccess(res, {
    message: 'Area-wise matching statistics.',
    data: { areaStats: stats },
  });
});

// ─── @route  GET /api/matching/score ─────────────────────────────────────────
// Explain the matching score for a donation + user pair
const getMatchScore = asyncHandler(async (req, res) => {
  const { donationId, radius = 20 } = req.query;
  if (!donationId) throw new AppError('donationId is required.', 400);

  const [ngos, volunteers] = await Promise.all([
    findNearestNGOs(donationId, parseFloat(radius)),
    findNearestVolunteers(donationId, parseFloat(radius)),
  ]);

  sendSuccess(res, {
    message: 'Match scores for donation.',
    data: {
      donationId,
      radius: `${radius}km`,
      bestNGO: ngos[0] || null,
      bestVolunteer: volunteers[0] || null,
      allNGOs: ngos.slice(0, 5),
      allVolunteers: volunteers.slice(0, 5),
    },
  });
});

module.exports = { getNearbyMatches, autoAssign, getStats, getMatchScore };
