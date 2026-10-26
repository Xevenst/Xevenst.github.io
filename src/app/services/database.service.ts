import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  setDoc,
} from 'firebase/firestore';
import { PORTFOLIO_PROJECTS } from '../data/portfolio.data';
import { PortfolioProject } from '../models/portfolio.models';
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
    const database = this.authService.database;
    if (!database) return PORTFOLIO_PROJECTS;
    try {
      const snapshot = await getDocs(collection(database, 'portfolio_projects'));
      const projects = snapshot.docs
        .map((item) => item.data())
        .filter((value): value is PortfolioProject => this.isPortfolioProject(value));
      this.sourceSubject.next(projects.length > 0 ? 'firebase' : 'local');
      return projects.length > 0 ? projects : PORTFOLIO_PROJECTS;
    } catch (error: unknown) {
      this.errorSubject.next(error instanceof Error ? error.message : 'Firebase data could not be loaded.');
      this.sourceSubject.next('local');
      return PORTFOLIO_PROJECTS;
    }
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
    if (!this.authService.database) throw new Error('The database is not configured.');
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
}
