import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { DatabaseService } from '../services/database.service';
import { PortfolioProject } from '../models/portfolio.models';

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
  readonly user$;

  constructor(private readonly database: DatabaseService, private readonly auth: AuthService) {
    this.user$ = auth.user$;
  }

  async ngOnInit(): Promise<void> {
    this.projects = await this.database.getProjects();
    this.dataSource = this.database.source;
    this.dataError = this.database.error;
    this.loading = false;
    if (this.auth.currentUser) {
      await this.loadBookmarks();
    }
  }

  async toggleBookmark(project: PortfolioProject): Promise<void> {
    if (!this.auth.currentUser) {
      this.dataError = 'Sign in to save projects to your personal collection.';
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
