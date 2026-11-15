import { Component } from '@angular/core';
import { ViewportScroller } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './shared/navbar/navbar';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  constructor(viewportScroller: ViewportScroller) {
    viewportScroller.setOffset(() => [
      0,
      typeof window !== 'undefined' && window.innerWidth <= 700 ? 140 : 90,
    ]);
  }
}
