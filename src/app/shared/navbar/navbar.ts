import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ThemeService } from '../../services/theme.service';
import { SidenavComponent } from "../sidenav/sidenav";

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, CommonModule, SidenavComponent],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss'
})
export class NavbarComponent {
  public theme$;

  constructor(private themeService: ThemeService) {
    this.theme$ = this.themeService.theme$;
  }

  toggleTheme() {
    this.themeService.toggleTheme();
  }
}
