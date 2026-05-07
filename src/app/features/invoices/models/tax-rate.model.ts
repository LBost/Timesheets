export interface TaxRateModel {
  id: number;
  code: string;
  label: string;
  percentage: number;
  isActive: boolean;
  createdAt: Date;
}

export interface TaxRateCreateInput {
  code: string;
  label: string;
  percentage: number;
}
