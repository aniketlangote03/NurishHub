/**
 * Email Service (Nodemailer)
 * Handles all transactional email notifications
 */

const nodemailer = require('nodemailer');
const logger = require('../config/logger');

// ─── Create transporter ────────────────────────────────────────────────────────
let transporter;

const getTransporter = () => {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_PORT, 10) || 587,
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      tls: {
        rejectUnauthorized: false, // For development
      },
    });
  }
  return transporter;
};

// ─── Base send function ────────────────────────────────────────────────────────
const sendEmail = async ({ to, subject, html, text }) => {
  // Skip email in test/development if not configured
  if (!process.env.EMAIL_USER || process.env.EMAIL_USER === 'your_email@gmail.com') {
    logger.warn(`[Email skipped - not configured] To: ${to} | Subject: ${subject}`);
    return null;
  }

  try {
    const info = await getTransporter().sendMail({
      from: process.env.EMAIL_FROM || '"Food Donation System" <noreply@fooddonation.com>',
      to,
      subject,
      text: text || subject,
      html,
    });
    logger.info(`Email sent to ${to}: ${info.messageId}`);
    return info;
  } catch (error) {
    logger.error(`Email failed to ${to}: ${error.message}`);
    // Don't throw — email is non-critical
    return null;
  }
};

// ─── Email Templates ───────────────────────────────────────────────────────────

const baseTemplate = (title, body) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: #fff; border-radius: 8px; padding: 30px; }
    .header { background: linear-gradient(135deg, #16a34a, #15803d); color: white; padding: 20px; border-radius: 6px; margin-bottom: 20px; }
    .header h1 { margin: 0; font-size: 22px; }
    .body { color: #333; line-height: 1.6; }
    .btn { display: inline-block; background: #16a34a; color: white; padding: 12px 24px;
           border-radius: 6px; text-decoration: none; margin-top: 16px; font-weight: bold; }
    .footer { margin-top: 30px; color: #999; font-size: 12px; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header"><h1>🍱 Food Donation System</h1></div>
    <div class="body">
      <h2>${title}</h2>
      ${body}
    </div>
    <div class="footer">This is an automated message. Please do not reply.</div>
  </div>
</body>
</html>
`;

// ─── Specific Email Senders ────────────────────────────────────────────────────

/**
 * Welcome email on registration
 */
const sendWelcomeEmail = async (user) => {
  await sendEmail({
    to: user.email,
    subject: 'Welcome to Food Donation & Redistribution System 🍱',
    html: baseTemplate(
      `Welcome, ${user.name}!`,
      `<p>Your account has been created successfully as a <strong>${user.role}</strong>.</p>
       <p>You can now log in and start making a difference by connecting food donors with those who need it most.</p>
       <a href="${process.env.CLIENT_URL}/login" class="btn">Login to Your Account</a>`
    ),
  });
};

/**
 * Donation request notification to donor
 */
const sendRequestNotificationEmail = async (donor, ngo, donation) => {
  await sendEmail({
    to: donor.email,
    subject: `New Request for Your Donation: ${donation.foodName}`,
    html: baseTemplate(
      'Your Donation Has Been Requested!',
      `<p>Hi <strong>${donor.name}</strong>,</p>
       <p><strong>${ngo.name}</strong> has requested your donation: <strong>${donation.foodName}</strong>.</p>
       <p>Please log in to review and approve/reject the request.</p>
       <a href="${process.env.CLIENT_URL}/donations/${donation._id}" class="btn">View Request</a>`
    ),
  });
};

/**
 * Request approved notification to NGO
 */
const sendRequestApprovedEmail = async (ngo, donation) => {
  await sendEmail({
    to: ngo.email,
    subject: `✅ Your Request for "${donation.foodName}" was Approved!`,
    html: baseTemplate(
      'Request Approved!',
      `<p>Hi <strong>${ngo.name}</strong>,</p>
       <p>Great news! Your request for <strong>${donation.foodName}</strong> has been approved.</p>
       <p>A volunteer will be assigned shortly for pickup. Stay tuned for updates!</p>
       <a href="${process.env.CLIENT_URL}/requests" class="btn">View Your Requests</a>`
    ),
  });
};

/**
 * Pickup assigned notification to volunteer
 */
const sendPickupAssignedEmail = async (volunteer, donation) => {
  await sendEmail({
    to: volunteer.email,
    subject: `📦 New Pickup Task: ${donation.foodName}`,
    html: baseTemplate(
      'You Have a New Pickup Task!',
      `<p>Hi <strong>${volunteer.name}</strong>,</p>
       <p>You've been assigned to pick up: <strong>${donation.foodName}</strong>.</p>
       <p>Please log in to view the details and start the pickup process.</p>
       <a href="${process.env.CLIENT_URL}/pickups" class="btn">View Pickup Details</a>`
    ),
  });
};

/**
 * Donation expiry warning to donor
 */
const sendExpiryWarningEmail = async (donor, donation) => {
  await sendEmail({
    to: donor.email,
    subject: `⏰ Donation Expiring Soon: ${donation.foodName}`,
    html: baseTemplate(
      'Your Donation is Expiring Soon!',
      `<p>Hi <strong>${donor.name}</strong>,</p>
       <p>Your donation <strong>${donation.foodName}</strong> is expiring in approximately 1 hour.</p>
       <p>If it's still available, consider extending the expiry time to give NGOs more time to request it.</p>
       <a href="${process.env.CLIENT_URL}/donations/${donation._id}" class="btn">Update Donation</a>`
    ),
  });
};

module.exports = {
  sendEmail,
  sendWelcomeEmail,
  sendRequestNotificationEmail,
  sendRequestApprovedEmail,
  sendPickupAssignedEmail,
  sendExpiryWarningEmail,
};
