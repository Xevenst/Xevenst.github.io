# Xevenst portfolio

Angular 20 standalone portfolio for Steven Jonathan / Xevenst. Firebase provides optional
authentication, Firestore data, and Cloud Storage. The site still works from local seeded
portfolio data until Firebase is configured.

## Run locally

```bash
npm install
npm start
```

Open `http://localhost:4200`. Build the production application with `npm run build`.

## Firebase setup

### 1. Create a Firebase project

1. Open the [Firebase console](https://console.firebase.google.com/) and create a project.
2. Add a Web app and copy its Firebase configuration.
3. Enable **Authentication → Sign-in method → Email/Password**. Enable Google only if needed.
4. Create a **Firestore Database** in production or test mode.
5. Enable **Storage** and choose the region closest to the audience.

The browser Firebase configuration is safe to include in the Angular app. It identifies the
project but does not grant administrator access. Never add a service-account private key to the
repository or browser.

### 2. Configure Angular

Edit `src/environments/environment.development.ts` and place the Web app configuration here:

```ts
firebase: {
  apiKey: 'your-api-key',
  authDomain: 'your-project.firebaseapp.com',
  projectId: 'your-project',
  storageBucket: 'your-project.firebasestorage.app',
  messagingSenderId: 'your-sender-id',
  appId: 'your-app-id',
},
```

Put the same values in `src/environments/environment.ts` for a production deployment. These
values are project identifiers, not private server credentials.

### 3. Create Firestore and Storage rules

Copy `firestore.rules` into the Firestore Rules tab and publish it. Copy `storage.rules` into
the Storage Rules tab and publish it. The rules provide this access model:

| Resource | Public visitor | Signed-in user | Administrator |
|---|---|---|---|
| Portfolio projects | Read | Read | Read/write/delete |
| Own bookmarks | No access | Read/write own bookmarks | Read/write own bookmarks |
| File metadata | No access | No access | Read/write/delete |
| Public portfolio files | Read | Read | Upload/delete |
| Private files | No access | No access | Read/write/delete |
| Diary entries | No access | No access | Read/write/delete |
| `admin_users` | No access | Read own record | Not writable from browser |

### 4. Create the first administrator

Create an account from the site's sign-in page. In Firestore, create this document manually:

- Collection: `admin_users`
- Document ID: the Firebase Auth user's UID
- Fields: none required

The application checks that document after sign-in. The security rules independently enforce
the same administrator check, so hiding the Admin link is not the security boundary.

### 5. Firestore collections

The application uses these collections:

- `portfolio_projects/{projectId}` for public portfolio records
- `users/{uid}/bookmarks/{projectId}` for per-user saved projects
- `site_files/{fileId}` for uploaded file metadata
- `diary_entries/{entryId}` for administrator-only diary text
- `admin_users/{uid}` for the administrator allowlist

The admin panel uploads PDFs, images, and audio files to the public
`portfolio-files/` Cloud Storage path. Private future attachments can use `private-files/`.
Existing repository assets under `public/assets/live/` remain static files.

### 6. Deploy

Build with `npm run build` and deploy the generated Angular output using the hosting provider's
Angular/SSR instructions. Add the deployed domain to Firebase Authentication authorized domains
before testing sign-in. Review Firebase's current no-cost quotas and billing requirements for
your selected Storage usage; a small collection of PDFs and images is usually a better fit than
a large media library.

## Data access choice

The custom API has been removed. The application uses the Firebase client SDK directly for
authentication, Firestore data, bookmarks, diary entries, and file uploads. A separate API is
not needed for this personal portfolio and would add hosting and maintenance costs.

Add a trusted server later only if you need server-only secrets, webhooks, complex media
processing, or integrations that must not run in a browser.
