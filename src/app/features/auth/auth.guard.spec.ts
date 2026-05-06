import { TestBed } from '@angular/core/testing';
import { Router, UrlTree } from '@angular/router';
import { vi } from 'vitest';

import { authGuard, guestGuard } from './auth.guard';
import { AuthService } from './data/auth.service';

function fakeAuth(isAuthenticated: boolean): Pick<AuthService, 'isAuthenticated' | 'isReady'> {
  return {
    isAuthenticated: () => isAuthenticated,
    isReady: () => true,
  } as Pick<AuthService, 'isAuthenticated' | 'isReady'>;
}

describe('authGuard', () => {
  const router = {
    createUrlTree: vi.fn().mockReturnValue({} as UrlTree),
  } as unknown as Router;

  beforeEach(() => {
    (router.createUrlTree as ReturnType<typeof vi.fn>).mockClear();
  });

  it('allows navigation when authenticated', async () => {
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: fakeAuth(true) },
        { provide: Router, useValue: router },
      ],
    });

    const result = await TestBed.runInInjectionContext(() => authGuard({} as never, {} as never));
    expect(result).toBe(true);
  });

  it('redirects to /login when not authenticated', async () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: fakeAuth(false) },
        { provide: Router, useValue: router },
      ],
    });

    await TestBed.runInInjectionContext(() => authGuard({} as never, {} as never));
    expect(router.createUrlTree).toHaveBeenCalledWith(['/login']);
  });
});

describe('guestGuard', () => {
  const router = {
    createUrlTree: vi.fn().mockReturnValue({} as UrlTree),
  } as unknown as Router;

  beforeEach(() => {
    (router.createUrlTree as ReturnType<typeof vi.fn>).mockClear();
  });

  it('allows /login when not authenticated', async () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: fakeAuth(false) },
        { provide: Router, useValue: router },
      ],
    });

    const result = await TestBed.runInInjectionContext(() => guestGuard({} as never, {} as never));
    expect(result).toBe(true);
  });

  it('redirects to / when already authenticated', async () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: fakeAuth(true) },
        { provide: Router, useValue: router },
      ],
    });

    await TestBed.runInInjectionContext(() => guestGuard({} as never, {} as never));
    expect(router.createUrlTree).toHaveBeenCalledWith(['/']);
  });
});
