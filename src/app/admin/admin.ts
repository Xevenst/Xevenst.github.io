import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ContentService } from '../services/content.service';
import { DatabaseService } from '../services/database.service';
import { DEFAULT_ABOUT_CONTENT, DEFAULT_PORTFOLIO_CONTENT, ABOUT_CONTENT_FIELDS, PORTFOLIO_CONTENT_FIELDS } from '../data/site-copy.data';
import { PORTFOLIO_PROJECTS } from '../data/portfolio.data';
import { AboutPageContent, DiaryEntry, PortfolioPageContent, PortfolioProject, StoredFile } from '../models/portfolio.models';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin.html',
  styleUrl: './admin.scss',
})
export class AdminComponent {
  projects: PortfolioProject[] = [];
  projectsSource = 'local';
  files: StoredFile[] = [];
  diaryEntries: DiaryEntry[] = [];
  aboutContent: AboutPageContent = { ...DEFAULT_ABOUT_CONTENT };
  portfolioContent: PortfolioPageContent = { ...DEFAULT_PORTFOLIO_CONTENT };
  readonly aboutContentFields = ABOUT_CONTENT_FIELDS.map((field) => ({
    ...field,
    multiline: 'multiline' in field && field.multiline,
  }));
  readonly portfolioContentFields = PORTFOLIO_CONTENT_FIELDS.map((field) => ({
    ...field,
    multiline: 'multiline' in field && field.multiline,
  }));
  selected: PortfolioProject | null = null;
  technologiesText = '';
  selectedDiary: DiaryEntry | null = null;
  message: string | null = null;
  error: string | null = null;
  uploading = false;

  constructor(private readonly database: DatabaseService, private readonly content: ContentService) {
    void this.load();
  }

  async load(): Promise<void> {
    try {
      [this.projects, this.files, this.diaryEntries, this.aboutContent, this.portfolioContent] = await Promise.all([
        this.database.getProjects(),
        this.content.listFiles(),
        this.content.listDiaryEntries(),
        this.database.getAboutContent(),
        this.database.getPortfolioPageContent(),
      ]);
      this.projectsSource = this.database.source;
      this.error = this.database.error;
    } catch (error: unknown) {
      this.error = error instanceof Error ? error.message : 'Admin content could not be loaded.';
    }
  }

  edit(project: PortfolioProject): void {
    this.selected = { ...project, technologies: [...project.technologies] };
    this.technologiesText = project.technologies.join('\n');
    this.message = null;
    this.error = null;
  }

  async save(): Promise<void> {
    if (!this.selected) return;
    try {
      this.selected.technologies = this.technologiesText.split(/\r?\n/).map((technology) => technology.trim()).filter(Boolean);
      await this.database.saveProject(this.selected);
      this.message = 'Project saved to Firebase.';
      await this.load();
    } catch (error: unknown) {
      this.error = error instanceof Error ? error.message : 'The project could not be saved.';
    }
  }

  async publishStarterProjects(): Promise<void> {
    try {
      for (const project of PORTFOLIO_PROJECTS) {
        await this.database.saveProject(project);
      }
      this.message = 'Starter projects published to Firestore.';
      await this.load();
    } catch (error: unknown) {
      this.error = error instanceof Error ? error.message : 'Starter projects could not be published.';
    }
  }

  async saveAboutContent(): Promise<void> {
    try {
      await this.database.saveAboutContent(this.aboutContent);
      this.message = 'About page copy saved to Firestore.';
      this.error = null;
    } catch (error: unknown) {
      this.error = error instanceof Error ? error.message : 'About page copy could not be saved.';
    }
  }

  async savePortfolioContent(): Promise<void> {
    try {
      await this.database.savePortfolioPageContent(this.portfolioContent);
      this.message = 'Portfolio page copy saved to Firestore.';
      this.error = null;
    } catch (error: unknown) {
      this.error = error instanceof Error ? error.message : 'Portfolio page copy could not be saved.';
    }
  }

  async remove(project: PortfolioProject): Promise<void> {
    try {
      await this.database.deleteProject(project.id);
      this.message = `${project.title} removed from Firebase.`;
      await this.load();
    } catch (error: unknown) {
      this.error = error instanceof Error ? error.message : 'The project could not be removed.';
    }
  }

  async upload(event: Event): Promise<void> {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.uploading = true;
    this.error = null;
    try {
      await this.content.uploadFile(file);
      this.message = `${file.name} uploaded to Firebase Storage.`;
      await this.load();
    } catch (error: unknown) {
      this.error = error instanceof Error ? error.message : 'The file could not be uploaded.';
    } finally {
      this.uploading = false;
      (event.target as HTMLInputElement).value = '';
    }
  }

  async removeFile(file: StoredFile): Promise<void> {
    try {
      await this.content.deleteFile(file);
      this.message = `${file.name} removed from Firebase Storage.`;
      await this.load();
    } catch (error: unknown) {
      this.error = error instanceof Error ? error.message : 'The file could not be removed.';
    }
  }

  editDiary(entry: DiaryEntry): void {
    this.selectedDiary = { ...entry };
    this.message = null;
    this.error = null;
  }

  newDiary(): void {
    const now = new Date().toISOString();
    this.selectedDiary = { id: crypto.randomUUID(), title: '', body: '', createdAt: now, updatedAt: now };
    this.message = null;
    this.error = null;
  }

  async saveDiary(): Promise<void> {
    if (!this.selectedDiary) return;
    try {
      this.selectedDiary.updatedAt = new Date().toISOString();
      await this.content.saveDiaryEntry(this.selectedDiary);
      this.message = 'Private diary entry saved.';
      await this.load();
    } catch (error: unknown) {
      this.error = error instanceof Error ? error.message : 'The diary entry could not be saved.';
    }
  }

  async removeDiary(entry: DiaryEntry): Promise<void> {
    try {
      await this.content.deleteDiaryEntry(entry.id);
      this.message = 'Private diary entry removed.';
      await this.load();
    } catch (error: unknown) {
      this.error = error instanceof Error ? error.message : 'The diary entry could not be removed.';
    }
  }
}
