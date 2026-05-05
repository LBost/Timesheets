export interface OrderModel {
  id: number;
  code: string;
  title: string;
  projectId: number;
  isActive: boolean;
  createdAt: Date;
}

export interface OrderCreateInput {
  code: string;
  title: string;
  projectId: number;
  isActive?: boolean;
}

export interface OrderUpdateInput {
  code?: string;
  title?: string;
  projectId?: number;
  isActive?: boolean;
}
