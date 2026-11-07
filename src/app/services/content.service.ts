import { Injectable } from '@angular/core';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  setDoc,
} from 'firebase/firestore';
import { DiaryEntry, StoredFile } from '../models/portfolio.models';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

const MAX_FILE_SIZE = 20 * 1024 * 1024;
const DRIVE_JOB_TIMEOUT_MS = 60_000;

@Injectable({ providedIn: 'root' })
export class ContentService {
  constructor(private readonly auth: AuthService) {}

  async listFiles(): Promise<StoredFile[]> {
    this.requireAdmin();
    const database = this.requireDatabase();
    const snapshot = await getDocs(query(collection(database, 'site_files'), orderBy('uploadedAt', 'desc')));
    return snapshot.docs.map((file) => this.toStoredFile(file.id, file.data()));
  }

  async uploadFile(file: File, publicAccess = false): Promise<StoredFile> {
    this.requireAdmin();
    const database = this.requireDatabase();
    if (file.size > MAX_FILE_SIZE) {
      throw new Error('Files must be 20 MB or smaller for Google Drive uploads.');
    }

    const requestId = crypto.randomUUID();
    const base64 = await this.toBase64(file);
    await this.runDriveJob({
      action: 'upload',
      requestId,
      fileName: file.name,
      contentType: file.type || 'application/octet-stream',
      base64,
      visibility: publicAccess ? 'public' : 'private',
    });

    const snapshot = await getDoc(doc(database, 'site_files', requestId));
    if (!snapshot.exists()) throw new Error('Google Drive finished uploading, but the file record is missing.');
    return this.toStoredFile(snapshot.id, snapshot.data());
  }

  async deleteFile(file: StoredFile): Promise<void> {
    this.requireAdmin();
    await this.runDriveJob({
      action: 'delete',
      recordId: file.id,
      driveFileId: file.driveFileId,
    });
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

  private async runDriveJob(request: Record<string, string>): Promise<void> {
    const endpoint = this.requireDriveEndpoint();
    const database = this.requireDatabase();
    const user = this.auth.client?.currentUser;
    if (!user) throw new Error('Sign in with the administrator account before managing files.');

    const requestId = request['action'] === 'upload'
      ? request['requestId']
      : crypto.randomUUID();
    const jobRef = doc(database, 'site_file_jobs', requestId);
    await setDoc(jobRef, {
      action: request['action'],
      status: 'pending',
      createdAt: new Date().toISOString(),
    });

    try {
      const idToken = await user.getIdToken();
      const response = await fetch(endpoint, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
        body: JSON.stringify({ ...request, requestId, idToken }),
      });
      if (response.type !== 'opaque') {
        throw new Error('Google Drive endpoint returned an unexpected response.');
      }

      const result = await this.waitForDriveJob(jobRef);
      if (result['status'] !== 'completed') {
        throw new Error(String(result['error'] ?? 'Google Drive could not complete the request.'));
      }
    } finally {
      await deleteDoc(jobRef);
    }
  }

  private async waitForDriveJob(jobRef: ReturnType<typeof doc>): Promise<Record<string, unknown>> {
    const deadline = Date.now() + DRIVE_JOB_TIMEOUT_MS;
    while (Date.now() < deadline) {
      const snapshot = await getDoc(jobRef);
      if (snapshot.exists()) {
        const result = snapshot.data();
        if (result['status'] === 'completed' || result['status'] === 'failed') return result;
      }
      await new Promise((resolve) => setTimeout(resolve, 750));
    }
    throw new Error('Google Drive did not respond in time. Check the Apps Script deployment and try again.');
  }

  private requireDriveEndpoint(): string {
    const value = environment.googleDriveWebAppUrl;
    if (!value) {
      throw new Error('Google Drive uploads are not configured. Set the Google Apps Script web app URL first.');
    }

    let url: URL;
    try {
      url = new URL(value);
    } catch {
      throw new Error('The Google Drive Apps Script URL is invalid.');
    }
    if (url.protocol !== 'https:' || url.hostname !== 'script.google.com' || !/^\/macros\/s\/[^/]+\/exec$/.test(url.pathname)) {
      throw new Error('Use the deployed Google Apps Script URL ending in /exec.');
    }
    return url.toString();
  }

  private async toBase64(file: File): Promise<string> {
    const bytes = new Uint8Array(await file.arrayBuffer());
    let binary = '';
    for (let offset = 0; offset < bytes.length; offset += 0x8000) {
      binary += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000));
    }
    return btoa(binary);
  }

  private requireAdmin(): void {
    if (!this.auth.isAdmin) throw new Error('Admin access is required for content management.');
  }

  private toStoredFile(id: string, value: Record<string, unknown>): StoredFile {
    return {
      id,
      name: String(value['name']),
      driveFileId: String(value['driveFileId']),
      contentType: String(value['contentType']),
      size: Number(value['size']),
      downloadUrl: String(value['downloadUrl']),
      uploadedAt: String(value['uploadedAt']),
      visibility: value['visibility'] === 'public' ? 'public' : 'private',
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
