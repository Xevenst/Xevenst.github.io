import { isPlatformBrowser } from '@angular/common';
import { ChangeDetectorRef, Component, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DEFAULT_ABOUT_CONTENT } from '../data/site-copy.data';
import { AboutPageContent, PortfolioProject } from '../models/portfolio.models';
import { DatabaseService } from '../services/database.service';
import { GitHubProjectsService, mergeFeaturedProjects } from '../services/github-projects.service';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './about.html',
  styleUrl: './about.scss',
})
export class AboutComponent {
  content: AboutPageContent = DEFAULT_ABOUT_CONTENT;
  featuredProjects: PortfolioProject[] = [];
  contentError: string | null = null;
  projectError: string | null = null;
  contentAvailable = false;
  loading = true;
  private readonly contentCacheKey = 'xevenst-about-content-v1';

  constructor(
    private readonly database: DatabaseService,
    private readonly githubProjects: GitHubProjectsService,
    private readonly changeDetector: ChangeDetectorRef,
    @Inject(PLATFORM_ID) private readonly platformId: object,
  ) {}

  async ngOnInit(): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) return;
    const cachedContent = this.readCachedContent();
    if (cachedContent) {
      this.content = cachedContent;
      this.contentAvailable = true;
      this.loading = false;
      this.changeDetector.markForCheck();
    }

    const [contentResult, curatedProjectsResult, githubProjectsResult] = await Promise.allSettled([
      this.withTimeout(this.database.getAboutContent(), 'Timed out loading About content from Firebase.'),
      this.withTimeout(this.database.getProjects(), 'Timed out loading featured projects from Firebase.'),
      this.withTimeout(this.githubProjects.getPublicProjects(), 'Timed out loading public GitHub projects.'),
    ]);

    if (contentResult.status === 'fulfilled') {
      this.content = contentResult.value;
      this.contentAvailable = true;
      this.cacheContent(contentResult.value);
    } else {
      const error = this.errorMessage(contentResult.reason, 'About page content could not be loaded from Firebase.');
      this.contentError = cachedContent
        ? `Firebase refresh failed; showing the previously loaded About page. ${error}`
        : error;
    }

    const curatedProjects = curatedProjectsResult.status === 'fulfilled'
      ? curatedProjectsResult.value.filter((project) => project.featured)
      : [];
    const githubProjects = githubProjectsResult.status === 'fulfilled'
      ? githubProjectsResult.value
      : [];
    this.featuredProjects = mergeFeaturedProjects(curatedProjects, githubProjects);

    const projectErrors = [
      ...(curatedProjectsResult.status === 'rejected'
        ? [this.errorMessage(curatedProjectsResult.reason, 'Featured Firebase projects could not be loaded.')]
        : []),
      ...(githubProjectsResult.status === 'rejected'
        ? [this.errorMessage(githubProjectsResult.reason, 'Public GitHub projects could not be loaded.')]
        : []),
    ];
    this.projectError = projectErrors.length ? projectErrors.join(' ') : null;
    this.loading = false;
    this.changeDetector.markForCheck();
  }

  get highlights(): { value: string; label: string }[] {
    return [
      { value: this.content.highlightOneValue, label: this.content.highlightOneLabel },
      { value: this.content.highlightTwoValue, label: this.content.highlightTwoLabel },
      { value: this.content.highlightThreeValue, label: this.content.highlightThreeLabel },
    ];
  }

  get experienceItems(): { date: string; company: string; role: string; description: string }[] {
    return this.parseRows(this.content.experienceEntries, 4)
      .map(([date, company, role, description]) => ({ date, company, role, description }));
  }

  get communityItems(): { title: string; date: string; description: string }[] {
    return this.parseRows(this.content.communityEntries, 3)
      .map(([title, date, description]) => ({ title, date, description }));
  }

  get skills(): string[] {
    return this.content.skills.split(/\r?\n/).map((value) => value.trim()).filter(Boolean);
  }

  get languages(): { name: string; level: string }[] {
    return this.parseRows(this.content.languages, 2).map(([name, level]) => ({ name, level }));
  }

  private parseRows(value: string, columns: number): string[][] {
    return value.split(/\r?\n/)
      .map((row) => row.split('|').map((field) => field.trim()))
      .filter((fields) => fields.length === columns && fields.every(Boolean));
  }

  private errorMessage(error: unknown, fallback: string): string {
    return error instanceof Error && error.message ? error.message : fallback;
  }

  private readCachedContent(): AboutPageContent | null {
    try {
      const stored = window.localStorage.getItem(this.contentCacheKey);
      if (!stored) return null;
      const parsed: unknown = JSON.parse(stored);
      if (this.isAboutContent(parsed)) return parsed;
      window.localStorage.removeItem(this.contentCacheKey);
    } catch (error: unknown) {
      console.warn('The saved About page copy could not be read from this browser.', error);
    }
    return null;
  }

  private cacheContent(content: AboutPageContent): void {
    try {
      window.localStorage.setItem(this.contentCacheKey, JSON.stringify(content));
    } catch (error: unknown) {
      console.warn('The About page copy could not be cached in this browser.', error);
    }
  }

  private isAboutContent(value: unknown): value is AboutPageContent {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
    const record = value as Record<string, unknown>;
    return Object.keys(DEFAULT_ABOUT_CONTENT).every((key) => typeof record[key] === 'string');
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
