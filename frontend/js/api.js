const API_BASE_URL = window.DIGIVAULT_API_BASE_URL || 'http://localhost:4000/api';

function getToken() {
  return localStorage.getItem('digivault_token');
}

function setToken(token) {
  localStorage.setItem('digivault_token', token);
}

function clearSession() {
  localStorage.removeItem('digivault_token');
  localStorage.removeItem('digivault_user');
}

function setUser(user) {
  localStorage.setItem('digivault_user', JSON.stringify(user));
}

function getUser() {
  const raw = localStorage.getItem('digivault_user');
  return raw ? JSON.parse(raw) : null;
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
  }
}

export { apiRequest, getToken, setToken, clearSession, setUser, getUser, requireAuthOrRedirect };
