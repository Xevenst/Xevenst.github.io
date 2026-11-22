import { isPlatformBrowser } from '@angular/common';
import { ChangeDetectorRef, Component, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import {
  DEFAULT_ABOUT_CONTENT,
  LEGACY_DEFAULT_ABOUT_SKILLS,
  PREVIOUS_DEFAULT_ABOUT_SKILLS,
} from '../data/site-copy.data';
import { AboutPageContent, HobbyEntry, PortfolioProject } from '../models/portfolio.models';
import { DatabaseService } from '../services/database.service';
import { GitHubProjectsService, selectPinnedPublicProjects } from '../services/github-projects.service';
import { DriveImageComponent } from '../shared/drive-image/drive-image';

const FALLBACK_HERO_PHOTO_URL = 'https://drive.google.com/file/d/1A5G6Eo_b2EYpBWZjo59I9oRr6F7WlEc1/view?usp=drive_link';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CommonModule, RouterLink, DriveImageComponent],
  templateUrl: './about.html',
  styleUrl: './about.scss',
})
export class AboutComponent {
  readonly fallbackHeroPhotoUrl = FALLBACK_HERO_PHOTO_URL;
  content: AboutPageContent = DEFAULT_ABOUT_CONTENT;
  pinnedProjects: PortfolioProject[] = [];
  publicProjects: PortfolioProject[] = [];
  showAllProjects = false;
  projectsLoaded = false;
  projectsLoading = false;
  contentError: string | null = null;
  projectError: string | null = null;
  contentAvailable = true;
  loading = true;
  hobbies: HobbyEntry[] = [];
  private readonly contentCacheKey = 'xevenst-about-content-v1';
  private readonly projectsCacheKey = 'xevenst-public-projects-v1';

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

    const cachedProjects = this.readCachedProjects();
    if (cachedProjects) {
      this.publicProjects = cachedProjects;
      this.pinnedProjects = selectPinnedPublicProjects(cachedProjects);
      this.projectsLoaded = true;
    }

    const [contentResult] = await Promise.allSettled([
      this.withTimeout(this.database.getAboutContent(), 'Timed out loading About content from Firebase.'),
    ]);

    if (contentResult.status === 'fulfilled') {
      this.content = contentResult.value;
      this.contentAvailable = true;
      this.cacheContent(contentResult.value);
    } else {
      const error = this.errorMessage(contentResult.reason, 'About page content could not be loaded from Firebase.');
      this.contentError = cachedContent
        ? `Firebase refresh failed; showing the previously loaded About page. ${error}`
        : `Firebase refresh failed; showing the default About page content. ${error}`;
    }

    this.loading = false;

    if (isPlatformBrowser(this.platformId)) {
      try {
        this.hobbies = await this.database.listHobbies();
      } catch {
        this.hobbies = [];
      }
    }
    this.changeDetector.markForCheck();
  }

  get visibleProjects(): PortfolioProject[] {
    return this.showAllProjects ? this.publicProjects : this.pinnedProjects;
  }

  toggleProjects(): void {
    this.showAllProjects = !this.showAllProjects;
  }

  async loadProjects(): Promise<void> {
    if (this.projectsLoading) return;
    this.projectsLoading = true;
    this.projectError = null;
    try {
      const projects = await this.withTimeout(
        this.githubProjects.getPublicProjects(),
        'Timed out loading public GitHub projects.',
      );
      this.publicProjects = projects;
      this.pinnedProjects = selectPinnedPublicProjects(projects);
      this.cacheProjects(projects);
      this.projectsLoaded = true;
    } catch (error: unknown) {
      const status = this.httpStatus(error);
      this.projectError = status === 403
        ? 'GitHub’s public API rate limit has been reached. Try again after it resets.'
        : this.errorMessage(error, 'Public GitHub projects could not be loaded.');
    } finally {
      this.projectsLoading = false;
      this.changeDetector.markForCheck();
    }
  }

  get hobbyItems(): { title: string; description: string; photoUrl: string }[] {
    if (this.hobbies.length) {
      return this.hobbies.map((entry) => ({
        title: entry.title,
        description: entry.description,
        photoUrl: entry.photoUrl,
      }));
    }
    return this.content.hobbyEntries.split(/\r?\n/)
      .map((row) => row.split('|'))
      .map(([title = '', description = '', ...photoUrlParts]) => ({
        title: title.trim(),
        description: description.trim(),
        photoUrl: photoUrlParts.join('|').trim(),
      }))
      .filter((hobby) => hobby.title && hobby.description);
  }

  get highlights(): { value: string; label: string }[] {
    return [
      { value: this.content.highlightOneValue, label: this.content.highlightOneLabel },
      { value: this.content.highlightTwoValue, label: this.content.highlightTwoLabel },
      { value: this.content.highlightThreeValue, label: this.content.highlightThreeLabel },
    ];
  }

  get experienceItems(): { date: string; company: string; role: string; description: string; logoUrl: string }[] {
    return this.content.experienceEntries.split(/\r?\n/)
      .map((row) => row.split('|').map((field) => field.trim()))
      .filter((fields) => (fields.length === 4 || fields.length === 5) && fields.slice(0, 4).every(Boolean))
      .map(([date, company, role, description, logoUrl = '']) => ({ date, company, role, description, logoUrl }));
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
      if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
        const content = { ...DEFAULT_ABOUT_CONTENT, ...parsed };
        if (content.skills === LEGACY_DEFAULT_ABOUT_SKILLS || content.skills === PREVIOUS_DEFAULT_ABOUT_SKILLS) {
          content.skills = DEFAULT_ABOUT_CONTENT.skills;
        }
        if (this.isAboutContent(content)) return content;
      }
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

  private readCachedProjects(): PortfolioProject[] | null {
    try {
      const stored = window.localStorage.getItem(this.projectsCacheKey);
      if (!stored) return null;
      const parsed: unknown = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.every(isPortfolioProject)) return parsed;
      window.localStorage.removeItem(this.projectsCacheKey);
    } catch (error: unknown) {
      console.warn('The saved public GitHub projects could not be read from this browser.', error);
    }
    return null;
  }

  private cacheProjects(projects: PortfolioProject[]): void {
    try {
      window.localStorage.setItem(this.projectsCacheKey, JSON.stringify(projects));
    } catch (error: unknown) {
      console.warn('The public GitHub projects could not be cached in this browser.', error);
    }
  }

  private httpStatus(error: unknown): number | null {
    if (typeof error !== 'object' || error === null || !('status' in error)) return null;
    return typeof error.status === 'number' ? error.status : null;
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

function isPortfolioProject(value: unknown): value is PortfolioProject {
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
