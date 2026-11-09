import { firebaseAuth, googleProvider } from './firebase-config.js';
import { signInWithPopup } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import { apiRequest, setToken, setUser, getToken } from './api.js';

const googleStep = document.getElementById('googleStep');
const createPinStep = document.getElementById('createPinStep');
const enterPinStep = document.getElementById('enterPinStep');
const statusText = document.getElementById('statusText');
const authSubtitle = document.getElementById('authSubtitle');

function showStatus(message) {
  statusText.textContent = message || '';
}

function getSignInErrorMessage(error) {
  if (error.code?.startsWith('auth/api-key-not-valid')) {
    return 'Firebase web app config is missing or invalid. Replace the placeholders in frontend/js/firebase-config.js with your Firebase web app config.';
  }
  if (error.code === 'auth/unauthorized-domain') {
    return 'This website address is not authorized in Firebase Authentication settings.';
  }
  if (error.code === 'auth/operation-not-allowed') {
    return 'Google sign-in is not enabled for this Firebase project.';
  }
  return error.message || 'Google sign-in failed';
}

function showStep(step) {
  googleStep.classList.add('hidden');
  createPinStep.classList.remove('visible');
  enterPinStep.classList.remove('visible');
  if (step === 'google') googleStep.classList.remove('hidden');
  if (step === 'create') createPinStep.classList.add('visible');
  if (step === 'enter') enterPinStep.classList.add('visible');
}

if (getToken()) {
  window.location.href = 'dashboard.html';
}

document.getElementById('googleButton').addEventListener('click', async () => {
  showStatus('');
  try {
    const result = await signInWithPopup(firebaseAuth, googleProvider);
    const idToken = await result.user.getIdToken();
    const data = await apiRequest('/auth/google', { method: 'POST', body: { idToken }, skipAuth: true });
    setToken(data.token);
    setUser(data.user);
    authSubtitle.textContent = `Welcome, ${data.user.displayName || data.user.email}`;
    if (data.hasPin) {
      showStep('enter');
    } else {
      showStep('create');
    }
  } catch (err) {
    showStatus(getSignInErrorMessage(err));
  }
});

document.getElementById('createPinButton').addEventListener('click', async () => {
  const pin = document.getElementById('createPinInput').value;
  const confirmPin = document.getElementById('confirmPinInput').value;
  if (pin !== confirmPin) {
    showStatus('PINs do not match');
    return;
  }
  try {
    const data = await apiRequest('/auth/pin/set', { method: 'POST', body: { pin } });
    setToken(data.token);
    window.location.href = 'dashboard.html';
  } catch (err) {
    showStatus(err.message || 'Could not set PIN');
  }
});

document.getElementById('enterPinButton').addEventListener('click', async () => {
  const pin = document.getElementById('enterPinInput').value;
  try {
    const data = await apiRequest('/auth/pin/verify', { method: 'POST', body: { pin } });
    setToken(data.token);
    window.location.href = 'dashboard.html';
  } catch (err) {
    showStatus(err.message || 'Incorrect PIN');
  }
});
// module 1, feature 1 by @Adnan Akib
