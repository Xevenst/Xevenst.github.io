import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ContentService } from '../services/content.service';
import { DatabaseService } from '../services/database.service';
import { DEFAULT_ABOUT_CONTENT, DEFAULT_PORTFOLIO_CONTENT, ABOUT_CONTENT_SECTIONS, PORTFOLIO_CONTENT_FIELDS } from '../data/site-copy.data';
import { AboutPageContent, DiaryEntry, HobbyEntry, PortfolioPageContent, StoredFile } from '../models/portfolio.models';
import { DriveImageComponent } from '../shared/drive-image/drive-image';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, DriveImageComponent],
  templateUrl: './admin.html',
  styleUrl: './admin.scss',
})
export class AdminComponent {
  files: StoredFile[] = [];
  diaryEntries: DiaryEntry[] = [];
  hobbies: HobbyEntry[] = [];
  isNewHobbyEntry = false;
  aboutContent: AboutPageContent = { ...DEFAULT_ABOUT_CONTENT };
  portfolioContent: PortfolioPageContent = { ...DEFAULT_PORTFOLIO_CONTENT };
  readonly aboutContentSections = ABOUT_CONTENT_SECTIONS.map((section) => ({
    ...section,
    fields: section.fields.map((field) => ({
      ...field,
      multiline: 'multiline' in field && field.multiline,
    })),
  }));
  readonly portfolioContentFields = PORTFOLIO_CONTENT_FIELDS.map((field) => ({
    ...field,
    multiline: 'multiline' in field && field.multiline,
  }));
  selectedDiary: DiaryEntry | null = null;
  selectedHobby: HobbyEntry | null = null;
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
        this.content.listFiles(),
        this.content.listDiaryEntries(),
        this.content.listHobbyEntries(),
        this.database.getAboutContent(),
        this.database.getPortfolioPageContent(),
      ]);

      if (results[0].status === 'fulfilled') {
        const files = new Map(results[0].value.map((file) => [file.id, file]));
        this.fileChanges.forEach((file, id) => {
          if (file) files.set(id, file);
          else files.delete(id);
        });
        this.files = [...files.values()].sort((left, right) => right.uploadedAt.localeCompare(left.uploadedAt));
      }
      if (results[1].status === 'fulfilled') this.diaryEntries = results[1].value;
      if (results[2].status === 'fulfilled') this.hobbies = results[2].value;
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

  editHobby(entry: HobbyEntry): void {
    this.selectedHobby = { ...entry };
    this.isNewHobbyEntry = false;
    this.message = null;
    this.error = null;
  }

  newHobby(): void {
    const now = new Date().toISOString();
    this.selectedHobby = { id: crypto.randomUUID(), title: '', description: '', photoUrl: '', createdAt: now, updatedAt: now };
    this.isNewHobbyEntry = true;
    this.message = null;
    this.error = null;
  }

  async saveHobby(): Promise<void> {
    if (!this.selectedHobby) return;
    try {
      this.selectedHobby.updatedAt = new Date().toISOString();
      await this.content.saveHobbyEntry(this.selectedHobby);
      this.message = 'Hobby entry saved.';
      await this.load();
    } catch (error: unknown) {
      this.error = error instanceof Error ? error.message : 'The hobby entry could not be saved.';
    } finally {
      this.changeDetector.markForCheck();
    }
  }

  async saveAndAddHobby(): Promise<void> {
    if (!this.selectedHobby) return;
    try {
      this.selectedHobby.updatedAt = new Date().toISOString();
      await this.content.saveHobbyEntry(this.selectedHobby);
      await this.load();
      this.newHobby();
      this.message = 'Saved; ready for a new entry.';
    } catch (error: unknown) {
      this.error = error instanceof Error ? error.message : 'The hobby entry could not be saved.';
    } finally {
      this.changeDetector.markForCheck();
    }
  }

  async removeHobby(entry: HobbyEntry): Promise<void> {
    try {
      await this.content.deleteHobbyEntry(entry.id);
      this.message = 'Hobby entry removed.';
      await this.load();
    } catch (error: unknown) {
      this.error = error instanceof Error ? error.message : 'The hobby entry could not be removed.';
    } finally {
      this.changeDetector.markForCheck();
    }
  }
}
