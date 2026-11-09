const { verifyGoogleIdToken } = require('../../security/firebaseAdmin');
const { issueSessionToken } = require('../../security/jwt');
const { isValidPin, hashPin, verifyPin } = require('../../security/pin');
const users = require('../../database/queries/users');
const financialVault = require('../../database/queries/financialVault');
const certificates = require('../../database/queries/certificates');
const { logAction } = require('../../security/audit');

async function googleSignIn(req, res) {
  const { idToken } = req.body;
  if (!idToken) {
    return res.status(400).json({ error: 'idToken is required' });
  }
  try {
    const identity = await verifyGoogleIdToken(idToken);
    let user = await users.findByFirebaseUid(identity.firebaseUid);
    let isNewUser = false;

    if (!user) {
      user = await users.createUser({
        firebaseUid: identity.firebaseUid,
        email: identity.email,
        displayName: identity.displayName,
        photoUrl: identity.photoUrl
      });
      isNewUser = true;
      await financialVault.ensureDefaultFolders(user.id);
      await certificates.ensureDefaultFolders(user.id);
    } else {
      await users.touchLastLogin(user.id);
    }

    const token = issueSessionToken({ userId: user.id, firebaseUid: user.firebase_uid, pinVerified: false });

    await logAction({ user: { userId: user.id } }, {
      action: isNewUser ? 'account_created' : 'login',
      feature: 'auth',
      metadata: { method: 'google' }
    });

    return res.json({
      token,
      hasPin: !!user.pin_hash,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.display_name,
        photoUrl: user.photo_url
      }
    });
  } catch (err) {
    return res.status(401).json({ error: 'Google sign-in verification failed' });
  }
}

async function setPin(req, res) {
  const { pin } = req.body;
  if (!isValidPin(pin)) {
    return res.status(400).json({ error: 'PIN must be 4-8 digits' });
  }
  const existing = await users.findById(req.user.userId);
  if (existing.pin_hash) {
    return res.status(409).json({ error: 'PIN already set, use verify instead' });
  }
  const pinHash = await hashPin(pin);
  await users.setPinHash(req.user.userId, pinHash);
  const token = issueSessionToken({ userId: req.user.userId, firebaseUid: req.user.firebaseUid, pinVerified: true });

  await logAction(req, { action: 'pin_set', feature: 'auth' });

  return res.json({ token, pinVerified: true });
}

async function verifyPinHandler(req, res) {
  const { pin } = req.body;
  const user = await users.findById(req.user.userId);
  if (!user.pin_hash) {
    return res.status(409).json({ error: 'No PIN set for this account' });
  }
  const valid = await verifyPin(pin, user.pin_hash);
  if (!valid) {
    await logAction(req, { action: 'pin_verify_failed', feature: 'auth' });
    return res.status(401).json({ error: 'Incorrect PIN' });
  }
  const token = issueSessionToken({ userId: req.user.userId, firebaseUid: req.user.firebaseUid, pinVerified: true });

  await logAction(req, { action: 'pin_verify_success', feature: 'auth' });

  return res.json({ token, pinVerified: true });
}

async function me(req, res) {
  const user = await users.findById(req.user.userId);
  return res.json({
    id: user.id,
    email: user.email,
    displayName: user.display_name,
    photoUrl: user.photo_url,
    hasPin: !!user.pin_hash,
    pinVerified: req.user.pinVerified
  });
}

module.exports = { googleSignIn, setPin, verifyPin: verifyPinHandler, me };
// module 1, feature 1 by @Adnan Akib

