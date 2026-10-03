import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ThemeService } from '../../services/theme.service';
import { SidenavComponent } from "../sidenav/sidenav";
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, CommonModule, SidenavComponent],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss'
})
export class NavbarComponent {
  readonly theme$;
  readonly user$;
  readonly isAdmin$;

  constructor(private themeService: ThemeService, private authService: AuthService) {
    this.theme$ = this.themeService.theme$;
    this.user$ = this.authService.user$;
    this.isAdmin$ = this.authService.isAdmin$;
  }

  toggleTheme() {
    this.themeService.toggleTheme();
  }
}
