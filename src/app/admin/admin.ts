import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component } from '@angular/core';
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
  publicFileAccess = false;
  selectedFile: File | null = null;
  private readonly fileChanges = new Map<string, StoredFile | null>();

  constructor(
    private readonly database: DatabaseService,
    private readonly content: ContentService,
    private readonly changeDetector: ChangeDetectorRef,
  ) {
    void this.load();
  }

  async load(): Promise<void> {
    try {
      const results = await Promise.allSettled([
        this.database.getProjects(),
        this.content.listFiles(),
        this.content.listDiaryEntries(),
        this.database.getAboutContent(),
        this.database.getPortfolioPageContent(),
      ]);

      if (results[0].status === 'fulfilled') {
        this.projects = results[0].value;
        this.projectsSource = this.database.source;
      }
      if (results[1].status === 'fulfilled') {
        const files = new Map(results[1].value.map((file) => [file.id, file]));
        this.fileChanges.forEach((file, id) => {
          if (file) files.set(id, file);
          else files.delete(id);
        });
        this.files = [...files.values()].sort((left, right) => right.uploadedAt.localeCompare(left.uploadedAt));
      }
      if (results[2].status === 'fulfilled') this.diaryEntries = results[2].value;
      if (results[3].status === 'fulfilled') this.aboutContent = results[3].value;
      if (results[4].status === 'fulfilled') this.portfolioContent = results[4].value;

      const failures = results
        .filter((result): result is PromiseRejectedResult => result.status === 'rejected')
        .map(({ reason }) => reason instanceof Error ? reason.message : 'Some admin content could not be loaded.');
      this.error = failures.length ? failures.join(' ') : null;
    } finally {
      this.changeDetector.markForCheck();
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
    } finally {
      this.changeDetector.markForCheck();
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
    } finally {
      this.changeDetector.markForCheck();
    }
  }

  async saveAboutContent(): Promise<void> {
    try {
      await this.database.saveAboutContent(this.aboutContent);
      this.message = 'About page copy saved to Firestore.';
      this.error = null;
    } catch (error: unknown) {
      this.error = error instanceof Error ? error.message : 'About page copy could not be saved.';
    } finally {
      this.changeDetector.markForCheck();
    }
  }

  async savePortfolioContent(): Promise<void> {
    try {
      await this.database.savePortfolioPageContent(this.portfolioContent);
      this.message = 'Portfolio page copy saved to Firestore.';
      this.error = null;
    } catch (error: unknown) {
      this.error = error instanceof Error ? error.message : 'Portfolio page copy could not be saved.';
    } finally {
      this.changeDetector.markForCheck();
    }
  }

  async remove(project: PortfolioProject): Promise<void> {
    try {
      await this.database.deleteProject(project.id);
      this.message = `${project.title} removed from Firebase.`;
      await this.load();
    } catch (error: unknown) {
      this.error = error instanceof Error ? error.message : 'The project could not be removed.';
    } finally {
      this.changeDetector.markForCheck();
    }
  }

  selectFile(event: Event): void {
    this.selectedFile = (event.target as HTMLInputElement).files?.[0] ?? null;
    this.message = null;
    this.error = null;
    this.changeDetector.markForCheck();
  }

  clearSelectedFile(input: HTMLInputElement): void {
    this.selectedFile = null;
    input.value = '';
    this.changeDetector.markForCheck();
  }

  async upload(input: HTMLInputElement): Promise<void> {
    const file = this.selectedFile;
    if (!file) return;
    this.uploading = true;
    this.error = null;
    let uploaded = false;
    try {
      const savedFile = await this.content.uploadFile(file, this.publicFileAccess);
      this.fileChanges.set(savedFile.id, savedFile);
      this.files = [savedFile, ...this.files.filter((existing) => existing.id !== savedFile.id)]
        .sort((left, right) => right.uploadedAt.localeCompare(left.uploadedAt));
      this.message = `${file.name} uploaded to Google Drive.`;
      this.selectedFile = null;
      uploaded = true;
    } catch (error: unknown) {
      this.error = error instanceof Error ? error.message : 'The file could not be uploaded.';
    } finally {
      this.uploading = false;
      if (uploaded) input.value = '';
      this.changeDetector.markForCheck();
    }
  }

  async removeFile(file: StoredFile): Promise<void> {
    try {
      await this.content.deleteFile(file);
      this.fileChanges.set(file.id, null);
      this.files = this.files.filter((existing) => existing.id !== file.id);
      this.message = `${file.name} removed from Google Drive.`;
    } catch (error: unknown) {
      this.error = error instanceof Error ? error.message : 'The file could not be removed.';
    } finally {
      this.changeDetector.markForCheck();
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
    } finally {
      this.changeDetector.markForCheck();
    }
  }

  async removeDiary(entry: DiaryEntry): Promise<void> {
    try {
      await this.content.deleteDiaryEntry(entry.id);
      this.message = 'Private diary entry removed.';
      await this.load();
    } catch (error: unknown) {
      this.error = error instanceof Error ? error.message : 'The diary entry could not be removed.';
    } finally {
      this.changeDetector.markForCheck();
    }
  }
}
