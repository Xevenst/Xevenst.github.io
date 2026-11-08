import { isPlatformBrowser } from '@angular/common';
import { ChangeDetectorRef, Component, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { DatabaseService } from '../services/database.service';
import { DEFAULT_PORTFOLIO_CONTENT } from '../data/site-copy.data';
import { PortfolioPageContent, PortfolioProject } from '../models/portfolio.models';

@Component({
  selector: 'app-portfolio',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './portfolio.html',
  styleUrl: './portfolio.scss',
})
export class PortfolioComponent {
  projects: PortfolioProject[] = [];
  savedIds = new Set<string>();
  loading = true;
  contentAvailable = false;
  dataSource = 'local';
  dataError: string | null = null;
  loadError: string | null = null;
  content: PortfolioPageContent = DEFAULT_PORTFOLIO_CONTENT;
  readonly user$;
  private readonly cacheKey = 'xevenst-portfolio-data-v1';
  constructor(
    private readonly database: DatabaseService,
    private readonly auth: AuthService,
    private readonly changeDetector: ChangeDetectorRef,
    @Inject(PLATFORM_ID) private readonly platformId: object,
  ) {
    this.user$ = auth.user$;
  }

  get documents() {
    return [
      {
        title: this.content.atsResumeTitle,
        image: '/assets/live/images/Steven Jonathan ATS Resume.png',
        pdf: '/assets/live/documents/Steven Jonathan ATS Resume.pdf',
      },
      {
        title: this.content.modernResumeTitle,
        image: '/assets/live/images/Steven Jonathan Modern Resume.png',
        pdf: '/assets/live/documents/Steven Jonathan Modern Resume.pdf',
      },
      {
        title: this.content.portfolioPdfTitle,
        image: '/assets/live/images/Steven Jonathan Portfolio.png',
        pdf: '/assets/live/documents/Steven Jonathan Portfolio.pdf',
      },
    ];
  }

  async ngOnInit(): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) return;
    const cachedData = this.readCachedData();
    if (cachedData) {
      this.projects = cachedData.projects;
      this.content = cachedData.content;
      this.dataSource = 'firebase';
      this.contentAvailable = true;
      this.loading = false;
      this.changeDetector.markForCheck();
    }

    try {
      [this.projects, this.content] = await Promise.all([
        this.withTimeout(this.database.getProjects(), 'Timed out loading portfolio projects from Firebase.'),
        this.withTimeout(this.database.getPortfolioPageContent(), 'Timed out loading Portfolio content from Firebase.'),
      ]);
      this.dataSource = this.database.source;
      this.contentAvailable = true;
      this.cacheData();
      if (this.auth.currentUser) {
        await this.loadBookmarks();
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Portfolio content could not be loaded from Firebase.';
      if (cachedData) {
        this.dataError = `Firebase refresh failed; showing the saved portfolio. ${message}`;
      } else {
        this.loadError = message;
      }
    } finally {
      this.loading = false;
      this.changeDetector.markForCheck();
    }
  }

  async toggleBookmark(project: PortfolioProject): Promise<void> {
    if (!this.auth.currentUser) {
      this.dataError = this.content.signInRequiredMessage;
      return;
    }
    const saved = !this.savedIds.has(project.id);
    try {
      await this.database.setBookmark(project.id, saved);
      if (saved) this.savedIds.add(project.id);
      else this.savedIds.delete(project.id);
    } catch (error: unknown) {
      this.dataError = error instanceof Error ? error.message : 'The bookmark could not be updated.';
    }
  }

  isSaved(projectId: string): boolean {
    return this.savedIds.has(projectId);
  }

  private async loadBookmarks(): Promise<void> {
    try {
      this.savedIds = new Set(await this.database.getBookmarks());
    } catch (error: unknown) {
      this.dataError = error instanceof Error ? error.message : 'Saved projects could not be loaded.';
    }
  }

  private readCachedData(): { content: PortfolioPageContent; projects: PortfolioProject[] } | null {
    try {
      const stored = window.localStorage.getItem(this.cacheKey);
      if (!stored) return null;
      const parsed: unknown = JSON.parse(stored);
      if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return null;
      const record = parsed as Record<string, unknown>;
      const projects = record['projects'];
      if (!this.isPortfolioContent(record['content']) || !Array.isArray(projects)) {
        window.localStorage.removeItem(this.cacheKey);
        return null;
      }
      if (!projects.every((project: unknown): project is PortfolioProject => this.isPortfolioProject(project))) {
        window.localStorage.removeItem(this.cacheKey);
        return null;
      }
      return {
        content: record['content'],
        projects,
      };
    } catch (error: unknown) {
      console.warn('The saved portfolio could not be read from this browser.', error);
    }
    return null;
  }

  private cacheData(): void {
    try {
      window.localStorage.setItem(this.cacheKey, JSON.stringify({
        content: this.content,
        projects: this.projects,
      }));
    } catch (error: unknown) {
      console.warn('The portfolio could not be cached in this browser.', error);
    }
  }

  private isPortfolioContent(value: unknown): value is PortfolioPageContent {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
    const record = value as Record<string, unknown>;
    return Object.keys(DEFAULT_PORTFOLIO_CONTENT).every((key) => typeof record[key] === 'string');
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

  private withTimeout<T>(promise: Promise<T>, message: string): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error(message)), 12000);
      promise.then(
        (value) => {
          clearTimeout(timeout);
          resolve(value);
        },
        (error: unknown) => {
          clearTimeout(timeout);
          reject(error);
        },
      );
    });
  }
}
