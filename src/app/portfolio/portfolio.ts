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
  dataSource = 'local';
  dataError: string | null = null;
  loadError: string | null = null;
  content: PortfolioPageContent = DEFAULT_PORTFOLIO_CONTENT;
  readonly user$;
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
    try {
      [this.projects, this.content] = await Promise.all([
        this.database.getProjects(),
        this.database.getPortfolioPageContent(),
      ]);
      this.dataSource = this.database.source;
      if (this.auth.currentUser) {
        await this.loadBookmarks();
      }
    } catch (error: unknown) {
      this.loadError = error instanceof Error ? error.message : 'Portfolio content could not be loaded from Firebase.';
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
}
