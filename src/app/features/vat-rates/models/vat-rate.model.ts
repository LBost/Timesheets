export interface VatRateModel {
  id: number;
  code: string;
  label: string;
  percentage: number;
  isActive: boolean;
  createdAt: Date;
}

export interface VatRateCreateInput {
  code: string;
  label: string;
  percentage: number;
  isActive?: boolean;
}

export interface VatRateUpdateInput {
  code?: string;
  label?: string;
  percentage?: number;
  isActive?: boolean;
}
