import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';

import { ClientsPage } from './clients.page';
import { ClientsStore } from '../state/clients.store';

describe('ClientsPage', () => {
  const clientsStoreMock = {
    clients: vi.fn(),
    selectedClientId: vi.fn(),
    isLoading: vi.fn(),
    error: vi.fn(),
    loadClients: vi.fn(),
    loadClientsIfNeeded: vi.fn(),
    createClient: vi.fn(),
    updateClient: vi.fn(),
    archiveClient: vi.fn(),
  };

  beforeEach(async () => {
    clientsStoreMock.clients.mockReturnValue([]);
    clientsStoreMock.selectedClientId.mockReturnValue(null);
    clientsStoreMock.isLoading.mockReturnValue(false);
    clientsStoreMock.error.mockReturnValue(null);
    clientsStoreMock.loadClients.mockResolvedValue(undefined);
    clientsStoreMock.loadClientsIfNeeded.mockResolvedValue(undefined);
    clientsStoreMock.createClient.mockResolvedValue(undefined);
    clientsStoreMock.updateClient.mockResolvedValue(undefined);
    clientsStoreMock.archiveClient.mockResolvedValue(undefined);

    await TestBed.configureTestingModule({
      imports: [ClientsPage],
      providers: [{ provide: ClientsStore, useValue: clientsStoreMock }],
    }).compileComponents();
  });

  it('creates the page', () => {
    const fixture = TestBed.createComponent(ClientsPage);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('loads clients on init', () => {
    const fixture = TestBed.createComponent(ClientsPage);
    fixture.detectChanges();
    expect(clientsStoreMock.loadClientsIfNeeded).toHaveBeenCalled();
  });

  it('submits create action when form is valid', async () => {
    const fixture = TestBed.createComponent(ClientsPage);
    fixture.detectChanges();

    const component = fixture.componentInstance as ClientsPage & {
      submitClient: () => Promise<void>;
      clientForm: {
        setValue: (value: {
          name: string;
          email: string;
          phone: string;
          accentColor: string;
          isActive: boolean;
        }) => void;
      };
    };

    component.clientForm.setValue({
      name: 'Acme',
      email: 'acme@example.com',
      phone: '',
      accentColor: '',
      isActive: true,
    });
    await component.submitClient();

    expect(clientsStoreMock.createClient).toHaveBeenCalled();
  });
});
