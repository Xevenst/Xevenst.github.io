import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { PortfolioProject } from '../models/portfolio.models';

interface GitHubRepository {
  name: string;
  html_url: string;
  description: string | null;
  language: string | null;
  created_at: string;
}

const PINNED_GITHUB_REPOSITORIES = [
  'Chromesthesia',
  'DataScienceProject',
  'MovLensDataSet',
  'Split-Bill-Mobile-App',
  'Xevenst.github.io',
];

@Injectable({ providedIn: 'root' })
export class GitHubProjectsService {
  private readonly colors = ['#51d8c6', '#6ca8ff', '#b58cff', '#f0a36d', '#ed7fa1'];

  constructor(private readonly http: HttpClient) {}

  async getPublicProjects(): Promise<PortfolioProject[]> {
    const repositories = await firstValueFrom(
      this.http.get<GitHubRepository[]>(
        'https://api.github.com/users/Xevenst/repos?type=owner&sort=updated&per_page=100',
      ),
    );

    return repositories.map((repository, index) => ({
      id: `github-${repository.name.toLowerCase()}`,
      title: repository.name.replace(/[-_]/g, ' '),
      year: repository.created_at.slice(0, 4),
      type: repository.language ?? 'GitHub project',
      summary: repository.description ?? `A public ${repository.language ?? 'software'} project on GitHub.`,
      details: repository.description ?? 'Explore the source code and project details in the public GitHub repository.',
      technologies: repository.language ? [repository.language] : [],
      githubUrl: repository.html_url,
      featured: true,
      accent: this.colors[index % this.colors.length],
    }));
  }
}

export function selectPinnedPublicProjects(projects: PortfolioProject[]): PortfolioProject[] {
  const projectsByRepository = new Map(
    projects.map((project) => [repositoryName(project.githubUrl), project]),
  );
  return PINNED_GITHUB_REPOSITORIES
    .map((repository) => projectsByRepository.get(repository.toLowerCase()))
    .filter((project): project is PortfolioProject => project !== undefined);
}

function repositoryName(value: string): string {
  try {
    const url = new URL(value);
    if (url.hostname.toLowerCase() !== 'github.com') return '';
    return url.pathname.split('/').filter(Boolean).at(-1)?.toLowerCase() ?? '';
  } catch {
    return '';
  }
}
