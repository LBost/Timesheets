import { toVatRateInsertValues, toVatRateUpdateValues, toVatRateVM } from './vat-rate.mapper';

describe('vat-rate.mapper', () => {
  it('normalizes create payload', () => {
    expect(
      toVatRateInsertValues({
        code: ' vat19 ',
        label: ' VAT 19% ',
        percentage: 1900.9,
      }),
    ).toEqual({
      code: 'VAT19',
      label: 'VAT 19%',
      percentage: 1900,
      isActive: true,
    });
  });

  it('builds partial update payload', () => {
    expect(toVatRateUpdateValues({ code: ' vat7 ', percentage: 700.7 })).toEqual({
      code: 'VAT7',
      percentage: 700,
    });
    expect(toVatRateUpdateValues({})).toEqual({});
  });

  it('maps vm with usage count', () => {
    const vm = toVatRateVM(
      {
        id: 1,
        code: 'VAT19',
        label: 'VAT 19%',
        percentage: 1900,
        isActive: true,
        createdAt: new Date('2026-01-01'),
      },
      4,
    );

    expect(vm.invoiceLineItemCount).toBe(4);
    expect(vm.code).toBe('VAT19');
  });
});
