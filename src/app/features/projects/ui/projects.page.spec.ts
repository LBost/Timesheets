import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';

import { ProjectsPage } from './projects.page';
import { ProjectsStore } from '../state/projects.store';
import { ClientsStore } from '../../clients/state/clients.store';

describe('ProjectsPage', () => {
  const projectsStoreMock = {
    projects: vi.fn(),
    selectedProjectId: vi.fn(),
    isLoading: vi.fn(),
    error: vi.fn(),
    loadProjects: vi.fn(),
    loadProjectsIfNeeded: vi.fn(),
    createProject: vi.fn(),
    updateProject: vi.fn(),
    archiveProject: vi.fn(),
  };
  const clientsStoreMock = {
    clients: vi.fn(),
    error: vi.fn(),
    loadClients: vi.fn(),
    loadClientsIfNeeded: vi.fn(),
  };

  beforeEach(async () => {
    projectsStoreMock.projects.mockReturnValue([]);
    projectsStoreMock.selectedProjectId.mockReturnValue(null);
    projectsStoreMock.isLoading.mockReturnValue(false);
    projectsStoreMock.error.mockReturnValue(null);
    projectsStoreMock.loadProjects.mockResolvedValue(undefined);
    projectsStoreMock.loadProjectsIfNeeded.mockResolvedValue(undefined);
    projectsStoreMock.createProject.mockResolvedValue(undefined);
    projectsStoreMock.updateProject.mockResolvedValue(undefined);
    projectsStoreMock.archiveProject.mockResolvedValue(undefined);
    clientsStoreMock.clients.mockReturnValue([]);
    clientsStoreMock.error.mockReturnValue(null);
    clientsStoreMock.loadClients.mockResolvedValue(undefined);
    clientsStoreMock.loadClientsIfNeeded.mockResolvedValue(undefined);

    await TestBed.configureTestingModule({
      imports: [ProjectsPage],
      providers: [
        { provide: ProjectsStore, useValue: projectsStoreMock },
        { provide: ClientsStore, useValue: clientsStoreMock },
      ],
    }).compileComponents();
  });

  it('creates the page', () => {
    const fixture = TestBed.createComponent(ProjectsPage);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('loads projects on init', async () => {
    const fixture = TestBed.createComponent(ProjectsPage);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(clientsStoreMock.loadClientsIfNeeded).toHaveBeenCalled();
    expect(projectsStoreMock.loadProjectsIfNeeded).toHaveBeenCalled();
  });
});
