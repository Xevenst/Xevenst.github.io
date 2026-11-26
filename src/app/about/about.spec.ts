import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PLATFORM_ID, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { DEFAULT_ABOUT_CONTENT, PREVIOUS_DEFAULT_ABOUT_SKILLS } from '../data/site-copy.data';
import { PortfolioProject } from '../models/portfolio.models';
import { DatabaseService } from '../services/database.service';
import { GitHubProjectsService } from '../services/github-projects.service';

import { AboutComponent } from './about';

describe('AboutComponent', () => {
  let component: AboutComponent;
  let fixture: ComponentFixture<AboutComponent>;
  let database: jasmine.SpyObj<DatabaseService>;
  let githubProjects: jasmine.SpyObj<GitHubProjectsService>;
  const project: PortfolioProject = {
    id: 'github-chromesthesia',
    title: 'Chromesthesia',
    year: '2022',
    type: 'C#',
    summary: 'A rhythm game.',
    details: 'A rhythm game.',
    technologies: ['C#'],
    githubUrl: 'https://github.com/Xevenst/Chromesthesia',
    featured: true,
    accent: '#b58cff',
  };

  beforeEach(async () => {
    window.localStorage.removeItem('xevenst-public-projects-v1');
    window.localStorage.removeItem('xevenst-about-content-v1');
    database = jasmine.createSpyObj<DatabaseService>('DatabaseService', ['getAboutContent']);
    database.getAboutContent.and.resolveTo(DEFAULT_ABOUT_CONTENT);
    githubProjects = jasmine.createSpyObj<GitHubProjectsService>('GitHubProjectsService', ['getPublicProjects']);
    githubProjects.getPublicProjects.and.resolveTo([project]);

    await TestBed.configureTestingModule({
      imports: [AboutComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        { provide: DatabaseService, useValue: database },
        { provide: GitHubProjectsService, useValue: githubProjects },
        { provide: PLATFORM_ID, useValue: 'browser' },
      ],
    })
    .compileComponents();

    fixture = TestBed.createComponent(AboutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('does not request GitHub projects until the load button is clicked', () => {
    expect(githubProjects.getPublicProjects).not.toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain('Load featured projects');
  });

  it('loads projects only on request and caches them for later visits', async () => {
    await component.loadProjects();

    expect(githubProjects.getPublicProjects).toHaveBeenCalledTimes(1);
    expect(component.projectsLoaded).toBeTrue();
    expect(JSON.parse(window.localStorage.getItem('xevenst-public-projects-v1') ?? '[]'))
      .toEqual([project]);
  });

  it('restores cached projects on a later visit without another API request', async () => {
    window.localStorage.setItem('xevenst-public-projects-v1', JSON.stringify([project]));
    const revisit = TestBed.createComponent(AboutComponent);
    revisit.detectChanges();
    await revisit.whenStable();

    expect(revisit.componentInstance.projectsLoaded).toBeTrue();
    expect(revisit.componentInstance.pinnedProjects).toEqual([project]);
    expect(githubProjects.getPublicProjects).not.toHaveBeenCalled();
  });

  it('updates the previous default skills in cached About content', async () => {
    database.getAboutContent.and.rejectWith(new Error('offline'));
    window.localStorage.setItem('xevenst-about-content-v1', JSON.stringify({
      ...DEFAULT_ABOUT_CONTENT,
      skills: PREVIOUS_DEFAULT_ABOUT_SKILLS,
    }));

    const revisit = TestBed.createComponent(AboutComponent);
    revisit.detectChanges();
    await revisit.whenStable();

    expect(revisit.componentInstance.content.skills).toBe(DEFAULT_ABOUT_CONTENT.skills);
  });

  it('renders the hero photo from a Google Drive link', async () => {
    database.getAboutContent.and.rejectWith(new Error('offline'));
    window.localStorage.setItem('xevenst-about-content-v1', JSON.stringify({
      ...DEFAULT_ABOUT_CONTENT,
      heroImageUrl: 'https://drive.google.com/file/d/hero123/view?usp=drive_link',
    }));

    const revisit = TestBed.createComponent(AboutComponent);
    revisit.detectChanges();
    await revisit.whenStable();

    const image = revisit.nativeElement.querySelector('.about-hero-photo img') as HTMLImageElement;
    expect(image.getAttribute('src')).toBe('https://lh3.googleusercontent.com/d/hero123=w1600');
  });

  it('tries the other Drive image endpoints before showing an error', async () => {
    database.getAboutContent.and.rejectWith(new Error('offline'));
    window.localStorage.setItem('xevenst-about-content-v1', JSON.stringify({
      ...DEFAULT_ABOUT_CONTENT,
      heroImageUrl: 'https://drive.google.com/file/d/hero123/view?usp=drive_link',
    }));

    const revisit = TestBed.createComponent(AboutComponent);
    revisit.detectChanges();
    await revisit.whenStable();

    const image = revisit.nativeElement.querySelector('.about-hero-photo img') as HTMLImageElement;
    image.dispatchEvent(new Event('error'));
    revisit.detectChanges();
    expect(image.getAttribute('src')).toBe('https://drive.google.com/thumbnail?id=hero123&sz=w1600');

    image.dispatchEvent(new Event('error'));
    revisit.detectChanges();
    expect(image.getAttribute('src')).toBe('https://drive.google.com/uc?export=view&id=hero123');

    image.dispatchEvent(new Event('error'));
    revisit.detectChanges();
    expect(revisit.nativeElement.querySelector('.about-hero-photo img')).toBeNull();
    expect(revisit.nativeElement.querySelector('.about-hero-photo')?.textContent).toContain('Photo could not be loaded');
  });

  it('renders work experience logos from Google Drive links', async () => {
    database.getAboutContent.and.rejectWith(new Error('offline'));
    window.localStorage.setItem('xevenst-about-content-v1', JSON.stringify({
      ...DEFAULT_ABOUT_CONTENT,
      experienceEntries: 'Jan 2024 — Present|Acme|Engineer|Builds things.|https://drive.google.com/file/d/logo123/view\nFeb 2020 — Dec 2023|Old Co|Intern|Learned things.',
    }));

    const revisit = TestBed.createComponent(AboutComponent);
    revisit.detectChanges();
    await revisit.whenStable();

    const items = revisit.nativeElement.querySelectorAll('.timeline-item') as NodeListOf<HTMLElement>;
    expect(items.length).toBe(2);
    expect(items[0].querySelector('h3')?.textContent).toContain('Acme');
    expect(items[0].querySelector('img')?.getAttribute('src'))
      .toBe('https://lh3.googleusercontent.com/d/logo123=w1600');
    expect(items[1].querySelector('.timeline-logo')).toBeNull();
  });

  it('separates a fifth-field logo from multi-line legacy bullets', async () => {
    database.getAboutContent.and.rejectWith(new Error('offline'));
    window.localStorage.setItem('xevenst-about-content-v1', JSON.stringify({
      ...DEFAULT_ABOUT_CONTENT,
      experienceEntries: [
        'May 2024 — Present|Micron Technology, Inc.|Software Development Engineer · Taoyuan, Taiwan|- Built and maintained C#/.NET applications.|https://drive.google.com/file/d/logo789/view?usp=drive_link',
        '- Developed and maintained web applications using AngularJS.',
        '- Worked on backend services, SQL databases and scheduled jobs.',
        'Apr 2023 — Jun 2023|National Dong Hwa University · Taiwan|Teaching Assistant|Assisted students with programming assignments.|https://drive.google.com/file/d/school789/view?usp=drive_link',
      ].join('\n'),
    }));

    const revisit = TestBed.createComponent(AboutComponent);
    revisit.detectChanges();
    await revisit.whenStable();

    const items = revisit.nativeElement.querySelectorAll('.timeline-item') as NodeListOf<HTMLElement>;
    expect(items.length).toBe(2);

    const micronBullets = items[0].querySelectorAll('.bullet-list li') as NodeListOf<HTMLElement>;
    expect(micronBullets.length).toBe(3);
    expect(micronBullets[0].textContent).toContain('Built and maintained C#/.NET applications.');
    expect(micronBullets[2].textContent).toContain('Worked on backend services');
    // The logo URL must not leak into the bullets.
    expect(items[0].textContent).not.toContain('drive.google.com');
    expect(items[0].querySelector('.timeline-logo img')?.getAttribute('src'))
      .toBe('https://lh3.googleusercontent.com/d/logo789=w1600');

    const ndhuBullets = items[1].querySelectorAll('.bullet-list li') as NodeListOf<HTMLElement>;
    expect(ndhuBullets.length).toBe(1);
    expect(items[1].querySelector('.timeline-logo img')?.getAttribute('src'))
      .toBe('https://lh3.googleusercontent.com/d/school789=w1600');
  });

  it('renders the education logo from a Google Drive link', async () => {
    database.getAboutContent.and.rejectWith(new Error('offline'));
    window.localStorage.setItem('xevenst-about-content-v1', JSON.stringify({
      ...DEFAULT_ABOUT_CONTENT,
      educationLogoUrl: 'https://drive.google.com/file/d/school456/view?usp=drive_link',
    }));

    const revisit = TestBed.createComponent(AboutComponent);
    revisit.detectChanges();
    await revisit.whenStable();

    expect(revisit.nativeElement.querySelector('.education-logo img')?.getAttribute('src'))
      .toBe('https://lh3.googleusercontent.com/d/school456=w1600');
  });

  it('renders structured work experience descriptions as a bulleted list', async () => {
    database.getAboutContent.and.rejectWith(new Error('offline'));
    window.localStorage.setItem('xevenst-about-content-v1', JSON.stringify({
      ...DEFAULT_ABOUT_CONTENT,
      experienceItemsJson: JSON.stringify([
        {
          date: 'May 2024 — Present',
          company: 'Micron Technology, Inc.',
          role: 'Software Development Engineer',
          bullets: ['Built and maintained C#/.NET applications.', 'Developed AngularJS front ends.'],
          logoUrl: '',
        },
      ]),
    }));

    const revisit = TestBed.createComponent(AboutComponent);
    revisit.detectChanges();
    await revisit.whenStable();

    const items = revisit.nativeElement.querySelectorAll('.timeline-item') as NodeListOf<HTMLElement>;
    expect(items.length).toBe(1);
    const bullets = items[0].querySelectorAll('.bullet-list li') as NodeListOf<HTMLElement>;
    expect(bullets.length).toBe(2);
    expect(bullets[0].textContent).toContain('Built and maintained C#/.NET applications.');
    expect(bullets[1].textContent).toContain('Developed AngularJS front ends.');
  });

  it('parses legacy work experience descriptions that wrap across lines', async () => {
    database.getAboutContent.and.rejectWith(new Error('offline'));
    window.localStorage.setItem('xevenst-about-content-v1', JSON.stringify({
      ...DEFAULT_ABOUT_CONTENT,
      experienceEntries: 'May 2024 — Present|Micron|Engineer|- Built apps.\n- Maintained APIs.\nApr 2023 — Jun 2023|NDHU|Teaching Assistant|Assisted students.',
    }));

    const revisit = TestBed.createComponent(AboutComponent);
    revisit.detectChanges();
    await revisit.whenStable();

    const items = revisit.nativeElement.querySelectorAll('.timeline-item') as NodeListOf<HTMLElement>;
    expect(items.length).toBe(2);
    const firstBullets = items[0].querySelectorAll('.bullet-list li') as NodeListOf<HTMLElement>;
    expect(firstBullets.length).toBe(2);
    expect(firstBullets[0].textContent).toContain('Built apps.');
    expect(firstBullets[1].textContent).toContain('Maintained APIs.');
    const secondBullets = items[1].querySelectorAll('.bullet-list li') as NodeListOf<HTMLElement>;
    expect(secondBullets.length).toBe(1);
    expect(secondBullets[0].textContent).toContain('Assisted students.');
  });

  it('renders each hobby as a separate expandable entry', async () => {
    const content = {
      ...DEFAULT_ABOUT_CONTENT,
      hobbyEntries: 'Trail running|Exploring new routes.|https://drive.google.com/file/d/abc123/view\nPhotography|Capturing everyday details.',
    };
    database.getAboutContent.and.rejectWith(new Error('offline'));
    window.localStorage.setItem('xevenst-about-content-v1', JSON.stringify(content));
    const revisit = TestBed.createComponent(AboutComponent);
    revisit.detectChanges();
    await revisit.whenStable();

    const entries = revisit.nativeElement.querySelectorAll('.about-hobby-item') as NodeListOf<HTMLDetailsElement>;
    expect(entries.length).toBe(2);
    expect(entries[0].open).toBeFalse();
    expect(entries[0].querySelector('summary')?.textContent).toContain('Trail running');
    expect(entries[0].querySelector('img')?.getAttribute('src'))
      .toBe('https://lh3.googleusercontent.com/d/abc123=w1600');
    expect(entries[1].querySelector('img')).toBeNull();
  });
});
