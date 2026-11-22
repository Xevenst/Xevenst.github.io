import { driveImageCandidates } from './drive-image';

describe('driveImageCandidates', () => {
  it('converts Drive viewer links to direct image URLs', () => {
    const candidates = driveImageCandidates('https://drive.google.com/file/d/abc123/view?usp=drive_link');

    expect(candidates[0]).toBe('https://lh3.googleusercontent.com/d/abc123=w1600');
    expect(candidates[1]).toBe('https://drive.google.com/thumbnail?id=abc123&sz=w1600');
    expect(candidates[2]).toBe('https://drive.google.com/uc?export=view&id=abc123');
  });

  it('keeps resource keys used by shared drive files', () => {
    const candidates = driveImageCandidates('https://drive.google.com/file/d/abc123/view?resourcekey=0-key');

    expect(candidates[0]).toBe('https://lh3.googleusercontent.com/d/abc123=w1600?resourcekey=0-key');
    expect(candidates[1]).toBe('https://drive.google.com/thumbnail?id=abc123&sz=w1600&resourcekey=0-key');
    expect(candidates[2]).toBe('https://drive.google.com/uc?export=view&id=abc123&resourcekey=0-key');
  });

  it('leaves non-Drive image URLs unchanged', () => {
    expect(driveImageCandidates('https://example.com/photo.jpg')).toEqual(['https://example.com/photo.jpg']);
  });

  it('ignores empty values', () => {
    expect(driveImageCandidates('  ')).toEqual([]);
  });
});
