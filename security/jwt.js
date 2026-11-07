const jwt = require('jsonwebtoken');

const SECRET = process.env.JWT_SECRET;
const EXPIRES_IN = process.env.JWT_EXPIRES_IN || '12h';

function issueSessionToken({ userId, firebaseUid, pinVerified }) {
  return jwt.sign({ userId, firebaseUid, pinVerified: !!pinVerified }, SECRET, { expiresIn: EXPIRES_IN });
}

function verifySessionToken(token) {
  return jwt.verify(token, SECRET);
}

module.exports = { issueSessionToken, verifySessionToken };
