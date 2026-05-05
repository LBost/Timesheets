import { TimeEntryModel } from './time-entry.model';

export interface TimeEntryVM extends TimeEntryModel {
  clientName: string;
  /** Stored client hex accent, or null (UI resolves fallback by client id). */
  clientAccentColor: string | null;
  projectCode: string;
  projectName: string;
  orderCode: string | null;
}
