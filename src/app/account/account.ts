import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
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
  savedProjects: PortfolioProject[] = [];
  loading = true;
  error: string | null = null;

  constructor(private readonly auth: AuthService, private readonly database: DatabaseService) {
    this.user$ = this.auth.user$;
    this.configState$ = this.auth.configState$;
  }

  async ngOnInit(): Promise<void> {
    try {
      const ids = await this.database.getBookmarks();
      const projects = await this.database.getProjects();
      this.savedProjects = projects.filter((project) => ids.includes(project.id));
    } catch (error: unknown) {
      this.error = error instanceof Error ? error.message : 'Saved work could not be loaded.';
    } finally {
      this.loading = false;
    }
  }

  async signOut(): Promise<void> {
    await this.auth.signOut();
  }
}
