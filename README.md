# DigiVault

## Run Locally on Windows

You need Node.js 22.13+ and a Firebase project with Google sign-in enabled.

1. Open PowerShell in the project folder and install dependencies:
	```powershell
	npm.cmd install
	```
   Check that installation worked:
   ```powershell
   node -v
   npm.cmd ls --depth=0
   Test-Path node_modules
   ```
   Node must be version 22.13 or newer. The last command should say `True`, and `npm.cmd ls --depth=0` should finish without `npm ERR!`.

   If `npm.cmd install` is not recognized or fails in PowerShell, open **Command Prompt** in the project folder and run `npm install` there.

2. Create `.env` from the example:
	```powershell
	Copy-Item .env.example .env
	notepad .env
	```
	Get the backend Firebase values:
	- Open https://console.firebase.google.com and select your project.
	- Click the gear icon, then **Project settings → Service accounts → Firebase Admin SDK**.
	- Click **Generate new private key** and download the JSON file.
	- Open the downloaded JSON on your computer. Copy its `project_id` into `FIREBASE_PROJECT_ID`, its `client_email` into `FIREBASE_CLIENT_EMAIL`, and its complete `private_key` value into `FIREBASE_PRIVATE_KEY` in `.env`.
	- Keep the private key on one line inside quotes, preserving the `\n` characters. Do not paste the whole JSON into `.env`, and never commit or share the key.

	The web app config is separate: add it to `frontend/js/firebase-config.js`. Enable Google sign-in in **Authentication → Sign-in method**. The web app config and service-account JSON must belong to the same Firebase project.
3. Create the local SQLite database:
	```powershell
	npm.cmd run migrate
	```
4. Start the backend in this terminal and leave it running:
	```powershell
	npm.cmd start
	```
5. Open a second PowerShell terminal in the project folder and start the website:
	```powershell
	npx.cmd serve frontend -l 3000
	```
6. Open http://localhost:3000 in your browser.

If you shared a service-account key, revoke it in Google Cloud and generate a new one before continuing.

Digital Assets Management System. The codebase is split into four components:

- `frontend/` — HTML, CSS, vanilla JavaScript (Firebase client SDK for Google sign-in)
- `backend/` — Node.js + Express API (routes, controllers, file processing services)
- `database/` — SQLite schema, local database, and SQL queries
- `security/` — Firebase token verification, JWT sessions, PIN hashing, field encryption, audit logging, watermarking

## 1. Prerequisites

- Node.js 22.13+
- A Firebase project with the **Google** sign-in provider enabled (Authentication → Sign-in method)
- A Firebase service account key (Project settings → Service accounts → Generate new private key)

Application data is stored locally in SQLite; PostgreSQL is not required.

## 2. Install dependencies

```powershell
npm.cmd install
```

## 3. Configure environment variables

Copy `.env.example` to `.env` and fill in:

- `SQLITE_DB_PATH` — local SQLite file path (defaults to `./database/digivault.sqlite`)
- `JWT_SECRET` / `ENCRYPTION_KEY` — long random strings
- `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` — from the service account key JSON

## 4. Create the local database

```powershell
npm.cmd run migrate
```

This creates the SQLite database file. Any existing PostgreSQL data is left untouched and is not copied into SQLite.

Run the database query tests with `npm.cmd test`.

## 5. Configure the frontend Firebase client

Edit `frontend/js/firebase-config.js` and replace the placeholder values with your Firebase **web app** config (Project settings → General → Your apps → SDK setup and configuration).
Enable Google under Authentication → Sign-in method. The web app config is separate from the service-account credentials used by the backend; both must belong to the same Firebase project. Do not put the service-account private key in frontend files.

If the backend runs somewhere other than `http://localhost:4000`, set `window.DIGIVAULT_API_BASE_URL` before the page scripts load (e.g. a small inline `<script>` tag in each HTML file, or a shared `config.js`).

When using `npx.cmd serve frontend`, set `CORS_ORIGIN=http://localhost:3000` in `.env`, or set it to the actual origin printed by your static server.

## 6. Run

```powershell
npm.cmd start
```

Serve the `frontend/` folder with a static file server (for example `npx.cmd serve frontend -l 3000`) in a second terminal and open http://localhost:3000.

## How login works

1. The person clicks **Continue with Google** — Firebase Authentication handles the OAuth popup and issues the account's identity (uid, email, name, photo), so that identity is reusable across sessions and devices.
2. The backend verifies the Firebase ID token and creates or looks up the matching row in the local SQLite database. SQLite stores the security PIN hash, vault records, folders, password entries, and audit logs, all keyed to the Firebase UID.
3. A new account is asked to create a 4–8 digit security PIN; a returning account is asked to enter it. Either way, the PIN is hashed with bcrypt and checked server-side before a session is allowed into the dashboard or any vault feature.

## Notes

- DigiVault records are stored on the computer running the backend. Firebase Authentication still requires an internet connection.
- File uploads are stored on disk under `STORAGE_ROOT` (default `./storage`), organized per user/feature/folder.
- OCR (tesseract.js) runs on uploaded images and the extracted text is searchable in the Personal Vault.
- The File Converter watermarks every generated PDF using `security/watermark.js`.
- Sensitive fields (password manager entries, quick-record bank account numbers) are encrypted with CryptoJS AES using a key derived per user before being stored.
