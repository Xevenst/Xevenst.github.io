import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { combineLatest, map } from 'rxjs';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-account',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './account.html',
  styleUrl: './account.scss',
})
export class AccountComponent {
  readonly user$;
  readonly role$;

  constructor(private readonly auth: AuthService) {
    this.user$ = this.auth.user$;
    this.role$ = combineLatest([this.auth.loading$, this.auth.isAdmin$]).pipe(
      map(([loading, isAdmin]) => ({ loading, isAdmin })),
    );
  }

  async signOut(): Promise<void> {
    await this.auth.signOut();
  }
}
