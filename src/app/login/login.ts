import { CommonModule } from '@angular/common';
import { Component, OnDestroy } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class LoginComponent implements OnDestroy {
  readonly user$;
  readonly error$;
  readonly configState$;
  readonly signInForm = new FormGroup({
    email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
    password: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(6)] }),
  });
  readonly createForm = new FormGroup({
    email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
    password: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(6)] }),
  });
  mode: 'sign-in' | 'create' = 'sign-in';
  busy = false;
  localError: string | null = null;
  private readonly destroy$ = new Subject<void>();

  constructor(private readonly auth: AuthService, private readonly router: Router) {
    this.user$ = this.auth.user$;
    this.error$ = this.auth.error$;
    this.configState$ = this.auth.configState$;
    this.user$.pipe(takeUntil(this.destroy$)).subscribe((user) => {
      if (user) void this.router.navigate(['/account']);
    });
  }

  async submit(): Promise<void> {
    const form = this.mode === 'sign-in' ? this.signInForm : this.createForm;
    if (form.invalid) {
      form.markAllAsTouched();
      return;
    }
    this.busy = true;
    this.localError = null;
    try {
      const { email, password } = form.getRawValue();
      if (this.mode === 'sign-in') await this.auth.signIn(email, password);
      else await this.auth.createAccount(email, password);
    } catch (error: unknown) {
      this.localError = error instanceof Error ? error.message : 'Authentication failed.';
    } finally {
      this.busy = false;
    }
  }

  async googleSignIn(): Promise<void> {
    this.busy = true;
    this.localError = null;
    try {
      await this.auth.signInWithGoogle();
    } catch (error: unknown) {
      this.localError = error instanceof Error ? error.message : 'Google sign in failed.';
    } finally {
      this.busy = false;
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
