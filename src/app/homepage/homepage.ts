import { Component } from '@angular/core';

@Component({
  selector: 'app-homepage',
  standalone: true,
  imports: [],
  templateUrl: './homepage.html',
  styleUrl: './homepage.scss',
})
export class HomepageComponent {
  readonly nameLetters = Array.from('Steven Jonathan').map((character, index) => ({
    character: character === ' ' ? '' : character,
    index,
    isSpace: character === ' ',
  }));
}
