/**
 * ╔══════════════════════════════════════════════════════════════════════╗
 * ║  Authentication Test Suite — Jest + Supertest                       ║
 * ║  Tests: Register · Login · Protected Route · Refresh · Logout       ║
 * ║          Role-based access (admin-only endpoint)                    ║
 * ╚══════════════════════════════════════════════════════════════════════╝
 *
 * Run:  cd backend && npm test -- --testPathPattern=auth.test.js
 *
 * Requires backend/.env to be present (test uses NODE_ENV=test so
 * morgan / some side effects are suppressed).
 */

process.env.NODE_ENV = 'test';

const request = require('supertest');
const mongoose = require('mongoose');
const { app } = require('../server');

// ── Helpers ────────────────────────────────────────────────────────────────────
const TIMESTAMP = Date.now();
const testUser = {
  name    : `TestUser_${TIMESTAMP}`,
  email   : `testuser_${TIMESTAMP}@example.com`,
  password: 'Test@1234',
  role    : 'donor',
};

const adminUser = {
  name    : `AdminTest_${TIMESTAMP}`,
  email   : `admintest_${TIMESTAMP}@example.com`,
  password: 'Admin@1234',
  role    : 'admin',
};

// Shared state between tests
let accessToken   = '';
let refreshToken  = '';
let adminToken    = '';
let adminUserId   = '';

// ── Setup / Teardown ───────────────────────────────────────────────────────────
afterAll(async () => {
  // Clean up test users from DB
  const User = require('../models/User');
  await User.deleteMany({ email: { $in: [testUser.email, adminUser.email] } });
  await mongoose.connection.close();
});

// ═══════════════════════════════════════════════════════════════════════════════
// 1. REGISTER
// ═══════════════════════════════════════════════════════════════════════════════
describe('POST /api/auth/register', () => {
  it('should register a new donor user successfully', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(testUser)
      .expect('Content-Type', /json/)
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.user?.email).toBe(testUser.email);
  });

  it('should return 409 for duplicate email registration', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(testUser)
      .expect(409);

    expect(res.body.success).toBe(false);
  });

  it('should return 422 when required fields are missing', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'incomplete@example.com' })
      .expect(422);

    expect(res.body.success).toBe(false);
  });

  it('should register an admin user for subsequent role tests via DB', async () => {
    const User = require('../models/User');
    const admin = await User.create(adminUser);
    adminUserId = admin._id.toString();
    expect(adminUserId).toBeDefined();
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 2. LOGIN
// ═══════════════════════════════════════════════════════════════════════════════
describe('POST /api/auth/login', () => {
  it('should login the donor user and return valid JWT tokens', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: testUser.email, password: testUser.password })
      .expect('Content-Type', /json/)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data?.accessToken).toBeDefined();
    expect(res.body.data?.refreshToken).toBeDefined();

    // Save for subsequent tests
    accessToken  = res.body.data.accessToken;
    refreshToken = res.body.data.refreshToken;
  });

  it('should login the admin user and save admin token', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: adminUser.email, password: adminUser.password })
      .expect(200);

    expect(res.body.success).toBe(true);
    adminToken = res.body.data.accessToken;
  });

  it('should return 401 for a wrong password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: testUser.email, password: 'wrongpassword' })
      .expect(401);

    expect(res.body.success).toBe(false);
  });

  it('should return 401 for a non-existent email', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@nowhere.com', password: 'whatever' })
      .expect(401);

    expect(res.body.success).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 3. PROTECTED ROUTE ACCESS
// ═══════════════════════════════════════════════════════════════════════════════
describe('GET /api/users/profile — protected route', () => {
  it('should return 401 when no token is provided', async () => {
    const res = await request(app)
      .get('/api/users/profile')
      .expect(401);

    expect(res.body.success).toBe(false);
  });

  it('should return 401 for a malformed / invalid token', async () => {
    const res = await request(app)
      .get('/api/users/profile')
      .set('Authorization', 'Bearer this.is.not.valid')
      .expect(401);

    expect(res.body.success).toBe(false);
  });

  it('should return the current user profile with a valid token', async () => {
    const res = await request(app)
      .get('/api/users/profile')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data?.user?.email).toBe(testUser.email);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 4. TOKEN REFRESH
// ═══════════════════════════════════════════════════════════════════════════════
describe('POST /api/auth/refresh', () => {
  it('should return 400 when no refresh token is provided', async () => {
    const res = await request(app)
      .post('/api/auth/refresh')
      .send({})
      .expect(400);

    expect(res.body.success).toBe(false);
  });

  it('should issue a new access token with a valid refresh token', async () => {
    const res = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data?.accessToken).toBeDefined();

    // Update for further tests
    accessToken = res.body.data.accessToken;
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 5. ROLE-BASED ACCESS (admin-only endpoint)
// ═══════════════════════════════════════════════════════════════════════════════
describe('GET /api/admin/dashboard-summary — admin-only route', () => {
  it('should return 403 when accessed with a non-admin (donor) token', async () => {
    const res = await request(app)
      .get('/api/admin/dashboard-summary')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(403);

    expect(res.body.success).toBe(false);
  });

  it('should return 200 with dashboard data when accessed by an admin', async () => {
    const res = await request(app)
      .get('/api/admin/dashboard-summary')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 6. LOGOUT
// ═══════════════════════════════════════════════════════════════════════════════
describe('POST /api/auth/logout', () => {
  it('should return 401 when logging out without a token', async () => {
    const res = await request(app)
      .post('/api/auth/logout')
      .expect(401);

    expect(res.body.success).toBe(false);
  });

  it('should successfully log out the authenticated user', async () => {
    const res = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);
  });
});
