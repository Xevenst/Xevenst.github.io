import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { combineLatest, filter, map, take } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return combineLatest([auth.loading$, auth.user$]).pipe(
    filter(([loading]) => !loading),
    take(1),
    map(([, user]) => user ? true : router.createUrlTree(['/login'])),
  );
};
