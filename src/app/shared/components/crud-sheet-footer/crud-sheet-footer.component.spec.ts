import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { CrudSheetFooterComponent } from './crud-sheet-footer.component';

describe('CrudSheetFooterComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CrudSheetFooterComponent],
    }).compileComponents();
  });

  it('renders create label by default', () => {
    const fixture = TestBed.createComponent(CrudSheetFooterComponent);
    fixture.componentRef.setInput('createLabel', 'Create client');
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Create client');
  });

  it('renders update label when editing', () => {
    const fixture = TestBed.createComponent(CrudSheetFooterComponent);
    fixture.componentRef.setInput('isEditing', true);
    fixture.componentRef.setInput('updateLabel', 'Save changes');
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Save changes');
  });

  it('emits clear and cancel actions', () => {
    const fixture = TestBed.createComponent(CrudSheetFooterComponent);
    fixture.detectChanges();

    const clearSpy = vi.spyOn(fixture.componentInstance.clearRequested, 'emit');
    const cancelSpy = vi.spyOn(fixture.componentInstance.cancelRequested, 'emit');

    const buttons = fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>;
    buttons[1].click();
    buttons[2].click();

    expect(clearSpy).toHaveBeenCalledTimes(1);
    expect(cancelSpy).toHaveBeenCalledTimes(1);
  });
});
