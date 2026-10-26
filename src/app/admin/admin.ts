import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ContentService } from '../services/content.service';
import { DatabaseService } from '../services/database.service';
import { DiaryEntry, PortfolioProject, StoredFile } from '../models/portfolio.models';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin.html',
  styleUrl: './admin.scss',
})
export class AdminComponent {
  projects: PortfolioProject[] = [];
  files: StoredFile[] = [];
  diaryEntries: DiaryEntry[] = [];
  selected: PortfolioProject | null = null;
  selectedDiary: DiaryEntry | null = null;
  message: string | null = null;
  error: string | null = null;
  uploading = false;

  constructor(private readonly database: DatabaseService, private readonly content: ContentService) {
    void this.load();
  }

  async load(): Promise<void> {
    try {
      [this.projects, this.files, this.diaryEntries] = await Promise.all([
        this.database.getProjects(),
        this.content.listFiles(),
        this.content.listDiaryEntries(),
      ]);
    } catch (error: unknown) {
      this.error = error instanceof Error ? error.message : 'Admin content could not be loaded.';
    }
  }

  edit(project: PortfolioProject): void {
    this.selected = { ...project, technologies: [...project.technologies] };
    this.message = null;
    this.error = null;
  }

  async save(): Promise<void> {
    if (!this.selected) return;
    try {
      await this.database.saveProject(this.selected);
      this.message = 'Project saved to Firebase.';
      await this.load();
    } catch (error: unknown) {
      this.error = error instanceof Error ? error.message : 'The project could not be saved.';
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
