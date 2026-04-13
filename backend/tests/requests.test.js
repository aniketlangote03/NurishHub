/**
 * Request Test Suite
 * Tests NGO making a request and an Admin approving it.
 */

process.env.NODE_ENV = 'test';

const request = require('supertest');
const mongoose = require('mongoose');
const { app } = require('../server');
const User = require('../models/User');
const Donation = require('../models/Donation');
const Request = require('../models/Request');

const TIMESTAMP = Date.now();

const donorUser = {
  name: `DonorTest_${TIMESTAMP}`,
  email: `donor_${TIMESTAMP}@test.com`,
  password: 'Password123',
  role: 'donor'
};

const ngoUser = {
  name: `NgoTest_${TIMESTAMP}`,
  email: `ngo_${TIMESTAMP}@test.com`,
  password: 'Password123',
  role: 'ngo'
};

const adminUser = {
  name: `AdminTestReq_${TIMESTAMP}`,
  email: `adminreq_${TIMESTAMP}@test.com`,
  password: 'Password123',
  role: 'admin'
};

let donorToken = '';
let ngoToken = '';
let adminToken = '';

let savedDonationId = '';
let savedRequestId = '';

afterAll(async () => {
  await User.deleteMany({ email: { $in: [donorUser.email, ngoUser.email, adminUser.email] } });
  await Donation.deleteMany({ foodName: 'Test Food Automate' });
  await Request.deleteMany({ message: 'We need this' });
  await mongoose.connection.close();
});

describe('NGO Request Flow Automation', () => {
  it('should initialize and login users', async () => {
    await User.create(adminUser);
    
    // Register Donor
    let res = await request(app).post('/api/auth/register').send(donorUser);
    donorToken = res.body.data.accessToken;

    // Register NGO
    res = await request(app).post('/api/auth/register').send(ngoUser);
    ngoToken = res.body.data.accessToken;

    // Login Admin
    res = await request(app).post('/api/auth/login').send({ email: adminUser.email, password: adminUser.password });
    adminToken = res.body.data.accessToken;
  });

  it('should create a donation by the donor', async () => {
    const res = await request(app)
      .post('/api/donations')
      .set('Authorization', `Bearer ${donorToken}`)
      .send({
        foodType: 'cooked_food',
        foodName: 'Test Food Automate',
        quantity: { value: 10, unit: 'kg' },
        expiryTime: new Date(Date.now() + 86400000).toISOString(),
        location: { type: 'Point', coordinates: [77.209, 28.6139] },
        address: { city: 'New Delhi' }
      });

    expect(res.status).toBe(201);
    savedDonationId = res.body.data.donation._id;
  });

  it('should allow NGO to request the donation', async () => {
    const res = await request(app)
      .post('/api/requests')
      .set('Authorization', `Bearer ${ngoToken}`)
      .send({
        donationId: savedDonationId,
        message: 'We need this',
        urgencyLevel: 'high'
      });

    expect(res.status).toBe(201);
    savedRequestId = res.body.data.request._id;
  });

  it('should allow admin to approve the NGO request', async () => {
    const res = await request(app)
      .put(`/api/requests/${savedRequestId}/approve`)
      .set('Authorization', `Bearer ${adminToken}`);

    // Assuming our logic correctly handles the request and permits the admin
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe('Request approved successfully.');
    expect(res.body.data.request.status).toBe('approved');
  });
});
