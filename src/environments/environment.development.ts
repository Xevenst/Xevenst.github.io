import { AppEnvironment } from './environment.model';
import { firebaseConfig } from './firebase-config';

export const environment: AppEnvironment = {
  production: false,
  firebase: firebaseConfig,
};
