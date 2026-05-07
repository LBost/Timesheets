import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';

import { ToastService } from '../../../core/feedback/toast.service';
import { SettingsStore } from '../state/settings.store';
import { SettingsPage } from './settings.page';
import { SETTINGS_BACKUP_FORMAT_VERSION } from '../models/settings-backup.model';

describe('SettingsPage', () => {
  function createStoreMock() {
    return {
      nextInvoiceNumber: signal('INV-20260001'),
      preferredTimeEntriesView: signal<'month' | 'week'>('month'),
      isLoading: signal(false),
      isSaving: signal(false),
      isBackingUp: signal(false),
      isRestoring: signal(false),
      hasLoaded: signal(true),
      error: signal<string | null>(null),
      loadSettings: vi.fn().mockResolvedValue(undefined),
      saveSettings: vi.fn().mockResolvedValue(true),
      createBackup: vi.fn().mockResolvedValue({
        meta: {
          formatVersion: SETTINGS_BACKUP_FORMAT_VERSION,
          exportedAt: '2026-05-07T00:00:00.000Z',
          app: 'timesheets',
          scope: 'current-user',
        },
        data: {
          settings: null,
          clients: [],
          projects: [],
          orders: [],
          time_entries: [],
          tax_rates: [],
          invoices: [],
          invoice_line_items: [],
        },
      }),
      restoreBackup: vi.fn().mockResolvedValue(true),
    };
  }

  it('creates component', async () => {
    const storeMock = createStoreMock();
    const toastMock = { show: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [SettingsPage],
      providers: [
        { provide: SettingsStore, useValue: storeMock },
        { provide: ToastService, useValue: toastMock },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(SettingsPage);
    fixture.detectChanges();

    expect(fixture.componentInstance).toBeTruthy();
  });

  it('creates backup and shows success toast', async () => {
    const storeMock = createStoreMock();
    const toastMock = { show: vi.fn() };
    const createUrlSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test');
    const revokeUrlSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);

    await TestBed.configureTestingModule({
      imports: [SettingsPage],
      providers: [
        { provide: SettingsStore, useValue: storeMock },
        { provide: ToastService, useValue: toastMock },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(SettingsPage);
    fixture.detectChanges();

    await (fixture.componentInstance as any).createBackupFile();

    expect(storeMock.createBackup).toHaveBeenCalled();
    expect(toastMock.show).toHaveBeenCalledWith('Backup downloaded.', 'success');

    createUrlSpy.mockRestore();
    revokeUrlSpy.mockRestore();
    clickSpy.mockRestore();
  });

  it('shows backup summary before restore confirmation', async () => {
    const storeMock = createStoreMock();
    const toastMock = { show: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [SettingsPage],
      providers: [
        { provide: SettingsStore, useValue: storeMock },
        { provide: ToastService, useValue: toastMock },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(SettingsPage);
    fixture.detectChanges();
    const component = fixture.componentInstance as any;

    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);
    const payload = {
      meta: {
        formatVersion: SETTINGS_BACKUP_FORMAT_VERSION,
        exportedAt: '2026-05-07T00:00:00.000Z',
        app: 'timesheets',
        scope: 'current-user',
      },
      data: {
        settings: null,
        clients: [],
        projects: [],
        orders: [],
        time_entries: [],
        tax_rates: [],
        invoices: [],
        invoice_line_items: [],
      },
    };

    const confirmed = component.confirmRestore(payload);

    expect(confirmSpy).toHaveBeenCalled();
    expect(confirmSpy.mock.calls[0][0]).toContain('Backup preview:');
    expect(confirmSpy.mock.calls[0][0]).toContain('- Clients: 0');
    expect(confirmSpy.mock.calls[0][0]).toContain('- Projects: 0');
    expect(confirmed).toBe(false);
    expect(storeMock.restoreBackup).not.toHaveBeenCalled();
  });
});
