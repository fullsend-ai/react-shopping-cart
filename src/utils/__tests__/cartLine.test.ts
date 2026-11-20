import { cartInstallment, cartLineDesc, cartSubtotal } from '../cartLine';
import { ICartTotal } from 'models';

describe('[utils] - cartLine', () => {
  describe('cartLineDesc', () => {
    test('should join the first size and the style', () => {
      expect(
        cartLineDesc({ availableSizes: ['S', 'XXL'], style: 'RHNL-032' })
      ).toBe('S | RHNL-032');
    });

    test('should skip the size of a size-less product', () => {
      expect(cartLineDesc({ availableSizes: [], style: 'RHNLOD-044' })).toBe(
        'RHNLOD-044'
      );
    });

    test('should show only the color of a size-less product with no style', () => {
      expect(
        cartLineDesc({ availableSizes: [], color: 'Black', style: '' })
      ).toBe('Black');
    });

    test('should show the color and the style', () => {
      expect(
        cartLineDesc({
          availableSizes: [],
          color: 'Black',
          style: 'RHNLOD-044',
        })
      ).toBe('Black | RHNLOD-044');
    });

    test('should show the size, the color and the style', () => {
      expect(
        cartLineDesc({
          availableSizes: ['M', 'L'],
          color: 'White',
          style: 'Tule',
        })
      ).toBe('M | White | Tule');
    });
  });

  describe('totals', () => {
    const total: ICartTotal = {
      productQuantity: 2,
      installments: 9,
      totalPrice: 61.63,
      currencyId: 'USD',
      currencyFormat: '$',
    };

    test('should format the subtotal', () => {
      expect(cartSubtotal(total)).toBe('$ 61.63');
    });

    test('should format the installment line with the largest installments', () => {
      expect(cartInstallment(total)).toBe('OR UP TO 9 x $ 6.85');
    });

    test('should return no installment line when installments is 0', () => {
      expect(cartInstallment({ ...total, installments: 0 })).toBeUndefined();
    });
  });
});
