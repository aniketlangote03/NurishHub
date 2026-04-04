/**
 * API Test Suite — Food Donation & Redistribution System
 * Tests: Auth, Donations, Requests (integration tests via supertest)
 */

const request = require('supertest');
const mongoose = require('mongoose');
const { app } = require('../server');

// ─── Test constants ────────────────────────────────────────────────────────
const TEST_DB = process.env.MONGO_URI_TEST || 'mongodb://localhost:27017/food_donation_test';

let donorToken, ngoToken, adminToken;
let donationId, requestId;

// ─── Setup / Teardown ──────────────────────────────────────────────────────
beforeAll(async () => {
  // Connect to test database
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(TEST_DB);
  }
});

afterAll(async () => {
  // Clean up test data
  const db = mongoose.connection.db;
  await db.collection('users').deleteMany({ email: /@test\.com$/ });
  await db.collection('donations').deleteMany({ foodName: /^TEST_/ });
  await mongoose.connection.close();
});

// ─────────────────────────────────────────────────────────────────────────────
// AUTH TESTS
// ─────────────────────────────────────────────────────────────────────────────
describe('🔐 Auth — POST /api/auth/register', () => {
  it('should register a donor', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name    : 'Test Donor',
      email   : 'donor@test.com',
      password: 'password1',
      role    : 'donor',
    });
    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.accessToken).toBeDefined();
    donorToken = res.body.data.accessToken;
  });

  it('should register an NGO', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name    : 'Test NGO',
      email   : 'ngo@test.com',
      password: 'password1',
      role    : 'ngo',
    });
    expect(res.statusCode).toBe(201);
    ngoToken = res.body.data.accessToken;
  });

  it('should reject duplicate email', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name    : 'Duplicate',
      email   : 'donor@test.com',
      password: 'password1',
    });
    expect(res.statusCode).toBe(409);
  });

  it('should reject short password', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name    : 'Bad Pass',
      email   : 'bad@test.com',
      password: '12',
    });
    expect(res.statusCode).toBe(422);
  });
});

describe('🔐 Auth — POST /api/auth/login', () => {
  it('should login with correct credentials', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email   : 'donor@test.com',
      password: 'password1',
    });
    expect(res.statusCode).toBe(200);
    expect(res.body.data.accessToken).toBeDefined();
    donorToken = res.body.data.accessToken;
  });

  it('should reject wrong password', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email   : 'donor@test.com',
      password: 'wrongpass',
    });
    expect(res.statusCode).toBe(401);
  });
});

describe('🔐 Auth — GET /api/auth/me', () => {
  it('should return current user profile', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${donorToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.data.user.email).toBe('donor@test.com');
  });

  it('should reject without token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.statusCode).toBe(401);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// DONATION TESTS
// ─────────────────────────────────────────────────────────────────────────────
describe('🍱 Donations — POST /api/donations', () => {
  it('should create a donation as donor', async () => {
    const expiryTime = new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(); // 12h from now
    const res = await request(app)
      .post('/api/donations')
      .set('Authorization', `Bearer ${donorToken}`)
      .send({
        foodName  : 'TEST_Cooked Rice',
        foodType  : 'cooked_food',
        quantity  : { value: 5, unit: 'kg' },
        expiryTime,
        location  : { type: 'Point', coordinates: [77.5946, 12.9716] },
        address   : { city: 'Bangalore', state: 'Karnataka', country: 'India' },
      });
    expect(res.statusCode).toBe(201);
    expect(res.body.data.donation.foodName).toBe('TEST_Cooked Rice');
    donationId = res.body.data.donation._id;
  });

  it('should reject donation with past expiry', async () => {
    const res = await request(app)
      .post('/api/donations')
      .set('Authorization', `Bearer ${donorToken}`)
      .send({
        foodName  : 'TEST_Bad',
        foodType  : 'fruits',
        quantity  : { value: 1, unit: 'kg' },
        expiryTime: new Date(Date.now() - 1000).toISOString(),
        location  : { type: 'Point', coordinates: [77.5946, 12.9716] },
        address   : { city: 'Bangalore' },
      });
    expect(res.statusCode).toBe(422);
  });

  it('should reject donation creation by NGO', async () => {
    const res = await request(app)
      .post('/api/donations')
      .set('Authorization', `Bearer ${ngoToken}`)
      .send({
        foodName  : 'TEST_NGO Attempt',
        foodType  : 'grains',
        quantity  : { value: 2, unit: 'kg' },
        expiryTime: new Date(Date.now() + 3600000).toISOString(),
        location  : { type: 'Point', coordinates: [77.5946, 12.9716] },
        address   : { city: 'Bangalore' },
      });
    expect(res.statusCode).toBe(403);
  });
});

describe('🍱 Donations — GET /api/donations', () => {
  it('should list donations', async () => {
    const res = await request(app)
      .get('/api/donations')
      .set('Authorization', `Bearer ${ngoToken}`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.data.donations)).toBe(true);
  });

  it('should get donation by ID', async () => {
    const res = await request(app)
      .get(`/api/donations/${donationId}`)
      .set('Authorization', `Bearer ${ngoToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.data.donation._id).toBe(donationId);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// HEALTH CHECK
// ─────────────────────────────────────────────────────────────────────────────
describe('💚 Health Check', () => {
  it('GET /health should return healthy status', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('healthy');
  });

  it('GET /api should return API info', async () => {
    const res = await request(app).get('/api');
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// NGO REQUEST TESTS
// ─────────────────────────────────────────────────────────────────────────────
describe('📋 Requests — POST /api/requests', () => {
  it('should allow NGO to request a donation', async () => {
    const res = await request(app)
      .post('/api/requests')
      .set('Authorization', `Bearer ${ngoToken}`)
      .send({ donationId, message: 'We need this urgently', urgencyLevel: 'high' });
    expect([201, 409]).toContain(res.statusCode); // 409 if already requested
    if (res.statusCode === 201) requestId = res.body.data.request._id;
  });

  it('should deny donor from creating a request', async () => {
    const res = await request(app)
      .post('/api/requests')
      .set('Authorization', `Bearer ${donorToken}`)
      .send({ donationId });
    expect(res.statusCode).toBe(403);
  });
});
