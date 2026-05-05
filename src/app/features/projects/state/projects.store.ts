import { computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { ProjectCreateInput, ProjectUpdateInput } from '../models/project.model';
import { ProjectVM } from '../models/project.vm';
import { ProjectsRepository } from '../data/projects.repository';

type ProjectsState = {
  projects: ProjectVM[];
  selectedProjectId: number | null;
  isLoading: boolean;
  error: string | null;
};

const initialState: ProjectsState = {
  projects: [],
  selectedProjectId: null,
  isLoading: false,
  error: null,
};

export const ProjectsStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed((store) => ({
    selectedProject: computed(
      () => store.projects().find((project) => project.id === store.selectedProjectId()) ?? null
    ),
  })),
  withMethods((store, repository = inject(ProjectsRepository)) => ({
    async loadProjects(): Promise<void> {
      patchState(store, { isLoading: true, error: null });
      try {
        const projects = await repository.listProjects();
        patchState(store, { projects, isLoading: false });
      } catch (error) {
        patchState(store, {
          isLoading: false,
          error: error instanceof Error ? error.message : 'Failed to load projects.',
        });
      }
    },
    selectProject(id: number | null): void {
      patchState(store, { selectedProjectId: id });
    },
    async createProject(input: ProjectCreateInput): Promise<void> {
      patchState(store, { isLoading: true, error: null });
      try {
        const project = await repository.createProject(input);
        patchState(store, (state) => ({
          projects: [...state.projects, project].sort((a, b) => a.name.localeCompare(b.name)),
          selectedProjectId: project.id,
          isLoading: false,
        }));
      } catch (error) {
        patchState(store, {
          isLoading: false,
          error: error instanceof Error ? error.message : 'Failed to create project.',
        });
      }
    },
    async updateProject(id: number, input: ProjectUpdateInput): Promise<void> {
      patchState(store, { isLoading: true, error: null });
      try {
        const updated = await repository.updateProject(id, input);
        if (!updated) {
          patchState(store, { isLoading: false, error: 'Project not found.' });
          return;
        }

        patchState(store, (state) => ({
          projects: state.projects
            .map((project) => (project.id === id ? updated : project))
            .sort((a, b) => a.name.localeCompare(b.name)),
          isLoading: false,
        }));
      } catch (error) {
        patchState(store, {
          isLoading: false,
          error: error instanceof Error ? error.message : 'Failed to update project.',
        });
      }
    },
    async archiveProject(id: number): Promise<void> {
      patchState(store, { isLoading: true, error: null });
      try {
        const archived = await repository.archiveProject(id);
        if (!archived) {
          patchState(store, { isLoading: false, error: 'Project not found.' });
          return;
        }

        patchState(store, (state) => ({
          projects: state.projects.map((project) => (project.id === id ? archived : project)),
          isLoading: false,
        }));
      } catch (error) {
        patchState(store, {
          isLoading: false,
          error: error instanceof Error ? error.message : 'Failed to archive project.',
        });
      }
    },
    async deleteProject(id: number): Promise<'deleted' | 'archived' | null> {
      patchState(store, { isLoading: true, error: null });
      try {
        const result = await repository.deleteProject(id);
        if (result.mode === 'archived' && !result.project) {
          patchState(store, { isLoading: false, error: 'Project not found.' });
          return null;
        }
        patchState(store, (state) => ({
          projects:
            result.mode === 'deleted'
              ? state.projects.filter((project) => project.id !== id)
              : state.projects.map((project) => (project.id === id ? result.project ?? project : project)),
          selectedProjectId: state.selectedProjectId === id ? null : state.selectedProjectId,
          isLoading: false,
        }));
        return result.mode;
      } catch (error) {
        patchState(store, {
          isLoading: false,
          error: error instanceof Error ? error.message : 'Failed to delete project.',
        });
        return null;
      }
    },
  }))
);
