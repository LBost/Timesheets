export interface ClientModel {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  /** Hex color e.g. `#6366f1`, or null for palette fallback in UI. */
  accentColor: string | null;
  isActive: boolean;
  createdAt: Date;
}

export interface ClientCreateInput {
  name: string;
  email?: string | null;
  phone?: string | null;
  accentColor?: string | null;
  isActive?: boolean;
}

export interface ClientUpdateInput {
  name?: string;
  email?: string | null;
  phone?: string | null;
  accentColor?: string | null;
  isActive?: boolean;
}
