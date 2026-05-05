import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';

import { ProjectsPage } from './projects.page';
import { ProjectsStore } from '../state/projects.store';
import { ClientsRepository } from '../../clients/data/clients.repository';

describe('ProjectsPage', () => {
  const projectsStoreMock = {
    projects: vi.fn(),
    selectedProjectId: vi.fn(),
    isLoading: vi.fn(),
    error: vi.fn(),
    loadProjects: vi.fn(),
    createProject: vi.fn(),
    updateProject: vi.fn(),
    archiveProject: vi.fn(),
  };
  const clientsRepositoryMock = {
    listClients: vi.fn(),
  };

  beforeEach(async () => {
    projectsStoreMock.projects.mockReturnValue([]);
    projectsStoreMock.selectedProjectId.mockReturnValue(null);
    projectsStoreMock.isLoading.mockReturnValue(false);
    projectsStoreMock.error.mockReturnValue(null);
    projectsStoreMock.loadProjects.mockResolvedValue(undefined);
    projectsStoreMock.createProject.mockResolvedValue(undefined);
    projectsStoreMock.updateProject.mockResolvedValue(undefined);
    projectsStoreMock.archiveProject.mockResolvedValue(undefined);
    clientsRepositoryMock.listClients.mockResolvedValue([]);

    await TestBed.configureTestingModule({
      imports: [ProjectsPage],
      providers: [
        { provide: ProjectsStore, useValue: projectsStoreMock },
        { provide: ClientsRepository, useValue: clientsRepositoryMock },
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
    expect(clientsRepositoryMock.listClients).toHaveBeenCalled();
    expect(projectsStoreMock.loadProjects).toHaveBeenCalled();
  });
});
