import { Injectable, signal } from '@angular/core';

export type ToastTone = 'success' | 'info';

export type ToastMessage = {
  text: string;
  tone: ToastTone;
};

@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly _current = signal<ToastMessage | null>(null);
  private dismissTimer: ReturnType<typeof setTimeout> | null = null;

  readonly current = this._current.asReadonly();

  show(text: string, tone: ToastTone = 'info', durationMs = 2600): void {
    this._current.set({ text, tone });
    if (this.dismissTimer) {
      clearTimeout(this.dismissTimer);
    }
    this.dismissTimer = setTimeout(() => this._current.set(null), durationMs);
  }

  dismiss(): void {
    if (this.dismissTimer) {
      clearTimeout(this.dismissTimer);
      this.dismissTimer = null;
    }
    this._current.set(null);
  }
}
