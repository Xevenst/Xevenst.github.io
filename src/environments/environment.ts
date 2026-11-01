import { AppEnvironment } from './environment.model';
import { firebaseConfig } from './firebase-config';

export const environment: AppEnvironment = {
  production: true,
  firebase: firebaseConfig,
};
