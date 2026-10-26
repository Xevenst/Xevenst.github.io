import { isPlatformBrowser } from '@angular/common';
import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { BehaviorSubject, distinctUntilChanged } from 'rxjs';
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import {
  Auth,
  GoogleAuthProvider,
  User,
  createUserWithEmailAndPassword,
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
} from 'firebase/auth';
import { Firestore, getFirestore } from 'firebase/firestore';
import { FirebaseStorage, getStorage } from 'firebase/storage';
import { environment } from '../../environments/environment';
import { AuthUser } from '../models/portfolio.models';

export type AuthConfigState = 'configured' | 'unconfigured' | 'unavailable';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly userSubject = new BehaviorSubject<AuthUser | null>(null);
  private readonly errorSubject = new BehaviorSubject<string | null>(null);
  private readonly loadingSubject = new BehaviorSubject<boolean>(true);
  private readonly configStateSubject = new BehaviorSubject<AuthConfigState>('unconfigured');
  private readonly adminSubject = new BehaviorSubject<boolean>(false);
  private readonly auth: Auth | null;
  private readonly firestore: Firestore | null;
  private readonly storage: FirebaseStorage | null;

  readonly user$ = this.userSubject.asObservable();
  readonly error$ = this.errorSubject.asObservable();
  readonly loading$ = this.loadingSubject.asObservable();
  readonly configState$ = this.configStateSubject.asObservable();
  readonly isAdmin$ = this.adminSubject.asObservable().pipe(distinctUntilChanged());

  constructor(@Inject(PLATFORM_ID) platformId: object) {
    if (!isPlatformBrowser(platformId)) {
      this.auth = null;
      this.firestore = null;
      this.storage = null;
      this.configStateSubject.next('unavailable');
      this.loadingSubject.next(false);
      return;
    }

    const config = environment.firebase;
    if (!config || !Object.values(config).every((value) => value.trim().length > 0)) {
      this.auth = null;
      this.firestore = null;
      this.storage = null;
      this.loadingSubject.next(false);
      return;
    }

    try {
      const app: FirebaseApp = getApps().length > 0 ? getApps()[0] : initializeApp(config);
      this.auth = getAuth(app);
      this.firestore = getFirestore(app);
      this.storage = getStorage(app);
      this.configStateSubject.next('configured');
      onAuthStateChanged(this.auth, (user) => void this.handleUser(user));
    } catch (error: unknown) {
      this.auth = null;
      this.firestore = null;
      this.storage = null;
      this.loadingSubject.next(false);
      this.errorSubject.next(this.describeError(error, 'Firebase could not be initialized.'));
    }
  }

  async signIn(email: string, password: string): Promise<void> {
    this.clearError();
    try {
      await signInWithEmailAndPassword(this.requireAuth(), email, password);
    } catch (error: unknown) {
      this.fail(this.describeError(error, 'Sign in failed. Check your email and password.'));
    }
  }

  async createAccount(email: string, password: string): Promise<void> {
    this.clearError();
    try {
      await createUserWithEmailAndPassword(this.requireAuth(), email, password);
    } catch (error: unknown) {
      this.fail(this.describeError(error, 'Account creation failed.'));
    }
  }

  async signInWithGoogle(): Promise<void> {
    this.clearError();
    try {
      await signInWithPopup(this.requireAuth(), new GoogleAuthProvider());
    } catch (error: unknown) {
      this.fail(this.describeError(error, 'Google sign in failed.'));
    }
  }

  async signOut(): Promise<void> {
    if (this.auth) await firebaseSignOut(this.auth);
    this.userSubject.next(null);
    this.adminSubject.next(false);
  }

  clearError(): void {
    this.errorSubject.next(null);
  }

  get currentUser(): AuthUser | null {
    return this.userSubject.value;
  }

  get configState(): AuthConfigState {
    return this.configStateSubject.value;
  }

  get client(): Auth | null {
    return this.auth;
  }

  get database(): Firestore | null {
    return this.firestore;
  }

  get fileStorage(): FirebaseStorage | null {
    return this.storage;
  }

  get isAdmin(): boolean {
    return this.adminSubject.value;
  }

  private async handleUser(user: User | null): Promise<void> {
    this.loadingSubject.next(true);
    this.userSubject.next(user ? this.toAuthUser(user) : null);
    this.adminSubject.next(user ? await this.loadAdminStatus(user.uid) : false);
    this.loadingSubject.next(false);
  }

  private async loadAdminStatus(uid: string): Promise<boolean> {
    if (!this.firestore) return false;
    try {
      const { doc, getDoc } = await import('firebase/firestore');
      return (await getDoc(doc(this.firestore, 'admin_users', uid))).exists();
    } catch (error: unknown) {
      this.errorSubject.next(this.describeError(error, 'Firebase administrator status could not be checked.'));
      return false;
    }
  }

  private requireAuth(): Auth {
    if (!this.auth) {
      throw new Error('Authentication is not configured for this deployment.');
    }
    return this.auth;
  }

  private fail(message: string): never {
    this.errorSubject.next(message);
    throw new Error(message);
  }

  private toAuthUser(user: User): AuthUser {
    return {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoUrl: user.photoURL,
    };
  }

  private describeError(error: unknown, fallback: string): string {
    return error instanceof Error && error.message ? error.message : fallback;
  }
}
