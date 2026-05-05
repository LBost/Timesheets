import { ProjectModel } from './project.model';

export interface ProjectVM extends ProjectModel {
  clientName: string;
  timeEntryCount: number;
}
