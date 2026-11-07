# Xevenst portfolio

Angular 20 standalone portfolio for Steven Jonathan / Xevenst.

## Run locally

```bash
npm install
npm start
```

Open `http://localhost:4200`. Build the production application with `npm run build`.

## Firebase in GitHub Actions

Register a Firebase Web app and add its web configuration as the repository Actions secret
`FIREBASE_CONFIG_JSON`. The value must be one JSON object with `apiKey`, `authDomain`,
`projectId`, `storageBucket`, `messagingSenderId`, and `appId`; `measurementId` is optional.
The build workflow reads the secret without printing it and injects it into the Angular build.
The resulting browser app necessarily contains this public web configuration; never put a
service-account key or other private credential in this secret.

The workflow builds on pushes and pull requests. Fork pull requests do not receive repository
secrets, so their build uses the unconfigured Firebase fallback. For local Firebase testing,
run the following in PowerShell from the repository folder, replacing the placeholders with the
Firebase Web app values. Run these commands in each new PowerShell session where you want to
configure the app; the generated `src/environments/firebase-config.ts` is gitignored and stays
on your computer.

```powershell
$env:FIREBASE_CONFIG_JSON = '{"apiKey":"...","authDomain":"...","projectId":"...","storageBucket":"...","messagingSenderId":"...","appId":"...","measurementId":"..."}'
node scripts/configure-firebase.mjs
npm start
```

Do not paste the values into chat or commit the generated config. Without generating it, a fresh
local checkout uses the unconfigured Firebase fallback.

## Google Drive file uploads

The admin file manager uploads file contents to a fixed folder in your Google Drive. Firestore
stores only the file metadata and link. Firebase Storage is not used. Files are private by default;
the admin can explicitly allow anyone with the link to view an individual file. Keep the configured
Drive folder itself private so private uploads do not inherit broad folder access. Uploads are
limited to 20 MB.

The upload endpoint is a Google Apps Script web app in `google-apps-script/Code.gs`. It runs as
your Google account, keeps the Drive folder ID server-side, and checks the caller's Firebase ID
token and `admin_users/{uid}` document before processing requests. Do not share edit access to the
Apps Script project with untrusted users.

1. Create a private folder in the Google Drive account that should own the uploaded files.
2. Create a project at [script.google.com](https://script.google.com), replace its `Code.gs` with
   `google-apps-script/Code.gs`, and add these **Script Properties** under **Project Settings**:
   - `FIREBASE_API_KEY`: the `apiKey` from your Firebase web app config.
   - `FIREBASE_PROJECT_ID`: the `projectId` from that config.
   - `DRIVE_FOLDER_ID`: the folder ID from the Drive folder URL.
3. Run `authorizeSetup` from the Apps Script editor and approve the requested permissions. Then
   choose **Deploy → New deployment → Web app**, set **Execute as** to yourself, and set access to
   **Anyone**. The endpoint is publicly reachable, but it accepts file operations only with a
   valid Firebase administrator token and always uses the folder ID stored in Script Properties.
4. Copy the deployed web app URL ending in `/exec`. Add it as the GitHub repository **Actions
   variable** `GOOGLE_DRIVE_WEB_APP_URL` (not a secret). For local development, set
   `$env:GOOGLE_DRIVE_WEB_APP_URL` to that URL before running `node scripts/configure-firebase.mjs`.
5. Publish the updated Firestore rules in `firestore.rules`; the admin-only
   `site_file_jobs` rule is required for upload status. Also set `FIREBASE_CONFIG_JSON` as the
   repository Actions secret as described above, then deploy the site.

The Apps Script URL and Firebase web config are public client configuration, not credentials.
Never put a Google password, service-account key, or long-lived access token in the site or
repository. Apps Script is authorized as your Google account and may receive broad Drive
permissions; the endpoint code accepts operations only for the configured folder and checks the
file's parent before deletion. Keep the Apps Script project editable only by you. If the Firebase
API key is restricted, ensure Apps Script can call the Identity Toolkit API. If you edit the Apps
Script later, deploy a new version of its web app.

## Deploy to GitHub Pages

The `Deploy GitHub Pages` workflow publishes the prerendered Angular site when changes are
pushed to the `Live` branch, or when manually started from the Actions tab. In the
repository's **Settings → Pages**, set the publishing source to **GitHub Actions**. The workflow
uses the `FIREBASE_CONFIG_JSON` Actions secret at build time.
