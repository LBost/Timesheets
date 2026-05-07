import {
  toTimeEntryInsertValues,
  toTimeEntryModel,
  toTimeEntryUpdateValues,
  toTimeEntryVM,
} from './time-entry.mapper';

describe('time-entry.mapper', () => {
  it('maps insert values with defaults', () => {
    expect(
      toTimeEntryInsertValues({
        clientId: 1,
        projectId: 2,
        date: '2026-05-12',
        hours: 3.5,
      }),
    ).toEqual({
      clientId: 1,
      projectId: 2,
      orderId: null,
      date: '2026-05-12',
      hours: 3.5,
      description: '',
    });
  });

  it('maps update values selectively', () => {
    expect(toTimeEntryUpdateValues({ description: '  Update  ', hours: 2 })).toEqual({
      description: 'Update',
      hours: 2,
    });
  });

  it('maps model and vm', () => {
    const model = toTimeEntryModel({
      id: 1,
      clientId: 1,
      projectId: 2,
      orderId: null,
      date: '2026-05-01',
      hours: 4,
      description: 'Work',
      lockedByInvoiceId: null,
      lockedAt: null,
      createdAt: new Date('2026-05-01T00:00:00Z'),
    });

    const vm = toTimeEntryVM(
      model,
      'Client A',
      'client@example.com',
      '#6366f1',
      'PRJ',
      'Project',
      null,
      null,
    );
    expect(vm.clientName).toBe('Client A');
    expect(vm.clientEmail).toBe('client@example.com');
    expect(vm.clientAccentColor).toBe('#6366f1');
    expect(vm.projectCode).toBe('PRJ');
    expect(vm.orderName).toBeNull();
  });
});
