import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges } from '@angular/core';

@Component({
  selector: 'app-drive-image',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './drive-image.html',
  styleUrl: './drive-image.scss',
})
export class DriveImageComponent implements OnChanges {
  @Input({ required: true }) src = '';
  @Input() alt = '';
  @Input() loading: 'eager' | 'lazy' = 'eager';
  @Input() fetchPriority: 'high' | 'low' | 'auto' = 'auto';
  @Input() placeholder = 'Photo will appear here';
  @Input() errorText = 'Photo could not be loaded. Check that the Google Drive file is shared with “Anyone with the link”.';

  currentUrl = '';
  failed = false;
  private candidates: string[] = [];
  private candidateIndex = 0;

  ngOnChanges(): void {
    this.candidates = driveImageCandidates(this.src);
    this.candidateIndex = 0;
    this.currentUrl = this.candidates[0] ?? '';
    this.failed = false;
  }

  handleError(): void {
    this.candidateIndex += 1;
    const next = this.candidates[this.candidateIndex];
    if (next) {
      this.currentUrl = next;
      return;
    }
    this.currentUrl = '';
    this.failed = true;
  }
}

/**
 * Google Drive viewer links cannot be used as an image source directly. Build a
 * few image endpoints so the browser can fall back when one of them is blocked
 * or rate limited.
 */
export function driveImageCandidates(value: string): string[] {
  const trimmed = value.trim();
  if (!trimmed) return [];

  let url: URL;
  try {
    url = new URL(trimmed, 'https://xevenst.github.io');
  } catch {
    return [trimmed];
  }

  const host = url.hostname.toLowerCase();
  const isDriveHost = host === 'drive.google.com'
    || host === 'docs.google.com'
    || host === 'drive.usercontent.google.com'
    || /^lh\d+\.googleusercontent\.com$/.test(host);
  if (!isDriveHost) return [trimmed];

  const fileId = extractDriveFileId(url);
  if (!fileId) return [trimmed];

  const resourceKey = url.searchParams.get('resourcekey');
  const resourceQuery = resourceKey ? `&resourcekey=${encodeURIComponent(resourceKey)}` : '';
  const directQuery = resourceKey ? `?resourcekey=${encodeURIComponent(resourceKey)}` : '';
  const encodedId = encodeURIComponent(fileId);

  return unique([
    `https://lh3.googleusercontent.com/d/${encodedId}=w1600${directQuery}`,
    `https://drive.google.com/thumbnail?id=${encodedId}&sz=w1600${resourceQuery}`,
    `https://drive.google.com/uc?export=view&id=${encodedId}${resourceQuery}`,
  ]);
}

function extractDriveFileId(url: URL): string | null {
  const pathMatch = url.pathname.match(/\/d\/([^/=:]+)/i);
  if (pathMatch?.[1]) {
    try {
      return decodeURIComponent(pathMatch[1]);
    } catch {
      return pathMatch[1];
    }
  }
  return url.searchParams.get('id');
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}
