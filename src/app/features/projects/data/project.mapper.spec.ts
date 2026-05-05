import { BillingModel } from '../models/project.model';
import { toProjectInsertValues, toProjectUpdateValues, toProjectVM } from './project.mapper';

describe('project.mapper', () => {
  it('normalizes create values', () => {
    expect(
      toProjectInsertValues({
        name: '  Website redesign ',
        code: ' wr-1 ',
        unitRate: 120,
        clientId: 3,
      })
    ).toEqual({
      name: 'Website redesign',
      code: 'WR-1',
      unitRate: 120,
      unit: 'hours',
      currency: 'EUR',
      billingModel: null,
      useOrders: false,
      clientId: 3,
      isActive: true,
    });
  });

  it('builds partial update payload', () => {
    expect(toProjectUpdateValues({ code: ' abc ', billingModel: BillingModel.MONTHLY })).toEqual({
      code: 'ABC',
      billingModel: BillingModel.MONTHLY,
    });
    expect(toProjectUpdateValues({})).toEqual({});
  });

  it('maps vm with derived fields', () => {
    const vm = toProjectVM(
      {
        id: 1,
        name: 'Project A',
        code: 'A',
        unitRate: 100,
        unit: 'hours',
        currency: 'EUR',
        billingModel: null,
        useOrders: false,
        clientId: 1,
        isActive: true,
        createdAt: new Date('2026-01-01'),
      },
      'Acme',
      5
    );

    expect(vm.clientName).toBe('Acme');
    expect(vm.timeEntryCount).toBe(5);
  });
});
