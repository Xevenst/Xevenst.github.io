export interface FirebaseEnvironmentConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId?: string;
}

export interface AppEnvironment {
  production: boolean;
  firebase?: FirebaseEnvironmentConfig;
  googleDriveWebAppUrl?: string;
}
