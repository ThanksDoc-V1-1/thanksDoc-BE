const crypto = require('crypto');

/**
 * Generate a random 6-digit OTP code
 */
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Generate a secure random token for email verification
 */
function generateVerificationToken() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Generate expiration time (24 hours from now)
 */
function generateExpirationTime(hours = 24) {
  const now = new Date();
  now.setHours(now.getHours() + hours);
  return now;
}

/**
 * Check if a token/OTP has expired
 */
function isExpired(expirationDate) {
  if (!expirationDate) return true;
  return new Date() > new Date(expirationDate);
}

/**
 * Hash password using crypto
 */
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

/**
 * Verify password against hash
 */
function verifyPassword(password, hashedPassword) {
  const [salt, hash] = hashedPassword.split(':');
  const verifyHash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return hash === verifyHash;
}

module.exports = {
  generateOTP,
  generateVerificationToken,
  generateExpirationTime,
  isExpired,
  hashPassword,
  verifyPassword
};
