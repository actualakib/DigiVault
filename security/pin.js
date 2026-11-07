const bcrypt = require('bcryptjs');

const SALT_ROUNDS = 12;
const PIN_PATTERN = /^\d{4,8}$/;

function isValidPin(pin) {
  return typeof pin === 'string' && PIN_PATTERN.test(pin);
}

async function hashPin(pin) {
  return bcrypt.hash(pin, SALT_ROUNDS);
}

async function verifyPin(pin, pinHash) {
  if (!pinHash) return false;
  return bcrypt.compare(pin, pinHash);
}

async function hashSecret(value) {
  return bcrypt.hash(value, SALT_ROUNDS);
}

async function verifySecret(value, hash) {
  if (!hash) return false;
  return bcrypt.compare(value, hash);
}

module.exports = { isValidPin, hashPin, verifyPin, hashSecret, verifySecret };
