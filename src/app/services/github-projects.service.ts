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
  fork: boolean;
}

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

    return repositories
      .filter((repository) => !repository.fork)
      .map((repository, index) => ({
        id: `github-${repository.name.toLowerCase()}`,
        title: repository.name.replace(/[-_]/g, ' '),
        year: repository.created_at.slice(0, 4),
        type: repository.language ?? 'GitHub project',
        summary: repository.description ?? `A public ${repository.language ?? 'software'} project on GitHub.`,
        details: repository.description ?? `Explore the source code and project details in the public GitHub repository.`,
        technologies: repository.language ? [repository.language] : [],
        githubUrl: repository.html_url,
        featured: true,
        accent: this.colors[index % this.colors.length],
      }));
  }
}

export function mergeFeaturedProjects(
  curatedProjects: PortfolioProject[],
  githubProjects: PortfolioProject[],
): PortfolioProject[] {
  const projects: PortfolioProject[] = [];
  const seenRepositories = new Set<string>();

  for (const project of [...curatedProjects, ...githubProjects]) {
    const repository = normalizeRepositoryUrl(project.githubUrl);
    if (repository && seenRepositories.has(repository)) continue;
    if (repository) seenRepositories.add(repository);
    projects.push(project);
  }

  return projects;
}

function normalizeRepositoryUrl(value: string): string {
  try {
    const url = new URL(value);
    if (url.hostname.toLowerCase() !== 'github.com') return '';
    return `${url.hostname.toLowerCase()}${url.pathname.replace(/\.git\/?$/, '').replace(/\/+$/, '').toLowerCase()}`;
  } catch {
    return '';
  }
}
