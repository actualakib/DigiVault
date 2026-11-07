const { verifySessionToken } = require('./jwt');
const users = require('../database/queries/users');

async function requireSession(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) {
    return res.status(401).json({ error: 'Missing session token' });
  }
  try {
    const payload = verifySessionToken(token);
    const user = await users.findById(payload.userId);
    if (!user) {
      return res.status(401).json({ error: 'Session user not found' });
    }
    req.user = {
      userId: user.id,
      firebaseUid: user.firebase_uid,
      email: user.email,
      pinVerified: !!payload.pinVerified,
      hasPin: !!user.pin_hash
    };
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired session' });
  }
}

function requirePinVerified(req, res, next) {
  if (!req.user || !req.user.pinVerified) {
    return res.status(403).json({ error: 'Security PIN verification required' });
  }
  next();
}

module.exports = { requireSession, requirePinVerified };
