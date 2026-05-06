import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { App } from './app';
import { routes } from './app.routes';
import { SUPABASE_CLIENT } from './core/supabase/supabase.client';
import { createFakeSupabase } from '../testing/supabase-client.fake';
import { AuthService } from './features/auth/data/auth.service';

describe('App', () => {
  const authStub: Partial<AuthService> = {
    isReady: () => true,
    isAuthenticated: () => true,
    currentUserEmail: () => null,
    session: () => null,
    signOut: async () => undefined,
  } as unknown as AuthService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter(routes),
        { provide: SUPABASE_CLIENT, useValue: createFakeSupabase() },
        { provide: AuthService, useValue: authStub },
      ]
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render the app shell brand', async () => {
    const fixture = TestBed.createComponent(App);
    const router = TestBed.inject(Router);
    await router.navigateByUrl('/');
    fixture.detectChanges();
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Timesheets');
  });
});
