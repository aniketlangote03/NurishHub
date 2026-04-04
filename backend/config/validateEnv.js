/**
 * Fail fast on Render/production with one checklist if required env is wrong.
 */

const {
  isProductionLike,
  isPlaceholderMongoUri,
  isLocalUrl,
  isWeakJwtSecret,
} = require('./envShared');

function assertProductionEnv() {
  if (process.env.NODE_ENV === 'test') return;
  if (!isProductionLike()) return;

  const lines = [];

  if (isPlaceholderMongoUri(process.env.MONGO_URI)) {
    lines.push(
      'MONGO_URI — Paste your MongoDB Atlas SRV string (Database → Connect → Drivers). ' +
        'In Atlas → Network Access, allow access from Render (e.g. 0.0.0.0/0 for development).'
    );
  }

  if (isWeakJwtSecret(process.env.JWT_SECRET)) {
    lines.push(
      'JWT_SECRET — Set a long random string (32+ characters). In Render: Environment → add key or use Generate.'
    );
  }

  if (isWeakJwtSecret(process.env.JWT_REFRESH_SECRET)) {
    lines.push(
      'JWT_REFRESH_SECRET — Set a different long random string (32+ characters).'
    );
  }

  if (isLocalUrl(process.env.CLIENT_URL)) {
    lines.push(
      'CLIENT_URL — Set to your Netlify URL (https://your-site.netlify.app). Needed for CORS and email links.'
    );
  }

  if (isLocalUrl(process.env.SOCKET_CORS_ORIGIN)) {
    lines.push(
      'SOCKET_CORS_ORIGIN — Set to the same Netlify URL as CLIENT_URL for real-time chat.'
    );
  }

  if (!lines.length) return;

  console.error('\n❌ Production environment: fix the following in Render → your Web Service → Environment → Environment Variables, then redeploy:\n');
  lines.forEach((msg, i) => console.error(`   ${i + 1}. ${msg}`));
  console.error('\n   Netlify (Site → Environment variables, then redeploy):');
  console.error('   • VITE_API_URL = https://<your-service>.onrender.com/api');
  console.error('   • VITE_SOCKET_URL = https://<your-service>.onrender.com\n');
  process.exit(1);
}

module.exports = { assertProductionEnv };
