import { WorkExperienceEntry } from '../models/portfolio.models';

/**
 * Parses the structured work experience JSON stored in `experienceItemsJson`.
 * Returns an empty array when the value is missing, invalid, or contains no usable entries.
 */
export function parseStructuredWorkExperience(json: string | null | undefined): WorkExperienceEntry[] {
  const raw = (json ?? '').trim();
  if (!raw) return [];

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return [];
  }

  if (!Array.isArray(parsed)) return [];

  return parsed
    .filter((value): value is Record<string, unknown> => isRecord(value))
    .map((value) => ({
      date: typeof value['date'] === 'string' ? value['date'].trim() : '',
      company: typeof value['company'] === 'string' ? value['company'].trim() : '',
      role: typeof value['role'] === 'string' ? value['role'].trim() : '',
      bullets: toStringArray(value['bullets']),
      logoUrl: typeof value['logoUrl'] === 'string' ? value['logoUrl'].trim() : '',
    }))
    .filter((entry) => entry.date || entry.company || entry.role || entry.bullets.length || entry.logoUrl);
}

/**
 * Serialises entries into the JSON string stored in `experienceItemsJson`.
 * Returns an empty string when there is nothing to save.
 */
export function serializeWorkExperience(entries: WorkExperienceEntry[]): string {
  const cleaned = entries
    .map((entry) => ({
      date: entry.date.trim(),
      company: entry.company.trim(),
      role: entry.role.trim(),
      bullets: entry.bullets.map((bullet) => bullet.trim()).filter(Boolean),
      logoUrl: entry.logoUrl.trim(),
    }))
    .filter((entry) => entry.date || entry.company || entry.role || entry.bullets.length || entry.logoUrl);

  return cleaned.length ? JSON.stringify(cleaned) : '';
}

/**
 * Splits a "one bullet per line" textarea value into trimmed bullet strings.
 * Leading dash or bullet characters are stripped so users can type either style.
 */
export function splitBulletText(text: string | null | undefined): string[] {
  return (text ?? '')
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((line) => line.trim().replace(/^[-•*]\s+/, '').trim())
    .filter(Boolean);
}

/** Joins bullets back into the "one bullet per line" textarea format. */
export function joinBulletText(bullets: string[]): string {
  return bullets.join('\n');
}

/**
 * Parses the legacy pipe-separated `experienceEntries` format:
 *   date|company|role|description[|logoUrl]
 * one entry per line. Descriptions may span multiple lines and may use "- " bullets.
 * Plain, non-bulleted descriptions are treated as a single bullet so every entry stays visible.
 */
export function parseLegacyWorkExperience(value: string | null | undefined): WorkExperienceEntry[] {
  const normalized = (value ?? '').replace(/\r\n?/g, '\n');
  if (!normalized.trim()) return [];

  const entries: WorkExperienceEntry[] = [];
  let header: string[] | null = null;
  let descriptionLines: string[] = [];

  const flush = (): void => {
    if (!header) return;
    const [date = '', company = '', role = '', ...rest] = header;
    let logoUrl = '';

    // When the header has a description and a separate logo field
    // (date|company|role|description|logoUrl), the last field is the logo URL.
    // Pull it out before joining so it never leaks into the bullet list.
    if (rest.length >= 2) {
      const candidate = rest[rest.length - 1].trim();
      if (/^https?:\/\//i.test(candidate)) {
        logoUrl = candidate;
        rest.pop();
      }
    }

    let description = [...rest, ...descriptionLines].join('\n').trim();

    // Fallback: a trailing Drive/HTTP link on its own line is the logo.
    if (!logoUrl) {
      const urlMatch = description.match(/(?:^|\n)\|?\s*(https?:\/\/\S+)\s*$/);
      if (urlMatch) {
        logoUrl = urlMatch[1];
        description = description.slice(0, urlMatch.index).trim();
      }
    }

    const lines = description
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);

    const bullets = lines.map((line) => line.replace(/^[-•*]\s+/, '').trim()).filter(Boolean);

    entries.push({
      date: date.trim(),
      company: company.trim(),
      role: role.trim(),
      bullets,
      logoUrl,
    });

    header = null;
    descriptionLines = [];
  };

  for (const line of normalized.split('\n')) {
    if (isEntryHeader(line)) {
      flush();
      header = line.trim().split('|');
    } else if (header) {
      descriptionLines.push(line);
    }
  }
  flush();

  return entries.filter((entry) => entry.date || entry.company || entry.role || entry.bullets.length || entry.logoUrl);
}

function isEntryHeader(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed || /^[-•*]\s+/.test(trimmed)) return false;
  const fields = trimmed.split('|');
  return fields.length >= 3
    && fields[0].trim().length > 0
    && fields[1].trim().length > 0
    && fields[2].trim().length > 0;
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter(Boolean);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
