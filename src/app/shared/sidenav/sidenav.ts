import { Component, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { RouterLinkActive } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-sidenav',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './sidenav.html',
  styleUrl: './sidenav.scss',
})
export class SidenavComponent {
  isOpen = false;
  readonly user$;
  readonly isAdmin$;

  @ViewChild('sidenavPanel', { static: false }) sidenavPanel!: ElementRef;

  constructor(private readonly authService: AuthService) {
    this.user$ = authService.user$;
    this.isAdmin$ = authService.isAdmin$;
  }

  openSidenav() {
    this.isOpen = true;
  }

  // keep this public method so the template can call it on mouseleave of the panel
  closeSidenav() {
    this.isOpen = false;
  }

  toggleSidenav() {
    this.isOpen = !this.isOpen;
  }

  closeOnNavigate(): void {
    this.isOpen = false;
  }
}
