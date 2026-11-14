import { PortfolioProject } from '../models/portfolio.models';
import { selectPinnedPublicProjects } from './github-projects.service';

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
