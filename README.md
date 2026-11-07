# DigiVault

## Run Locally on Windows

You need [Node.js 22.13 or newer](https://nodejs.org/) and an internet connection for Google sign-in. DigiVault saves its database and uploaded files on the computer running the app.

### If DigiVault has already been set up on this computer

Open the DigiVault project folder in VS Code, open **Terminal → New Terminal**, and run:

```powershell
npm.cmd start
```

Then open **http://localhost:4000** in your browser. Keep the terminal open while you use the app. You do not need to create `.env`, install dependencies again, or run a separate database setup each time.

### If this is a new computer or a fresh copy of the project

Do these steps once on that computer.

#### 1. Install the project dependencies

Open the project folder in VS Code, choose **Terminal → New Terminal**, and run:

```powershell
npm.cmd install
```

Wait for it to finish. This downloads the packages the project needs. You do not need to repeat this every time you start the project. If not work then brute force:

```powershell
cd /d "c:\Users\User\Downloads\DigiVault-main\DigiVault-main"
node -v
npm -v
winget install OpenJS.NodeJS.LTS
rem close this terminal and reopen it after the Node install finishes
cd /d "c:\Users\User\Downloads\DigiVault-main\DigiVault-main"
rmdir /s /q node_modules
del /f /q package-lock.json
npm cache clean --force
npm install --legacy-peer-deps
```

#### 2. Create your local `.env` file

In the same terminal, run:

```powershell
Copy-Item .env.example .env
notepad .env
```

`.env` is a private settings file in the main DigiVault folder. It is not included in GitHub, so each new computer needs its own copy. Keep this file on your computer and never upload or send it to anyone.

#### 3. Create and download a Firebase service-account key

The backend needs this key to check Google sign-ins. In the [Firebase Console](https://console.firebase.google.com/), select the **same Firebase project used by the web app**. The web app currently uses project ID `digivault-2026`.

1. In Firebase, click the gear icon next to **Project Overview**, then choose **Project settings**.
2. Open the **Service accounts** tab.
3. In the **Firebase Admin SDK** section, click **Generate new private key**, then confirm.
4. Your browser downloads a `.json` file, usually into your **Downloads** folder. Keep it private. Do not put it in the project folder, commit it to GitHub, or share it.
5. Open that downloaded JSON file with Notepad. Find these three values in the file:
   - `project_id` — copy only the value inside the quotes (for example, `digivault-2026`).
   - `client_email` — copy only the email address inside the quotes.
   - `private_key` — copy the entire value between its quotes, starting with `-----BEGIN PRIVATE KEY-----` and ending with `-----END PRIVATE KEY-----\n`. Copy the `\n` characters too. Do not copy the JSON property name, colon, or surrounding quotes.
6. In the `.env` Notepad window, replace the example values on these lines:

   ```dotenv
   FIREBASE_PROJECT_ID=paste-project_id-here
   FIREBASE_CLIENT_EMAIL=paste-client_email-here
   FIREBASE_PRIVATE_KEY="paste-the-complete-private_key-value-here"
   ```

   Keep the double quotes around the `FIREBASE_PRIVATE_KEY` value and keep it on one line. The downloaded JSON is only a source for these three values; do not paste the whole JSON file into `.env`.

#### 4. Set two private secrets in `.env`

Replace `replace-with-a-long-random-string` for both `JWT_SECRET` and `ENCRYPTION_KEY` in `.env`. They must be different values. You can make a random value by running this command in the terminal twice and copying a different result each time:

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Paste one result after `JWT_SECRET=` and the other after `ENCRYPTION_KEY=`. Do not share these values. Keep the other `.env` settings as they are unless you know you need to change them.

#### 5. Enable Google sign-in

In the Firebase Console, open **Authentication → Sign-in method** and enable **Google**. The Firebase service-account key and the web app configuration must be from the same Firebase project.

The web app configuration is in `frontend/js/firebase-config.js`. This repository already has the web configuration for project `digivault-2026`. If you are using that project, you do not need to edit this file. If you use a different Firebase project, go to **Project settings → General → Your apps**, select or create a **Web app**, choose **Config** in the SDK setup section, and replace the values in `firebase-config.js` with that web app's config. This web config is different from the private service-account JSON: never put the service-account private key in frontend files.

#### 6. Start DigiVault

Save and close `.env`, then run:

```powershell
npm.cmd start
```

Open **http://localhost:4000**. The start command creates or updates the local SQLite database automatically and serves both the website and API. You do not need a separate migration command, second terminal, or `npx serve`.

On later visits to this computer, just run `npm.cmd start`. Keep `.env`—do not recreate it.

Run the database tests with `npm.cmd test`.

Digital Assets Management System. The codebase is split into four components:

- `frontend/` — HTML, CSS, vanilla JavaScript (Firebase client SDK for Google sign-in)
- `backend/` — Node.js + Express API (routes, controllers, file processing services)
- `database/` — SQLite schema, local database, and SQL queries
- `security/` — Firebase token verification, JWT sessions, PIN hashing, field encryption, audit logging, watermarking

Application data is stored locally in SQLite; PostgreSQL is not required. The optional `npm.cmd run migrate` command is still available for manual database setup.

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
