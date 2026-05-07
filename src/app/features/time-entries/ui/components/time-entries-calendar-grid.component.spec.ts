import { TestBed } from '@angular/core/testing';

import {
  TimeEntriesCalendarGridComponent,
  type EntryInvoicedSummaryState,
} from './time-entries-calendar-grid.component';

describe('TimeEntriesCalendarGridComponent', () => {
  const weekdayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const vmBase = {
    clientId: 1,
    projectId: 1,
    orderId: null as number | null,
    hours: 4,
    description: '',
    lockedAt: null as Date | null,
    createdAt: new Date(),
    clientName: 'Client',
    clientAccentColor: null as string | null,
    projectCode: 'PRJ',
    projectName: 'Project',
    orderCode: null as string | null,
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TimeEntriesCalendarGridComponent],
    }).compileComponents();
  });

  it('shows green accent for a single locked entry', () => {
    const fixture = TestBed.createComponent(TimeEntriesCalendarGridComponent);
    const day = { date: '2026-05-04' as string | null, dayNumber: 4, inCurrentMonth: true };
    const entry = { ...vmBase, id: 1, date: '2026-05-04', lockedByInvoiceId: 42 };

    fixture.componentRef.setInput('weekdayLabels', weekdayLabels);
    fixture.componentRef.setInput('calendarDays', [day]);
    fixture.componentRef.setInput('entriesForDate', (d: string) => (d === '2026-05-04' ? [entry] : []));
    fixture.componentRef.setInput('dayTotal', (d: string) => (d === '2026-05-04' ? 4 : 0));
    fixture.componentRef.setInput('entryClientAccent', () => '#ff0000');
    fixture.componentRef.setInput('entryAccentsForDate', () => []);
    fixture.componentRef.setInput('entryInvoicedSummary', () =>
      ({ state: 'all', invoiced: 1, total: 1 }) satisfies EntryInvoicedSummaryState,
    );
    fixture.componentRef.setInput('formatDayHeading', (iso: string) => iso);

    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[data-testid="invoiced-accent"]')).toBeTruthy();
  });

  it('does not show green accent when entry is not locked', () => {
    const fixture = TestBed.createComponent(TimeEntriesCalendarGridComponent);
    const day = { date: '2026-05-04' as string | null, dayNumber: 4, inCurrentMonth: true };
    const entry = { ...vmBase, id: 1, date: '2026-05-04', lockedByInvoiceId: null };

    fixture.componentRef.setInput('weekdayLabels', weekdayLabels);
    fixture.componentRef.setInput('calendarDays', [day]);
    fixture.componentRef.setInput('entriesForDate', (d: string) => (d === '2026-05-04' ? [entry] : []));
    fixture.componentRef.setInput('dayTotal', (d: string) => (d === '2026-05-04' ? 4 : 0));
    fixture.componentRef.setInput('entryClientAccent', () => '#ff0000');
    fixture.componentRef.setInput('entryAccentsForDate', () => []);
    fixture.componentRef.setInput('entryInvoicedSummary', () =>
      ({ state: 'none', invoiced: 0, total: 1 }) satisfies EntryInvoicedSummaryState,
    );
    fixture.componentRef.setInput('formatDayHeading', (iso: string) => iso);

    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[data-testid="invoiced-accent"]')).toBeFalsy();
  });

  it('shows stacked aria-label with invoiced counts when partially invoiced', () => {
    const fixture = TestBed.createComponent(TimeEntriesCalendarGridComponent);
    const day = { date: '2026-05-05' as string | null, dayNumber: 5, inCurrentMonth: true };
    const entries = [
      { ...vmBase, id: 1, date: '2026-05-05', lockedByInvoiceId: 1 },
      { ...vmBase, id: 2, date: '2026-05-05', lockedByInvoiceId: null },
    ];

    fixture.componentRef.setInput('weekdayLabels', weekdayLabels);
    fixture.componentRef.setInput('calendarDays', [day]);
    fixture.componentRef.setInput('entriesForDate', (d: string) => (d === '2026-05-05' ? entries : []));
    fixture.componentRef.setInput('dayTotal', (d: string) => (d === '2026-05-05' ? 8 : 0));
    fixture.componentRef.setInput('entryClientAccent', () => '#ff0000');
    fixture.componentRef.setInput('entryAccentsForDate', () => [{ key: 'a', hex: '#fff', label: 'C' }]);
    fixture.componentRef.setInput('entryInvoicedSummary', () =>
      ({ state: 'partial', invoiced: 1, total: 2 }) satisfies EntryInvoicedSummaryState,
    );
    fixture.componentRef.setInput('formatDayHeading', () => 'Tuesday');

    fixture.detectChanges();

    const stacked = fixture.nativeElement.querySelector('button[aria-label]') as HTMLButtonElement | null;
    expect(stacked?.getAttribute('aria-label')).toContain('1 of 2 invoiced');
    expect(fixture.nativeElement.querySelector('[data-testid="invoiced-accent-stacked"]')).toBeTruthy();
    expect(
      fixture.nativeElement.querySelector('[data-testid="invoiced-accent-stacked-partial"]'),
    ).toBeTruthy();
  });

  it('does not add invoiced phrase to stacked aria-label when none invoiced', () => {
    const fixture = TestBed.createComponent(TimeEntriesCalendarGridComponent);
    const day = { date: '2026-05-06' as string | null, dayNumber: 6, inCurrentMonth: true };
    const entries = [
      { ...vmBase, id: 1, date: '2026-05-06', lockedByInvoiceId: null },
      { ...vmBase, id: 2, date: '2026-05-06', lockedByInvoiceId: null },
    ];

    fixture.componentRef.setInput('weekdayLabels', weekdayLabels);
    fixture.componentRef.setInput('calendarDays', [day]);
    fixture.componentRef.setInput('entriesForDate', (d: string) => (d === '2026-05-06' ? entries : []));
    fixture.componentRef.setInput('dayTotal', () => 8);
    fixture.componentRef.setInput('entryClientAccent', () => '#ff0000');
    fixture.componentRef.setInput('entryAccentsForDate', () => []);
    fixture.componentRef.setInput('entryInvoicedSummary', () =>
      ({ state: 'none', invoiced: 0, total: 2 }) satisfies EntryInvoicedSummaryState,
    );
    fixture.componentRef.setInput('formatDayHeading', () => 'Wednesday');

    fixture.detectChanges();

    const stacked = fixture.nativeElement.querySelector('button[aria-label]') as HTMLButtonElement | null;
    expect(stacked?.getAttribute('aria-label')).not.toContain('invoiced');
    expect(fixture.nativeElement.querySelector('[data-testid="invoiced-accent-stacked"]')).toBeFalsy();
  });
});
