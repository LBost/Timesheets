import { toClientInsertValues, toClientUpdateValues, toClientVM } from './client.mapper';

describe('client.mapper', () => {
  it('normalizes optional fields on create', () => {
    expect(
      toClientInsertValues({
        name: '  ACME  ',
        email: '   ',
        phone: ' +49123 ',
      })
    ).toEqual({
      name: 'ACME',
      email: null,
      phone: '+49123',
      accentColor: null,
      isActive: true,
    });
  });

  it('normalizes accent color hex on create', () => {
    expect(
      toClientInsertValues({
        name: 'ACME',
        accentColor: '  #FF00AB ',
      }),
    ).toEqual(
      expect.objectContaining({
        accentColor: '#ff00ab',
      }),
    );
  });

  it('builds partial update payload without overwriting missing fields', () => {
    expect(toClientUpdateValues({ phone: '  ' })).toEqual({ phone: null });
    expect(toClientUpdateValues({})).toEqual({});
  });

  it('maps to client VM with project count', () => {
    const vm = toClientVM(
      {
        id: 1,
        name: 'Acme',
        email: null,
        phone: null,
        accentColor: null,
        isActive: true,
        createdAt: new Date('2026-01-01'),
      },
      3
    );

    expect(vm.projectCount).toBe(3);
    expect(vm.name).toBe('Acme');
  });
});
