import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DEFAULT_ABOUT_CONTENT } from '../data/site-copy.data';
import { AboutPageContent, PortfolioProject } from '../models/portfolio.models';
import { DatabaseService } from '../services/database.service';

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

  constructor(private readonly database: DatabaseService) {}

  async ngOnInit(): Promise<void> {
    const [content, projects] = await Promise.all([
      this.database.getAboutContent(),
      this.database.getProjects(),
    ]);
    this.content = content;
    this.featuredProjects = projects.filter((project) => project.featured);
    this.contentError = this.database.error;
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
}
