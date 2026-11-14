import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  setDoc,
} from 'firebase/firestore';
import { DEFAULT_ABOUT_CONTENT, DEFAULT_PORTFOLIO_CONTENT } from '../data/site-copy.data';
import { AboutPageContent, PortfolioPageContent, PortfolioProject } from '../models/portfolio.models';
import { AuthService } from './auth.service';

export type PortfolioDataSource = 'local' | 'firebase';

@Injectable({ providedIn: 'root' })
export class DatabaseService {
  private readonly sourceSubject = new BehaviorSubject<PortfolioDataSource>('local');
  private readonly errorSubject = new BehaviorSubject<string | null>(null);
  readonly source$ = this.sourceSubject.asObservable();
  readonly error$ = this.errorSubject.asObservable();

  constructor(private readonly authService: AuthService) {}

  get source(): PortfolioDataSource {
    return this.sourceSubject.value;
  }

  get error(): string | null {
    return this.errorSubject.value;
  }

  async getProjects(): Promise<PortfolioProject[]> {
    this.errorSubject.next(null);
    try {
      const database = this.requireDatabase();
      const snapshot = await getDocs(collection(database, 'portfolio_projects'));
      const projects = snapshot.docs
        .map((item) => item.data())
        .filter((value): value is PortfolioProject => this.isPortfolioProject(value));
      this.sourceSubject.next('firebase');
      return projects;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Firebase projects could not be loaded.';
      this.errorSubject.next(message);
      throw new Error(message);
    }
  }

  async getAboutContent(): Promise<AboutPageContent> {
    this.errorSubject.next(null);
    try {
      const database = this.requireDatabase();
      const snapshot = await getDoc(doc(database, 'site_content', 'about'));
      if (!snapshot.exists()) {
        throw new Error('The Firebase document site_content/about is missing. Save About page copy from the admin panel.');
      }
      const value = { ...DEFAULT_ABOUT_CONTENT, ...snapshot.data() };
      if (!this.isStringRecord(value, DEFAULT_ABOUT_CONTENT)) {
        throw new Error('The About page content in Firebase is incomplete or invalid.');
      }
      return value;
    } catch (error: unknown) {
      this.errorSubject.next(error instanceof Error ? error.message : 'About page content could not be loaded.');
      throw error;
    }
  }

  async saveAboutContent(content: AboutPageContent): Promise<void> {
    this.requireAdmin();
    await setDoc(doc(this.requireDatabase(), 'site_content', 'about'), content);
  }

  async getPortfolioPageContent(): Promise<PortfolioPageContent> {
    this.errorSubject.next(null);
    try {
      const database = this.requireDatabase();
      const snapshot = await getDoc(doc(database, 'site_content', 'portfolio'));
      if (!snapshot.exists()) {
        throw new Error('The Firebase document site_content/portfolio is missing. Save Portfolio page copy from the admin panel.');
      }
      const value = snapshot.data();
      if (!this.isStringRecord(value, DEFAULT_PORTFOLIO_CONTENT)) {
        throw new Error('The Portfolio page content in Firebase is incomplete or invalid.');
      }
      return value;
    } catch (error: unknown) {
      this.errorSubject.next(error instanceof Error ? error.message : 'Portfolio page content could not be loaded.');
      throw error;
    }
  }

  async savePortfolioPageContent(content: PortfolioPageContent): Promise<void> {
    this.requireAdmin();
    await setDoc(doc(this.requireDatabase(), 'site_content', 'portfolio'), content);
  }

  async getBookmarks(): Promise<string[]> {
    const user = this.requireUser();
    const database = this.requireDatabase();
    const snapshot = await getDocs(collection(database, 'users', user.uid, 'bookmarks'));
    return snapshot.docs.map((item) => item.id);
  }

  async setBookmark(projectId: string, saved: boolean): Promise<void> {
    const user = this.requireUser();
    const database = this.requireDatabase();
    const bookmark = doc(database, 'users', user.uid, 'bookmarks', projectId);
    if (saved) await setDoc(bookmark, { projectId });
    else await deleteDoc(bookmark);
  }

  async saveProject(project: PortfolioProject): Promise<void> {
    this.requireAdmin();
    await setDoc(doc(this.requireDatabase(), 'portfolio_projects', project.id), project);
  }

  async deleteProject(projectId: string): Promise<void> {
    this.requireAdmin();
    await deleteDoc(doc(this.requireDatabase(), 'portfolio_projects', projectId));
  }

  private requireDatabase() {
    if (!this.authService.database) throw new Error('Firebase is not configured for this deployment.');
    return this.authService.database;
  }

  private requireUser(): { uid: string } {
    const user = this.authService.currentUser;
    if (!user) throw new Error('Sign in to manage saved projects.');
    return user;
  }

  private requireAdmin(): void {
    if (!this.authService.isAdmin) throw new Error('Admin access is required for portfolio management.');
  }

  private isPortfolioProject(value: unknown): value is PortfolioProject {
    if (typeof value !== 'object' || value === null) return false;
    const candidate = value as Record<string, unknown>;
    return typeof candidate['id'] === 'string'
      && typeof candidate['title'] === 'string'
      && typeof candidate['year'] === 'string'
      && typeof candidate['type'] === 'string'
      && typeof candidate['summary'] === 'string'
      && typeof candidate['details'] === 'string'
      && Array.isArray(candidate['technologies'])
      && candidate['technologies'].every((technology) => typeof technology === 'string')
      && typeof candidate['githubUrl'] === 'string'
      && typeof candidate['featured'] === 'boolean'
      && typeof candidate['accent'] === 'string';
  }

  private isStringRecord<T extends object>(value: unknown, shape: T): value is T {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
    const candidate = value as Record<string, unknown>;
    return Object.keys(shape).every((key) => typeof candidate[key] === 'string');
  }
}
