/**
 * Cron Jobs
 * Scheduled tasks for automated maintenance
 */

const cron = require('node-cron');
const Donation = require('../models/Donation');
const Notification = require('../models/Notification');
const logger = require('./logger');

const initCronJobs = () => {
  // ─── Auto-expire donations every 15 minutes ───────────────────────────────
  cron.schedule('*/15 * * * *', async () => {
    try {
      const result = await Donation.updateMany(
        {
          expiryTime: { $lt: new Date() },
          status: { $in: ['available', 'requested'] },
          isExpired: false,
        },
        { status: 'expired', isExpired: true }
      );

      if (result.modifiedCount > 0) {
        logger.info(`⏱️  Auto-expired ${result.modifiedCount} donations`);
      }
    } catch (err) {
      logger.error(`Cron auto-expire error: ${err.message}`);
    }
  });

  // ─── Warn donors about expiring donations (1 hour before) every 30 min ───
  cron.schedule('*/30 * * * *', async () => {
    try {
      const oneHourFromNow = new Date(Date.now() + 60 * 60 * 1000);
      const soon = new Date(Date.now() + 90 * 60 * 1000);

      const expiringSoon = await Donation.find({
        expiryTime: { $gte: oneHourFromNow, $lte: soon },
        status: 'available',
        isExpired: false,
      });

      for (const donation of expiringSoon) {
        await Notification.findOneAndUpdate(
          {
            userId: donation.donorId,
            type: 'donation_expired',
            'data.donationId': donation._id,
          },
          {
            $setOnInsert: {
              userId: donation.donorId,
              type: 'donation_expired',
              title: 'Donation Expiring Soon!',
              body: `Your donation "${donation.foodName}" expires in ~1 hour.`,
              data: { donationId: donation._id },
              channels: ['in_app'],
              priority: 'high',
            },
          },
          { upsert: true }
        );
      }
    } catch (err) {
      logger.error(`Cron expiry-warning error: ${err.message}`);
    }
  });

  logger.info('⏰ Cron jobs initialized');
};

module.exports = initCronJobs;
