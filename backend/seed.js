const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const Donation = require('./models/Donation');

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
    await User.deleteMany();
    await Donation.deleteMany();
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

    console.log('Seeding donations...');
    const donationsData = [
      {
        donorId: donor._id,
        foodType: 'cooked_food',
        foodName: 'Rice and Daal',
        description: 'Prepared today, good for 10 people.',
        quantity: { value: 10, unit: 'servings' },
        servingSize: 10,
        expiryTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
        location: { type: 'Point', coordinates: [72.8777, 19.076] },
        address: { city: 'Mumbai' },
      },
      {
        donorId: donor._id,
        foodType: 'raw_vegetables',
        foodName: 'Fresh Tomatoes and Onions',
        description: 'Fresh from the market',
        quantity: { value: 5, unit: 'kg' },
        servingSize: 20,
        expiryTime: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        location: { type: 'Point', coordinates: [72.8777, 19.076] },
        address: { city: 'Mumbai' },
      },
    ];

    await Donation.insertMany(donationsData);
    console.log('✅ Donations seeded successfully');

    console.log('\n🎉 ALL DONE! Log in with any seeded email and SEED_DEFAULT_PASSWORD from .env');
    process.exit();
  } catch (err) {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  }
};

seedDatabase();
