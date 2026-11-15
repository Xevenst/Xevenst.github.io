import { HttpClient } from '@angular/common/http';
import { of } from 'rxjs';
import { PortfolioProject } from '../models/portfolio.models';
import { GitHubProjectsService, selectPinnedPublicProjects } from './github-projects.service';

describe('selectPinnedPublicProjects', () => {
  const project = (name: string): PortfolioProject => ({
    id: `github-${name.toLowerCase()}`,
    title: name,
    year: '2024',
    type: 'Project',
    summary: '',
    details: '',
    technologies: [],
    githubUrl: `https://github.com/Xevenst/${name}`,
    featured: true,
    accent: '#000000',
  });

  it('returns only public pinned repositories in profile order', () => {
    const pinned = [
      project('Split-Bill-Mobile-App'),
      project('Chromesthesia'),
      project('DataScienceProject'),
    ];

    expect(selectPinnedPublicProjects(pinned).map(({ title }) => title))
      .toEqual(['Chromesthesia', 'DataScienceProject', 'Split-Bill-Mobile-App']);
  });
});

describe('GitHubProjectsService', () => {
  it('maps pinned repositories to their bundled preview assets', async () => {
    const http = jasmine.createSpyObj<HttpClient>('HttpClient', ['get']);
    http.get.and.returnValue(of([
      {
        name: 'Chromesthesia',
        html_url: 'https://github.com/Xevenst/Chromesthesia',
        description: null,
        language: 'C#',
        created_at: '2022-01-01T00:00:00Z',
        default_branch: 'main',
      },
      {
        name: 'MovLensDataSet',
        html_url: 'https://github.com/Xevenst/MovLensDataSet',
        description: null,
        language: 'Python',
        created_at: '2022-01-01T00:00:00Z',
        default_branch: 'main',
      },
      {
        name: 'Split-Bill-Mobile-App',
        html_url: 'https://github.com/Xevenst/Split-Bill-Mobile-App',
        description: null,
        language: 'Dart',
        created_at: '2022-01-01T00:00:00Z',
        default_branch: 'main',
      },
    ]));
    const service = new GitHubProjectsService(http);

    const projects = await service.getPublicProjects();

    expect(projects.map(({ imageUrl }) => imageUrl)).toEqual([
      '/assets/project-previews/chromesthesia.png',
      '/assets/project-previews/movlens-dataset.png',
      '/assets/project-previews/split-bill-mobile-app.png',
    ]);
  });
});
