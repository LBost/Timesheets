import { OrderModel } from './order.model';

export interface OrderVM extends OrderModel {
  projectCode: string;
  projectName: string;
  timeEntryCount: number;
}
