export enum BillingModel {
  WEEK = 'week',
  MONTH = 'month',
  YEAR = 'year',
}

export interface ProjectModel {
  id: number;
  name: string;
  code: string;
  unitRate: number;
  unit: string;
  currency: string;
  billingModel: BillingModel | null;
  useOrders: boolean;
  clientId: number;
  isActive: boolean;
  createdAt: Date;
}

export interface ProjectCreateInput {
  name: string;
  code: string;
  unitRate: number;
  unit?: string;
  currency?: string;
  billingModel?: BillingModel | null;
  useOrders?: boolean;
  clientId: number;
  isActive?: boolean;
}

export interface ProjectUpdateInput {
  name?: string;
  code?: string;
  unitRate?: number;
  unit?: string;
  currency?: string;
  billingModel?: BillingModel | null;
  useOrders?: boolean;
  clientId?: number;
  isActive?: boolean;
}
