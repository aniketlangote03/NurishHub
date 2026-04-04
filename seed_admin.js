/**
 * One-off admin bootstrap via API — credentials come from environment only.
 * Usage: set vars in .env next to this script or export them, then:
 *   node seed_admin.js
 *
 * Do not commit real passwords. Add .env to .gitignore (root .gitignore).
 */
require('dotenv').config({ path: require('path').join(__dirname, 'backend', '.env') });
const axios = require('axios');

const email = process.env.SEED_ADMIN_EMAIL || 'admin@system.com';
const password = process.env.SEED_ADMIN_PASSWORD;

(async () => {
  if (!password || password.length < 8) {
    console.error('Set SEED_ADMIN_PASSWORD in backend/.env (min 8 chars), or use backend/seed.js with SEED_DEFAULT_PASSWORD.');
    process.exit(1);
  }
  const base = process.env.API_URL || 'http://localhost:5000/api';
  try {
    const res = await axios.post(`${base.replace(/\/$/, '')}/auth/register`, {
      name: 'System Admin',
      email,
      password,
      role: 'admin',
    });
    console.log('Success:', res.data);
  } catch (err) {
    console.error('Error:', err.response?.data || err.message);
    process.exit(1);
  }
})();
