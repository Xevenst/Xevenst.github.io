import { Component, OnDestroy, OnInit, Renderer2 } from '@angular/core';
import { IonButton, IonContent } from '@ionic/angular/standalone';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-homepage',
  standalone: true,
  imports: [IonButton, IonContent, RouterLink, RouterLinkActive],
  templateUrl: './homepage.html',
  styleUrl: './homepage.scss',
})
export class HomepageComponent implements OnInit, OnDestroy {
  private bodyClass = 'homepage-active';

  constructor(private renderer: Renderer2) { }

  ngOnInit() {
    this.renderer.addClass(document.body, this.bodyClass);
  }

  ngOnDestroy() {
    this.renderer.removeClass(document.body, this.bodyClass);
  }
}
