import { Component, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-sidenav',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './sidenav.html',
  styleUrl: './sidenav.scss',
})
export class SidenavComponent {
  isOpen = false;

  @ViewChild('sidenavPanel', { static: false }) sidenavPanel!: ElementRef;

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
}
