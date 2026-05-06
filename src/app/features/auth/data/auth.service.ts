import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { Session } from '@supabase/supabase-js';

import { SUPABASE_CLIENT } from '../../../core/supabase/supabase.client';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly supabase = inject(SUPABASE_CLIENT);

  private readonly _session = signal<Session | null>(null);
  private readonly _isReady = signal(false);

  readonly session = this._session.asReadonly();
  readonly isReady = this._isReady.asReadonly();
  readonly isAuthenticated = computed(() => this._session() !== null);
  readonly currentUserEmail = computed(() => this._session()?.user.email ?? null);

  constructor() {
    void this.bootstrapSession();
    this.supabase.auth.onAuthStateChange((_event, session) => {
      this._session.set(session);
    });

    // Mark authenticated state for downstream effects.
    effect(() => {
      void this._session();
    });
  }

  async signIn(email: string, password: string): Promise<void> {
    const { error } = await this.supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error) {
      throw new Error(this.translateAuthError(error.message));
    }
  }

  async signOut(): Promise<void> {
    const { error } = await this.supabase.auth.signOut();
    if (error) {
      throw new Error(error.message);
    }
  }

  private async bootstrapSession(): Promise<void> {
    const { data } = await this.supabase.auth.getSession();
    this._session.set(data.session);
    this._isReady.set(true);
  }

  private translateAuthError(message: string): string {
    if (/invalid login credentials/i.test(message)) {
      return 'Incorrect email or password.';
    }
    if (/email not confirmed/i.test(message)) {
      return 'Email not confirmed. Check your inbox or disable confirmations in Supabase.';
    }
    return message;
  }
}
