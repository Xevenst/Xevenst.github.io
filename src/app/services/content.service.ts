import { Injectable } from '@angular/core';
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  setDoc,
} from 'firebase/firestore';
import { deleteObject, getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { DiaryEntry, StoredFile } from '../models/portfolio.models';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class ContentService {
  constructor(private readonly auth: AuthService) {}

  async listFiles(): Promise<StoredFile[]> {
    this.requireAdmin();
    const database = this.requireDatabase();
    const snapshot = await getDocs(query(collection(database, 'site_files'), orderBy('uploadedAt', 'desc')));
    return snapshot.docs.map((file) => this.toStoredFile(file.id, file.data()));
  }

  async uploadFile(file: File): Promise<StoredFile> {
    this.requireAdmin();
    const database = this.requireDatabase();
    const storage = this.requireStorage();
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '-');
    const path = `${Date.now()}-${safeName}`;
    await uploadBytes(ref(storage, `portfolio-files/${path}`), file, {
      contentType: file.type || 'application/octet-stream',
    });
    const record: StoredFile = {
      id: crypto.randomUUID(),
      name: file.name,
      path,
      contentType: file.type || 'application/octet-stream',
      size: file.size,
      downloadUrl: await getDownloadURL(ref(storage, `portfolio-files/${path}`)),
      uploadedAt: new Date().toISOString(),
    };
    await setDoc(doc(database, 'site_files', record.id), record);
    return record;
  }

  async deleteFile(file: StoredFile): Promise<void> {
    this.requireAdmin();
    await deleteObject(ref(this.requireStorage(), `portfolio-files/${file.path}`));
    await deleteDoc(doc(this.requireDatabase(), 'site_files', file.id));
  }

  async listDiaryEntries(): Promise<DiaryEntry[]> {
    this.requireAdmin();
    const snapshot = await getDocs(query(collection(this.requireDatabase(), 'diary_entries'), orderBy('updatedAt', 'desc')));
    return snapshot.docs.map((entry) => this.toDiaryEntry(entry.data()));
  }

  async saveDiaryEntry(entry: DiaryEntry): Promise<void> {
    this.requireAdmin();
    await setDoc(doc(this.requireDatabase(), 'diary_entries', entry.id), entry);
  }

  async deleteDiaryEntry(entryId: string): Promise<void> {
    this.requireAdmin();
    await deleteDoc(doc(this.requireDatabase(), 'diary_entries', entryId));
  }

  private requireDatabase() {
    if (!this.auth.database) throw new Error('The database is not configured.');
    return this.auth.database;
  }

  private requireStorage() {
    if (!this.auth.fileStorage) throw new Error('File storage is not configured.');
    return this.auth.fileStorage;
  }

  private requireAdmin(): void {
    if (!this.auth.isAdmin) throw new Error('Admin access is required for content management.');
  }

  private toStoredFile(id: string, value: Record<string, unknown>): StoredFile {
    return {
      id,
      name: String(value['name']),
      path: String(value['path']),
      contentType: String(value['contentType']),
      size: Number(value['size']),
      downloadUrl: String(value['downloadUrl']),
      uploadedAt: String(value['uploadedAt']),
    };
  }

  private toDiaryEntry(value: Record<string, unknown>): DiaryEntry {
    return {
      id: String(value['id']),
      title: String(value['title']),
      body: String(value['body']),
      createdAt: String(value['createdAt']),
      updatedAt: String(value['updatedAt']),
    };
  }
}
