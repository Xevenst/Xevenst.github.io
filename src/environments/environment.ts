import { AppEnvironment } from './environment.model';
import { firebaseConfig, googleDriveWebAppUrl } from './firebase-config';

export const environment: AppEnvironment = {
  production: true,
  firebase: firebaseConfig,
  googleDriveWebAppUrl,
};
