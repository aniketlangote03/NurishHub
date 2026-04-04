/**
 * Shared env helpers for db + startup validation
 */

function isProductionLike() {
  return process.env.NODE_ENV === 'production' || Boolean(process.env.RENDER);
}

function isPlaceholderMongoUri(uri) {
  if (!uri || typeof uri !== 'string' || !uri.trim()) return true;
  const markers = ['<username>', '<password>', '<cluster>', '<dbname>'];
  return markers.some((m) => uri.includes(m));
}

function isLocalUrl(value) {
  if (!value || typeof value !== 'string') return true;
  const v = value.toLowerCase();
  return v.includes('localhost') || v.includes('127.0.0.1');
}

function isWeakJwtSecret(secret) {
  if (!secret || typeof secret !== 'string' || secret.length < 32) return true;
  const s = secret.toLowerCase();
  return (
    s.includes('your_super_secret') ||
    s.includes('change_in_prod') ||
    s === 'secret'
  );
}

module.exports = {
  isProductionLike,
  isPlaceholderMongoUri,
  isLocalUrl,
  isWeakJwtSecret,
};
