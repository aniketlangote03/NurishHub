/**
 * CORS / Socket.io origin rules — supports comma-separated CLIENT_URL and Netlify previews on Render.
 */

const { isProductionLike } = require('./envShared');

const NETLIFY_HOST = /^https:\/\/[a-z0-9][a-z0-9-]*\.netlify\.app$/i;
const LOCAL_VITE = /^http:\/\/localhost:\d+$/;
const LOCAL_127 = /^http:\/\/127\.0\.0\.1:\d+$/;

function collectExplicitOrigins() {
  const chunks = [
    process.env.CLIENT_URL,
    process.env.SOCKET_CORS_ORIGIN,
    process.env.CORS_ORIGINS,
  ]
    .filter(Boolean)
    .join(',');
  return [...new Set(chunks.split(',').map((s) => s.trim()).filter(Boolean))];
}

/**
 * Whether to allow any *.netlify.app origin (Render only; disable with ALLOW_NETLIFY_CORS=false).
 */
function allowNetlifyWildcard() {
  return Boolean(process.env.RENDER) && process.env.ALLOW_NETLIFY_CORS !== 'false';
}

/**
 * Express cors + Socket.io compatible origin callback.
 */
function createDynamicOrigin() {
  return (origin, callback) => {
    if (!origin) return callback(null, true);

    const explicit = collectExplicitOrigins();
    if (explicit.includes(origin)) return callback(null, true);

    if (allowNetlifyWildcard() && NETLIFY_HOST.test(origin)) return callback(null, true);

    // ALWAYS allow localhost for easier development against the Render backend
    if (LOCAL_VITE.test(origin) || LOCAL_127.test(origin)) return callback(null, true);

    return callback(null, false);
  };
}

module.exports = {
  createDynamicOrigin,
  collectExplicitOrigins,
  allowNetlifyWildcard,
};
