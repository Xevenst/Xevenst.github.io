import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PORTFOLIO_PROJECTS } from '../data/portfolio.data';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './about.html',
  styleUrl: './about.scss',
})
export class AboutComponent {
  readonly featuredProjects = PORTFOLIO_PROJECTS;
  readonly highlights = [
    { value: '03', label: 'Featured builds' },
    { value: '2024', label: 'Started at Micron' },
    { value: '04', label: 'Languages spoken' },
  ];

  get age(): number {
    const today = new Date();
    const birthDate = new Date(2001, 0, 20);
    let age = today.getFullYear() - birthDate.getFullYear();
    if (today.getMonth() < birthDate.getMonth() || (today.getMonth() === birthDate.getMonth() && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  }
}
