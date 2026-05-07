import { FormBuilder } from '@angular/forms';
import { TestBed } from '@angular/core/testing';

import { TimeEntrySheetFormComponent } from './time-entry-sheet-form.component';

describe('TimeEntrySheetFormComponent', () => {
  const optionToLabel = (o: { id: number; label: string } | null) => o?.label ?? '';
  const isSameOption = (
    a: { id: number; label: string } | null,
    b: { id: number; label: string } | null,
  ) => a?.id === b?.id;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TimeEntrySheetFormComponent],
    }).compileComponents();
  });

  it('disables the form and shows locked banner when isReadOnly', async () => {
    const fb = new FormBuilder().group({
      clientId: [1],
      projectId: [1],
      orderId: [null as number | null],
      date: ['2026-05-04'],
      hours: [4],
      description: [''],
    });

    const fixture = TestBed.createComponent(TimeEntrySheetFormComponent);
    fixture.componentRef.setInput('form', fb);
    fixture.componentRef.setInput('isEditing', true);
    fixture.componentRef.setInput('isReadOnly', true);
    fixture.componentRef.setInput('lockedByInvoiceId', 99);
    fixture.componentRef.setInput('isLoading', false);
    fixture.componentRef.setInput('isValid', true);
    fixture.componentRef.setInput('clientOptions', [{ id: 1, label: 'C' }]);
    fixture.componentRef.setInput('filteredProjectOptions', [{ id: 1, label: 'P' }]);
    fixture.componentRef.setInput('filteredOrderOptions', []);
    fixture.componentRef.setInput('selectedClientOption', { id: 1, label: 'C' });
    fixture.componentRef.setInput('selectedProjectOption', { id: 1, label: 'P' });
    fixture.componentRef.setInput('selectedOrderOption', null);
    fixture.componentRef.setInput('selectedProjectRequiresOrder', false);
    fixture.componentRef.setInput('optionToLabel', optionToLabel);
    fixture.componentRef.setInput('isSameOption', isSameOption);

    fixture.detectChanges();
    await fixture.whenStable();

    expect(fb.disabled).toBe(true);
    expect(fixture.nativeElement.textContent).toContain('Locked by invoice #99');
    expect(fixture.nativeElement.textContent).toContain('Close');
    expect(fixture.nativeElement.textContent).not.toContain('Save changes');
    expect(fixture.nativeElement.textContent).not.toContain('Delete');
  });
});
