import { PortfolioProject } from '../models/portfolio.models';
import { mergeFeaturedProjects } from './github-projects.service';

describe('mergeFeaturedProjects', () => {
  const project = (id: string, githubUrl: string): PortfolioProject => ({
    id,
    title: id,
    year: '2024',
    type: 'Project',
    summary: '',
    details: '',
    technologies: [],
    githubUrl,
    featured: true,
    accent: '#000000',
  });

  it('keeps the curated project and omits its duplicate from GitHub results', () => {
    const curated = project('curated', 'https://github.com/Xevenst/Split-Bill-Mobile-App');
    const duplicate = project('github-copy', 'https://github.com/xevenst/split-bill-mobile-app/');
    const githubOnly = project('github-only', 'https://github.com/Xevenst/New-Project');

    expect(mergeFeaturedProjects([curated], [duplicate, githubOnly]))
      .toEqual([curated, githubOnly]);
  });
});
