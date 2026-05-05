import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import {
  Injectable,
  PLATFORM_ID,
  effect,
  inject,
  signal
} from '@angular/core';

export type ThemeMode = 'light' | 'dark' | 'system';

const STORAGE_KEY = 'timesheets.theme';

const THEME_CYCLE: ThemeMode[] = ['light', 'dark', 'system'];

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly document = inject(DOCUMENT);
  private readonly platformId = inject(PLATFORM_ID);

  readonly mode = signal<ThemeMode>(this.readStoredMode());

  constructor() {
    if (isPlatformBrowser(this.platformId) && typeof globalThis.matchMedia === 'function') {
      this.applyResolved();
      globalThis
        .matchMedia('(prefers-color-scheme: dark)')
        .addEventListener('change', () => {
          if (this.mode() === 'system') {
            this.applyResolved();
          }
        });
    }

    effect(() => {
      if (!isPlatformBrowser(this.platformId)) {
        return;
      }
      const current = this.mode();
      localStorage.setItem(STORAGE_KEY, current);
      this.applyResolved();
    });
  }

  setMode(mode: ThemeMode): void {
    this.mode.set(mode);
  }

  /** Single control: advance light → dark → system → light. */
  cycleMode(): void {
    this.mode.set(this.peekNextMode());
  }

  /** Next mode after `cycleMode()` (for labels / previews). */
  peekNextMode(): ThemeMode {
    const current = this.mode();
    const idx = THEME_CYCLE.indexOf(current);
    const safeIdx = idx === -1 ? 0 : idx;
    return THEME_CYCLE[(safeIdx + 1) % THEME_CYCLE.length];
  }

  private readStoredMode(): ThemeMode {
    if (!isPlatformBrowser(this.platformId)) {
      return 'system';
    }
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === 'light' || raw === 'dark' || raw === 'system') {
      return raw;
    }
    return 'system';
  }

  private applyResolved(): void {
    const root = this.document.documentElement;
    root.classList.toggle('dark', this.resolveIsDark());
  }

  private resolveIsDark(): boolean {
    if (!isPlatformBrowser(this.platformId)) {
      return false;
    }
    const current = this.mode();
    if (current === 'dark') {
      return true;
    }
    if (current === 'light') {
      return false;
    }
    if (typeof globalThis.matchMedia !== 'function') {
      return false;
    }
    return globalThis.matchMedia('(prefers-color-scheme: dark)').matches;
  }
}
