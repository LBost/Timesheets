import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';

import { ProjectsRepository } from '../data/projects.repository';
import { ProjectsStore } from './projects.store';

describe('ProjectsStore', () => {
  const repositoryMock = {
    listProjects: vi.fn(),
    createProject: vi.fn(),
    updateProject: vi.fn(),
    archiveProject: vi.fn(),
  };

  beforeEach(() => {
    repositoryMock.listProjects.mockReset();
    repositoryMock.createProject.mockReset();
    repositoryMock.updateProject.mockReset();
    repositoryMock.archiveProject.mockReset();

    TestBed.configureTestingModule({
      providers: [{ provide: ProjectsRepository, useValue: repositoryMock }],
    });
  });

  it('loads projects into state', async () => {
    repositoryMock.listProjects.mockResolvedValue([
      {
        id: 1,
        name: 'Project A',
        code: 'A',
        unitRate: 100,
        unit: 'hours',
        currency: 'EUR',
        billingModel: null,
        useOrders: false,
        clientId: 1,
        isActive: true,
        createdAt: new Date('2026-01-01'),
        clientName: 'Acme',
        timeEntryCount: 0,
      },
    ]);

    const store = TestBed.inject(ProjectsStore);
    await store.loadProjects();

    expect(store.projects().length).toBe(1);
    expect(store.error()).toBeNull();
  });

  it('creates and appends a project', async () => {
    repositoryMock.createProject.mockResolvedValue({
      id: 2,
      name: 'Project B',
      code: 'B',
      unitRate: 120,
      unit: 'hours',
      currency: 'EUR',
      billingModel: null,
      useOrders: false,
      clientId: 1,
      isActive: true,
      createdAt: new Date('2026-01-01'),
      clientName: 'Acme',
      timeEntryCount: 0,
    });

    const store = TestBed.inject(ProjectsStore);
    await store.createProject({
      name: 'Project B',
      code: 'B',
      unitRate: 120,
      clientId: 1,
    });

    expect(store.projects().map((project) => project.name)).toContain('Project B');
    expect(store.selectedProjectId()).toBe(2);
  });

  it('stores error when archive fails', async () => {
    repositoryMock.archiveProject.mockRejectedValue(new Error('Archive failed.'));

    const store = TestBed.inject(ProjectsStore);
    await store.archiveProject(5);

    expect(store.error()).toContain('Archive failed');
  });
});
