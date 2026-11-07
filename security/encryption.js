const CryptoJS = require('crypto-js');

const MASTER_KEY = process.env.ENCRYPTION_KEY;

function deriveUserKey(firebaseUid) {
  return CryptoJS.SHA256(`${MASTER_KEY}:${firebaseUid}`).toString();
}

function encryptField(plainText, firebaseUid) {
  if (plainText === null || plainText === undefined) return null;
  const key = deriveUserKey(firebaseUid);
  return CryptoJS.AES.encrypt(String(plainText), key).toString();
}

function decryptField(cipherText, firebaseUid) {
  if (!cipherText) return null;
  const key = deriveUserKey(firebaseUid);
  const bytes = CryptoJS.AES.decrypt(cipherText, key);
  return bytes.toString(CryptoJS.enc.Utf8);
}

module.exports = { encryptField, decryptField, deriveUserKey };
