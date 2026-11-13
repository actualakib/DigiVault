const API_BASE_URL = window.DIGIVAULT_API_BASE_URL || 'http://localhost:4000/api';
const SESSION_TIMEOUT_MS = 15 * 60 * 1000;
const SESSION_STARTED_KEY = 'digivault_session_started_at';
let sessionTimeoutStarted = false;

function clearSessionTimeout() {
  localStorage.removeItem(SESSION_STARTED_KEY);
  localStorage.removeItem('digivault_last_activity');
}

function startSessionTimeout() {
  if (sessionTimeoutStarted) return;
  sessionTimeoutStarted = true;

  const storedStartTime = Number(localStorage.getItem(SESSION_STARTED_KEY));
  if (!Number.isFinite(storedStartTime) || storedStartTime <= 0) {
    localStorage.setItem(SESSION_STARTED_KEY, String(Date.now()));
  }

  window.addEventListener('storage', (event) => {
    if (event.key === 'digivault_token' && !event.newValue && !getToken()) {
      window.location.replace('index.html');
    }
  });

  const timer = document.getElementById('sessionTimeoutTimer');
  const updateTimer = () => {
    if (!getToken()) {
      window.clearInterval(intervalId);
      return;
    }

    const sessionStartedAt = Number(localStorage.getItem(SESSION_STARTED_KEY)) || Date.now();
    const remaining = SESSION_TIMEOUT_MS - (Date.now() - sessionStartedAt);
    if (remaining <= 0) {
      window.clearInterval(intervalId);
      clearSession();
      window.location.replace('index.html?reason=session-timeout');
      return;
    }

    if (timer) {
      const totalSeconds = Math.ceil(remaining / 1000);
      const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
      const seconds = (totalSeconds % 60).toString().padStart(2, '0');
      timer.textContent = `${minutes}:${seconds}`;
    }
  };

  const intervalId = window.setInterval(updateTimer, 1000);
  updateTimer();
}

function getToken() {
  return localStorage.getItem('digivault_token');
}

function setToken(token) {
  localStorage.setItem('digivault_token', token);
}

function clearSession() {
  localStorage.removeItem('digivault_token');
  localStorage.removeItem('digivault_user');
  clearSessionTimeout();
}

function setUser(user) {
  localStorage.setItem('digivault_user', JSON.stringify(user));
}

function getUser() {
  const raw = localStorage.getItem('digivault_user');
  return raw ? JSON.parse(raw) : null;
}

async function copyTextToClipboard(text) {
  try {
    await navigator.clipboard.writeText(String(text));
    return;
  } catch {
    const input = document.createElement('textarea');
    input.value = String(text);
    input.style.position = 'fixed';
    input.style.opacity = '0';
    document.body.appendChild(input);
    input.select();
    const copied = document.execCommand('copy');
    input.remove();
    if (!copied) throw new Error('Could not copy the file ID.');
  }
}

async function apiRequest(path, { method = 'GET', body, isForm = false, skipAuth = false } = {}) {
  const headers = {};
  if (!isForm) headers['Content-Type'] = 'application/json';
  if (!skipAuth) {
    const token = getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: isForm ? body : (body ? JSON.stringify(body) : undefined)
  });

  if (response.status === 204) return null;

  const data = await response.json().catch(() => ({}));
  const isWrongPin = path === '/auth/pin/verify' && data.error === 'Incorrect PIN';

  if (response.status === 401 && !skipAuth && !isWrongPin) {
    clearSession();
    window.location.href = 'index.html';
    throw new Error('Session expired');
  }

  if (!response.ok) {
    throw new Error(data.error || 'Request failed');
  }
  return data;
}

function requireAuthOrRedirect() {
  if (!getToken()) {
    window.location.href = 'index.html';
    return;
  }
  startSessionTimeout();
}

export { apiRequest, getToken, setToken, clearSession, setUser, getUser, requireAuthOrRedirect, copyTextToClipboard };
