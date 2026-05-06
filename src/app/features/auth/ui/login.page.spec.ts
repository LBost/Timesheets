import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { vi } from 'vitest';

import { AuthService } from '../data/auth.service';
import { LoginPage } from './login.page';

describe('LoginPage', () => {
  const authMock = {
    signIn: vi.fn(),
  };
  const routerMock = {
    navigateByUrl: vi.fn(),
  };

  beforeEach(async () => {
    authMock.signIn.mockReset();
    routerMock.navigateByUrl.mockReset();
    routerMock.navigateByUrl.mockResolvedValue(true);

    await TestBed.configureTestingModule({
      imports: [LoginPage],
      providers: [
        { provide: AuthService, useValue: authMock },
        { provide: Router, useValue: routerMock },
      ],
    }).compileComponents();
  });

  it('creates the page', () => {
    const fixture = TestBed.createComponent(LoginPage);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('signs in and navigates home on success', async () => {
    authMock.signIn.mockResolvedValue(undefined);
    const fixture = TestBed.createComponent(LoginPage);
    fixture.detectChanges();

    const component = fixture.componentInstance as LoginPage & {
      submit: () => Promise<void>;
      loginForm: { setValue: (value: { email: string; password: string }) => void };
    };

    component.loginForm.setValue({ email: 'a@b.com', password: 'secret123' });
    await component.submit();

    expect(authMock.signIn).toHaveBeenCalledWith('a@b.com', 'secret123');
    expect(routerMock.navigateByUrl).toHaveBeenCalledWith('/');
  });

  it('surfaces sign-in errors', async () => {
    authMock.signIn.mockRejectedValue(new Error('Incorrect email or password.'));
    const fixture = TestBed.createComponent(LoginPage);
    fixture.detectChanges();

    const component = fixture.componentInstance as LoginPage & {
      submit: () => Promise<void>;
      errorMessage: () => string | null;
      loginForm: { setValue: (value: { email: string; password: string }) => void };
    };

    component.loginForm.setValue({ email: 'a@b.com', password: 'wrongpw' });
    await component.submit();

    expect(component.errorMessage()).toContain('Incorrect');
    expect(routerMock.navigateByUrl).not.toHaveBeenCalled();
  });
});
