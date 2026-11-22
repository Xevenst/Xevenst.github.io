import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
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
  readonly user$;
  readonly isAdmin$;

  constructor(private authService: AuthService) {
    this.user$ = this.authService.user$;
    this.isAdmin$ = this.authService.isAdmin$;
  }
}
