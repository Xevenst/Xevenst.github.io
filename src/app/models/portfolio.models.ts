export interface PortfolioProject {
  id: string;
  title: string;
  year: string;
  type: string;
  summary: string;
  details: string;
  technologies: string[];
  githubUrl: string;
  featured: boolean;
  accent: string;
}

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoUrl: string | null;
}

export interface StoredFile {
  id: string;
  name: string;
  path: string;
  contentType: string;
  size: number;
  downloadUrl: string;
  uploadedAt: string;
}

export interface DiaryEntry {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  updatedAt: string;
}
