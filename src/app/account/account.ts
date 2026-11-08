import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { combineLatest, map } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { DatabaseService } from '../services/database.service';
import { PortfolioProject } from '../models/portfolio.models';

@Component({
  selector: 'app-account',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './account.html',
  styleUrl: './account.scss',
})
export class AccountComponent implements OnInit {
  readonly user$;
  readonly configState$;
  readonly role$;
  savedProjects: PortfolioProject[] = [];
  loading = true;
  error: string | null = null;

  constructor(
    private readonly auth: AuthService,
    private readonly database: DatabaseService,
    private readonly changeDetector: ChangeDetectorRef,
  ) {
    this.user$ = this.auth.user$;
    this.configState$ = this.auth.configState$;
    this.role$ = combineLatest([this.auth.loading$, this.auth.isAdmin$]).pipe(
      map(([loading, isAdmin]) => ({ loading, isAdmin })),
    );
  }

  async ngOnInit(): Promise<void> {
    const userId = this.auth.currentUser?.uid;
    const cachedProjects = userId ? this.readCachedProjects(userId) : null;
    if (cachedProjects) {
      this.savedProjects = cachedProjects;
      this.loading = false;
      this.changeDetector.markForCheck();
    }

    try {
      const ids = await this.database.getBookmarks();
      const projects = await this.database.getProjects();
      this.savedProjects = projects.filter((project) => ids.includes(project.id));
      if (userId) this.cacheProjects(userId, this.savedProjects);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Saved work could not be loaded.';
      this.error = cachedProjects
        ? `Could not refresh saved work; showing the previous list. ${message}`
        : message;
    } finally {
      this.loading = false;
      this.changeDetector.markForCheck();
    }
  }

  async signOut(): Promise<void> {
    await this.auth.signOut();
  }

  private readCachedProjects(userId: string): PortfolioProject[] | null {
    const key = this.cacheKey(userId);
    try {
      const stored = window.sessionStorage.getItem(key);
      if (!stored) return null;
      const parsed: unknown = JSON.parse(stored);
      if (
        Array.isArray(parsed)
        && parsed.every((project: unknown): project is PortfolioProject => this.isPortfolioProject(project))
      ) {
        return parsed;
      }
      window.sessionStorage.removeItem(key);
    } catch (error: unknown) {
      console.warn('Saved projects could not be read from this browser session.', error);
    }
    return null;
  }

  private cacheProjects(userId: string, projects: PortfolioProject[]): void {
    try {
      window.sessionStorage.setItem(this.cacheKey(userId), JSON.stringify(projects));
    } catch (error: unknown) {
      console.warn('Saved projects could not be cached in this browser session.', error);
    }
  }

  private cacheKey(userId: string): string {
    return `xevenst-saved-projects-v1-${userId}`;
  }

  private isPortfolioProject(value: unknown): value is PortfolioProject {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
    const project = value as Record<string, unknown>;
    return typeof project['id'] === 'string'
      && typeof project['title'] === 'string'
      && typeof project['year'] === 'string'
      && typeof project['type'] === 'string'
      && typeof project['summary'] === 'string'
      && typeof project['details'] === 'string'
      && Array.isArray(project['technologies'])
      && project['technologies'].every((item) => typeof item === 'string')
      && typeof project['githubUrl'] === 'string'
      && typeof project['featured'] === 'boolean'
      && typeof project['accent'] === 'string';
  }
}
