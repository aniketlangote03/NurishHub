const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const Donation = require('./models/Donation');
const Request = require('./models/Request');
const Pickup = require('./models/Pickup');

// Load environment variables (never commit real .env)
dotenv.config();

/**
 * All seeded users share this password for local/demo only.
 * Set SEED_DEFAULT_PASSWORD in .env — do not hardcode secrets in this file.
 */
const seedPassword = process.env.SEED_DEFAULT_PASSWORD;
if (!seedPassword || seedPassword.length < 8) {
  console.error(
    '❌ Set SEED_DEFAULT_PASSWORD in backend/.env (min 8 chars). See .env.example'
  );
  process.exit(1);
}

const usersData = [
  {
    name: 'System Admin',
    email: 'admin@system.com',
    password: seedPassword,
    role: 'admin',
    phone: '1234567890',
  },
  {
    name: 'John Donor',
    email: 'donor@example.com',
    password: seedPassword,
    role: 'donor',
    phone: '9876543210',
    address: { street: '123 Main St', city: 'Mumbai' },
    location: { type: 'Point', coordinates: [72.8777, 19.076] },
  },
  {
    name: 'Helping Hands NGO',
    email: 'ngo@example.com',
    password: seedPassword,
    role: 'ngo',
    phone: '1122334455',
    ngoDetails: {
      registrationNumber: 'NGO12345',
      description: 'Helping the needy',
      verified: true,
    },
    address: { street: '456 NGO Lane', city: 'Mumbai' },
    location: { type: 'Point', coordinates: [72.88, 19.08] },
  },
  {
    name: 'Mike Volunteer',
    email: 'volunteer@example.com',
    password: seedPassword,
    role: 'volunteer',
    phone: '5566778899',
    volunteerDetails: { vehicleType: 'bike', availability: true, totalPickups: 5 },
    address: { street: '789 Vol Street', city: 'Mumbai' },
    location: { type: 'Point', coordinates: [72.89, 19.09] },
  },
];

const seedDatabase = async () => {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    console.log('Clearing old data...');
    await Pickup.deleteMany();
    await Request.deleteMany();
    await Donation.deleteMany();
    await User.deleteMany();
    console.log('✅ Old data cleared');

    console.log('Seeding users...');
    const createdUsers = [];
    for (const u of usersData) {
      const user = await User.create(u);
      createdUsers.push(user);
    }
    console.log('✅ Users created (same password as SEED_DEFAULT_PASSWORD in .env):');
    createdUsers.forEach((u) => console.log(`  - ${u.role}: ${u.email}`));

    const donor = createdUsers.find((u) => u.role === 'donor');
    const ngo = createdUsers.find((u) => u.role === 'ngo');

    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const inFiveDays = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);

    console.log('Seeding donations + demo NGO requests...');

    // Donation A — pending + PENDING request → approve as donor/admin on /requests
    const donationA = await Donation.create({
      donorId: donor._id,
      foodType: 'cooked_food',
      foodName: 'Rice and Daal (demo — approve me)',
      description: 'Prepared today. NGO requested — log in as donor or admin → NGO Requests → Accept NGO.',
      dietType: 'veg',
      quantity: { value: 10, unit: 'servings' },
      servingSize: 10,
      expiryTime: tomorrow,
      location: { type: 'Point', coordinates: [72.8777, 19.076] },
      address: { street: '123 Main St', city: 'Mumbai', country: 'India' },
      status: 'requested',
      pickupContactPhone: donor.phone,
    });

    await Request.create({
      ngoId: ngo._id,
      donationId: donationA._id,
      status: 'pending',
      message: 'Demo request: we can collect today evening.',
      urgencyLevel: 'high',
      beneficiaryCount: 10,
    });

    // Donation B — already ACCEPTED by NGO → admin can assign volunteer immediately
    const donationB = await Donation.create({
      donorId: donor._id,
      foodType: 'bakery',
      foodName: 'Bread & pastries (demo — assign volunteer)',
      description: 'Pre-approved for pickup demo. Log in as admin → Admin panel → assign Mike Volunteer.',
      dietType: 'veg',
      quantity: { value: 3, unit: 'boxes' },
      servingSize: 15,
      expiryTime: inFiveDays,
      location: { type: 'Point', coordinates: [72.8777, 19.076] },
      address: { street: '123 Main St', city: 'Mumbai', country: 'India' },
      status: 'accepted',
      allocatedTo: ngo._id,
      pickupContactPhone: donor.phone,
    });

    await Request.create({
      ngoId: ngo._id,
      donationId: donationB._id,
      status: 'approved',
      message: 'Demo: pre-approved for admin → volunteer assignment flow.',
      urgencyLevel: 'medium',
      beneficiaryCount: 15,
      approvedAt: new Date(),
    });

    // Extra open donation — NGO can click "Request food" from listing (optional manual test)
    await Donation.create({
      donorId: donor._id,
      foodType: 'fruits',
      foodName: 'Mixed fruits (demo — request from listing)',
      description: 'Still pending — browse as NGO and tap Request food.',
      dietType: 'veg',
      quantity: { value: 8, unit: 'kg' },
      servingSize: 25,
      expiryTime: inFiveDays,
      location: { type: 'Point', coordinates: [72.88, 19.08] },
      address: { street: '123 Main St', city: 'Mumbai', country: 'India' },
      status: 'pending',
      pickupContactPhone: donor.phone,
    });

    console.log('✅ Donations + requests seeded');

    console.log('\n── Demo flows (same password for all users: your SEED_DEFAULT_PASSWORD) ──');
    console.log('1) Approve NGO:  donor@example.com OR admin@system.com  →  /requests  →  Accept NGO on "Rice and Daal"');
    console.log('2) Assign pickup: admin@system.com  →  /admin  →  assign volunteer on "Bread & pastries"');
    console.log('3) Volunteer:     volunteer@example.com  →  /pickups  →  advance delivery steps');
    console.log('4) NGO request:   ngo@example.com  →  /donations  →  Request food on "Mixed fruits"');
    console.log('\n🎉 ALL DONE!');
    process.exit();
  } catch (err) {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  }
};

seedDatabase();
