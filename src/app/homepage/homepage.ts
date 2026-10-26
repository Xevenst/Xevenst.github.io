import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PORTFOLIO_PROJECTS } from '../data/portfolio.data';

@Component({
  selector: 'app-homepage',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './homepage.html',
  styleUrl: './homepage.scss',
})
export class HomepageComponent {
  readonly featuredProjects = PORTFOLIO_PROJECTS;
  readonly stats = [
    { value: '03', label: 'Featured builds' },
    { value: '2024', label: 'Started at Micron' },
    { value: '04', label: 'Languages spoken' },
  ];
}
