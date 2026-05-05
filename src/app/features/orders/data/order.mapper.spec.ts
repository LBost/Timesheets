import { toOrderInsertValues, toOrderUpdateValues, toOrderVM } from './order.mapper';

describe('order.mapper', () => {
  it('normalizes create payload', () => {
    expect(
      toOrderInsertValues({
        code: ' po-1 ',
        title: '  July extra scope ',
        projectId: 3,
      })
    ).toEqual({
      code: 'PO-1',
      title: 'July extra scope',
      projectId: 3,
      isActive: true,
    });
  });

  it('builds partial update payload', () => {
    expect(toOrderUpdateValues({ code: ' a-1 ' })).toEqual({ code: 'A-1' });
    expect(toOrderUpdateValues({})).toEqual({});
  });

  it('maps vm with project fields and count', () => {
    const vm = toOrderVM(
      {
        id: 1,
        code: 'PO-1',
        title: 'Extra scope',
        projectId: 5,
        isActive: true,
        createdAt: new Date('2026-01-01'),
      },
      'PRJ-1',
      'Project One',
      4
    );

    expect(vm.projectCode).toBe('PRJ-1');
    expect(vm.projectName).toBe('Project One');
    expect(vm.timeEntryCount).toBe(4);
  });
});
