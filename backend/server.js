/**
 * ╔══════════════════════════════════════════════════════════════════════╗
 * ║     🍱  Food Donation & Redistribution System — Backend v2.0        ║
 * ║     Node.js · Express.js · MongoDB Atlas · Socket.io                ║
 * ╠══════════════════════════════════════════════════════════════════════╣
 * ║  Modules: Auth · Donations · NGO · Volunteer · Admin                ║
 * ║           Location · Notifications · Analytics · Matching           ║
 * ║           Real-time Chat · Feedback · File Upload                   ║
 * ╚══════════════════════════════════════════════════════════════════════╝
 */

require('dotenv').config();
const { assertProductionEnv, bootstrapJwtSecretsIfNeeded } = require('./config/validateEnv');
assertProductionEnv();
bootstrapJwtSecretsIfNeeded();

const express   = require('express');
const http      = require('http');
const { Server }= require('socket.io');
const cors      = require('cors');
const helmet    = require('helmet');
const morgan    = require('morgan');
const path      = require('path');
const fs        = require('fs');

// ── Config ─────────────────────────────────────────────────────────────────
const connectDB           = require('./config/db');
const logger              = require('./config/logger');
const { initSockets }     = require('./sockets/index');
const initCronJobs        = require('./config/cron');
const { setupSwagger }    = require('./config/swagger');
const { createDynamicOrigin } = require('./config/corsOrigins');

// ── Rate Limiters ──────────────────────────────────────────────────────────
const { globalLimiter, authLimiter, messageLimiter } = require('./middleware/rateLimiter');

// ── Routes ─────────────────────────────────────────────────────────────────
const authRoutes         = require('./routes/authRoutes');
const userRoutes         = require('./routes/userRoutes');
const donationRoutes     = require('./routes/donationRoutes');
const requestRoutes      = require('./routes/requestRoutes');
const pickupRoutes       = require('./routes/pickupRoutes');
const chatRoutes         = require('./routes/chatRoutes');
const feedbackRoutes     = require('./routes/feedbackRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const adminRoutes        = require('./routes/adminRoutes');
const matchingRoutes     = require('./routes/matchingRoutes');

// ── Error Middleware ────────────────────────────────────────────────────────
const { errorHandler, notFound } = require('./middleware/error');

// ── Ensure required directories exist ──────────────────────────────────────
['logs', 'uploads/donations', 'uploads/avatars'].forEach((dir) => {
  const fullPath = path.join(__dirname, dir);
  if (!fs.existsSync(fullPath)) fs.mkdirSync(fullPath, { recursive: true });
});

// ── Initialize Express ──────────────────────────────────────────────────────
const app        = express();
const httpServer = http.createServer(app);

// Render / reverse proxies — correct req.ip for express-rate-limit
if (process.env.RENDER || process.env.TRUST_PROXY === '1') {
  app.set('trust proxy', 1);
}

// ── Socket.io ───────────────────────────────────────────────────────────────
const dynamicOrigin = createDynamicOrigin();
const io = new Server(httpServer, {
  cors: {
    origin     : dynamicOrigin,
    methods    : ['GET', 'POST'],
    credentials: true,
  },
  pingTimeout : 60000,
  pingInterval: 25000,
});

const onlineUsers = initSockets(io);

// Make io & onlineUsers accessible inside controllers via req.app.get()
app.set('io', io);
app.set('onlineUsers', onlineUsers);

// ── Security Middleware ─────────────────────────────────────────────────────
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }, // allow serving uploads
  })
);

