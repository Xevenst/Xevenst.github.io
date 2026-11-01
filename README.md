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
secrets, so their build uses the unconfigured Firebase fallback. Local builds also use that
fallback unless Firebase configuration is supplied through the build workflow.

## Deploy to GitHub Pages

The `Deploy GitHub Pages` workflow publishes the prerendered Angular site when changes are
pushed to the `AngularRework` branch, or when manually started from the Actions tab. In the
repository's **Settings → Pages**, set the publishing source to **GitHub Actions**. The workflow
uses the `FIREBASE_CONFIG_JSON` Actions secret at build time.
