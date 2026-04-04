/**
 * Production startup: require MongoDB; optionally bootstrap JWT + CORS hints for Render.
 */

const crypto = require('crypto');
const {
  isProductionLike,
  isPlaceholderMongoUri,
  isWeakJwtSecret,
} = require('./envShared');

function assertProductionEnv() {
  if (process.env.NODE_ENV === 'test') return;
  if (!isProductionLike()) return;

  const missing = [];
  if (isPlaceholderMongoUri(process.env.MONGO_URI)) missing.push('MONGO_URI — Paste your MongoDB Atlas SRV string (Database → Connect → Drivers). In Atlas → Network Access, allow access from Render (e.g. 0.0.0.0/0 for development).');
  if (isWeakJwtSecret(process.env.JWT_SECRET)) missing.push('JWT_SECRET — Set a long random string (32+ characters). In Render: Environment → add key or use Generate.');
  if (isWeakJwtSecret(process.env.JWT_REFRESH_SECRET)) missing.push('JWT_REFRESH_SECRET — Set a different long random string (32+ characters).');
  if (!String(process.env.CLIENT_URL || '').trim()) missing.push('CLIENT_URL — Set to your Netlify URL (https://your-site.netlify.app). Needed for CORS and email links.');
  if (!String(process.env.SOCKET_CORS_ORIGIN || '').trim()) missing.push('SOCKET_CORS_ORIGIN — Set to the same Netlify URL as CLIENT_URL for real-time chat.');

  if (missing.length === 0) return;

  console.error('\n❌ Production environment: fix the following in Render → your Web Service → Environment → Environment Variables, then redeploy:');
  missing.forEach((msg, i) => console.error(`   ${i + 1}. ${msg}`));
  
  console.error('\n   Netlify (Site → Environment variables, then redeploy):');
  console.error('   • VITE_API_URL = https://<your-service>.onrender.com/api');
  console.error('   • VITE_SOCKET_URL = https://<your-service>.onrender.com\n');
  
  process.exit(1);
}

/**
 * On Render/production, generate JWT secrets if unset so the local process CAN boot,
 * but assertProductionEnv() will still block if they are missing on a real host.
 */
function bootstrapJwtSecretsIfNeeded() {
  if (process.env.NODE_ENV === 'test') return;
  // Local development only — production MUST have fixed secrets for persistence
  if (isProductionLike() && !process.env.RENDER) return; 

  if (isWeakJwtSecret(process.env.JWT_SECRET)) {
    process.env.JWT_SECRET = crypto.randomBytes(32).toString('hex');
    if (!isProductionLike()) {
      console.warn('⚠️  JWT_SECRET missing — generated ephemeral secret for local dev.');
    }
  }
  if (isWeakJwtSecret(process.env.JWT_REFRESH_SECRET)) {
    process.env.JWT_REFRESH_SECRET = crypto.randomBytes(32).toString('hex');
    if (!isProductionLike()) {
      console.warn('⚠️  JWT_REFRESH_SECRET missing — generated ephemeral secret for local dev.');
    }
  }
}

module.exports = { assertProductionEnv, bootstrapJwtSecretsIfNeeded };
