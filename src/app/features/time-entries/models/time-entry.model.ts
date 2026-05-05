export interface TimeEntryModel {
  id: number;
  clientId: number;
  projectId: number;
  orderId: number | null;
  date: string;
  hours: number;
  description: string;
  createdAt: Date;
}

export interface TimeEntryCreateInput {
  clientId: number;
  projectId: number;
  orderId?: number | null;
  date: string;
  hours: number;
  description?: string;
}

export interface TimeEntryUpdateInput {
  clientId?: number;
  projectId?: number;
  orderId?: number | null;
  date?: string;
  hours?: number;
  description?: string;
}
