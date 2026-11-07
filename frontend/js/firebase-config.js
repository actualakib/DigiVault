import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import { getAuth, GoogleAuthProvider } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';

const firebaseConfig = {
  apiKey: 'AIzaSyAbDv3jyJM6iWrLiwpw4Sz_xwwZ0Pj2Q94',
  authDomain: 'digivault-2026.firebaseapp.com',
  projectId: 'digivault-2026',
  storageBucket: 'digivault-2026.firebasestorage.app',
  messagingSenderId: '972045912171',
  appId: '1:972045912171:web:1c252163857427be44892e',
  measurementId: 'G-8DEBJRN9N0'
};

const firebaseApp = initializeApp(firebaseConfig);
const firebaseAuth = getAuth(firebaseApp);
const googleProvider = new GoogleAuthProvider();

export { firebaseApp, firebaseAuth, googleProvider };
