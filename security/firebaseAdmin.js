const admin = require('firebase-admin');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n')
    })
  });
}

async function verifyGoogleIdToken(idToken) {
  const decoded = await admin.auth().verifyIdToken(idToken);
  return {
    firebaseUid: decoded.uid,
    email: decoded.email,
    displayName: decoded.name || null,
    photoUrl: decoded.picture || null,
    emailVerified: decoded.email_verified || false
  };
}

module.exports = { admin, verifyGoogleIdToken };