app.use(
  cors({
    origin     : dynamicOrigin,
    credentials: true,
    methods    : ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// ── Rate Limiting ───────────────────────────────────────────────────────────
app.use('/api/', globalLimiter);
app.use('/api/auth/login',    authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/messages',      messageLimiter);

// ── Body Parsing ────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── Static Files — uploaded images ─────────────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ── HTTP Logging ────────────────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'test') {
  app.use(
    morgan('combined', {
      stream: { write: (msg) => logger.http(msg.trim()) },
    })
  );
}

// ── Swagger API Docs ────────────────────────────────────────────────────────
setupSwagger(app); // Mounts at /api/docs (only if SWAGGER_ENABLED=true)

// ── Health Check ────────────────────────────────────────────────────────────
/**
 * @swagger
 * /health:
 *   get:
 *     summary: Server health check
 *     tags: [System]
 *     security: []
 *     responses:
 *       200:
 *         description: Server is healthy
 */
app.get('/health', (req, res) => {
  res.status(200).json({
    success    : true,
    status     : 'healthy',
    environment: process.env.NODE_ENV,
    timestamp  : new Date().toISOString(),
    uptime     : `${Math.floor(process.uptime())}s`,
    socketConnections: io.engine.clientsCount,
  });
});

// ── API Info ────────────────────────────────────────────────────────────────
app.get('/api', (req, res) => {
  res.status(200).json({
    success: true,
    name   : '🍱 Food Donation & Redistribution API',
    version: '2.0.0',
    docs   : `${req.protocol}://${req.get('host')}/api/docs`,
    health : `${req.protocol}://${req.get('host')}/health`,
    endpoints: {
      auth        : '/api/auth',
      users       : '/api/users',
      donations   : '/api/donations',
      requests    : '/api/requests',
      pickup      : '/api/pickup',
      matching    : '/api/matching',
      messages    : '/api/messages',
      feedback    : '/api/feedback',
      notifications: '/api/notifications',
      admin       : '/api/admin',
    },
  });
});

// ── Root Route ──────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: '🍱 NurishHub API is live and healthy!',
    docs: `${req.protocol}://${req.get('host')}/api/docs`,
    health: `${req.protocol}://${req.get('host')}/health`,
  });
});

// ── API Routes ──────────────────────────────────────────────────────────────
app.use('/api/auth',          authRoutes);
app.use('/api/users',         userRoutes);
app.use('/api/donations',     donationRoutes);
app.use('/api/requests',      requestRoutes);
app.use('/api/pickup',        pickupRoutes);
app.use('/api/matching',      matchingRoutes);
app.use('/api/messages',      chatRoutes);
app.use('/api/feedback',      feedbackRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin',         adminRoutes);

// ── 404 Handler ─────────────────────────────────────────────────────────────
app.use(notFound);

// ── Global Error Handler ─────────────────────────────────────────────────────
app.use(errorHandler);

// ── Start Server ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB(); // Connect to MongoDB Atlas

    httpServer.listen(PORT, () => {
      logger.info(`
╔═══════════════════════════════════════════════════════════╗
║  🍱  Food Donation & Redistribution System — v2.0         ║
║  🌐  API:    http://localhost:${PORT}/api                    ║
║  📚  Docs:   http://localhost:${PORT}/api/docs               ║
║  💚  Health: http://localhost:${PORT}/health                 ║
║  🔌  Socket.io: enabled                                    ║
║  📦  Environment: ${(process.env.NODE_ENV || 'development').padEnd(12)}                    ║
║  🗄️  Database: MongoDB Atlas                               ║
╚═══════════════════════════════════════════════════════════╝`
      );
    });

    initCronJobs(); // Start scheduled auto-expire jobs

  } catch (error) {
    logger.error(`❌ Server failed to start: ${error.message}`);
    process.exit(1);
  }
};

// ── Graceful Shutdown ────────────────────────────────────────────────────────
const gracefulShutdown = (signal) => {
  logger.info(`\n${signal} received — shutting down gracefully...`);
  httpServer.close(async () => {
    const mongoose = require('mongoose');
    await mongoose.connection.close();
    logger.info('✅ MongoDB connection closed. Server stopped.');
    process.exit(0);
  });
  setTimeout(() => { logger.error('⏰ Forced shutdown.'); process.exit(1); }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT',  () => gracefulShutdown('SIGINT'));

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled Rejection:', reason);
});
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

startServer();

module.exports = { app, httpServer }; // Export for Jest tests
