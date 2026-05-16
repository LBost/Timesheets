import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { SettingsShellPage } from './settings-shell.page';

describe('SettingsShellPage', () => {
  it('creates component', async () => {
    await TestBed.configureTestingModule({
      imports: [SettingsShellPage],
      providers: [provideRouter([])],
    }).compileComponents();

    const fixture = TestBed.createComponent(SettingsShellPage);
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
  });
});
