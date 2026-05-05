import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { RowContextMenuComponent } from './row-context-menu.component';

describe('RowContextMenuComponent', () => {
  beforeEach(async () => {
    TestBed.overrideComponent(RowContextMenuComponent, {
      set: {
        imports: [],
        template: `
          <button id="edit" (click)="editRequested.emit(entityId())"></button>
          <button id="delete" (click)="deleteRequested.emit(entityId())"></button>
          <button id="archive" (click)="archiveRequested.emit(entityId())"></button>
        `,
      },
    });

    await TestBed.configureTestingModule({
      imports: [RowContextMenuComponent],
    }).compileComponents();
  });

  it('emits edit/delete/archive with entity id', () => {
    const fixture = TestBed.createComponent(RowContextMenuComponent);
    fixture.componentRef.setInput('entityId', 42);
    fixture.detectChanges();

    const editSpy = vi.spyOn(fixture.componentInstance.editRequested, 'emit');
    const deleteSpy = vi.spyOn(fixture.componentInstance.deleteRequested, 'emit');
    const archiveSpy = vi.spyOn(fixture.componentInstance.archiveRequested, 'emit');

    (fixture.nativeElement.querySelector('#edit') as HTMLButtonElement).click();
    (fixture.nativeElement.querySelector('#delete') as HTMLButtonElement).click();
    (fixture.nativeElement.querySelector('#archive') as HTMLButtonElement).click();

    expect(editSpy).toHaveBeenCalledWith(42);
    expect(deleteSpy).toHaveBeenCalledWith(42);
    expect(archiveSpy).toHaveBeenCalledWith(42);
  });
});
