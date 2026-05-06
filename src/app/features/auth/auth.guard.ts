import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';

import { AuthService } from './data/auth.service';

export const authGuard: CanActivateFn = async (): Promise<boolean | UrlTree> => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isReady()) {
    await waitUntilReady(auth);
  }

  return auth.isAuthenticated() ? true : router.createUrlTree(['/login']);
};

export const guestGuard: CanActivateFn = async (): Promise<boolean | UrlTree> => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isReady()) {
    await waitUntilReady(auth);
  }

  return auth.isAuthenticated() ? router.createUrlTree(['/']) : true;
};

function waitUntilReady(auth: AuthService): Promise<void> {
  return new Promise((resolve) => {
    const intervalMs = 25;
    const timer = setInterval(() => {
      if (auth.isReady()) {
        clearInterval(timer);
        resolve();
      }
    }, intervalMs);
  });
}
