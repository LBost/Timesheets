import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { FeatureHeaderActionsComponent } from './feature-header-actions.component';

describe('FeatureHeaderActionsComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FeatureHeaderActionsComponent],
    }).compileComponents();
  });

  it('renders title and subtitle', () => {
    const fixture = TestBed.createComponent(FeatureHeaderActionsComponent);
    fixture.componentRef.setInput('title', 'Projects');
    fixture.componentRef.setInput('subtitle', 'Manage projects');
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Projects');
    expect(text).toContain('Manage projects');
  });

  it('emits addRequested when icon button is clicked', () => {
    const fixture = TestBed.createComponent(FeatureHeaderActionsComponent);
    fixture.componentRef.setInput('title', 'Clients');
    fixture.componentRef.setInput('subtitle', 'Manage clients');
    fixture.detectChanges();

    const emitSpy = vi.spyOn(fixture.componentInstance.addRequested, 'emit');
    const button = fixture.nativeElement.querySelector('[aria-label="Add"]') as HTMLButtonElement;
    button.click();

    expect(emitSpy).toHaveBeenCalledTimes(1);
  });

  it('emits refreshRequested when refresh button is clicked', () => {
    const fixture = TestBed.createComponent(FeatureHeaderActionsComponent);
    fixture.componentRef.setInput('title', 'Clients');
    fixture.componentRef.setInput('subtitle', 'Manage clients');
    fixture.componentRef.setInput('showRefresh', true);
    fixture.detectChanges();

    const emitSpy = vi.spyOn(fixture.componentInstance.refreshRequested, 'emit');
    const button = fixture.nativeElement.querySelector('[aria-label="Refresh"]') as HTMLButtonElement;
    button.click();

    expect(emitSpy).toHaveBeenCalledTimes(1);
  });
});
