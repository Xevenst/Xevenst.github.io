import { AppEnvironment } from './environment.model';
import { firebaseConfig, googleDriveWebAppUrl } from './firebase-config';

export const environment: AppEnvironment = {
  production: false,
  firebase: firebaseConfig,
  googleDriveWebAppUrl,
};
