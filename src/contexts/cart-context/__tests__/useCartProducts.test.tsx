import { renderHook } from '@testing-library/react';
import { ICartProduct, ICartTotal } from 'models';
import React, { ReactNode } from 'react';
import { CartProvider } from '..';
import useCartProducts from '../useCartProducts';
import * as useCartTotalModule from '../useCartTotal';

import { mockCartProducts } from 'utils/test/mocks';

const wrapper = ({ children }: { children: ReactNode }) => (
  <CartProvider>{children}</CartProvider>
);

describe('[contexts] - cart-context', () => {
  describe('useProducts', () => {
    let products: ICartProduct[];
    const originalUseContext = React.useContext;

    const setupMockUseContext = (initialProducts: ICartProduct[] = []) => {
      products = initialProducts;
      const mockSetProducts = jest
        .fn()
        .mockImplementation((updatedProducts) => {
          products = [...updatedProducts];
          return products;
        });
      const mockUseContext = jest.fn().mockImplementation(() => ({
        products: initialProducts,
        setProducts: mockSetProducts,
      }));
      React.useContext = mockUseContext;
    };

    const resetMocks = () => {
      React.useContext = originalUseContext;
      jest.restoreAllMocks();
    };

    describe('addProducts', () => {
      afterEach(() => {
        resetMocks();
      });

      test('should addProduct and update cartTotal', () => {
        setupMockUseContext();

        const mockUpdateCartTotal = jest.fn();
        jest.spyOn(useCartTotalModule, 'default').mockImplementation(() => ({
          total: {} as ICartTotal,
          updateCartTotal: mockUpdateCartTotal,
        }));

        const mockCartProduct = mockCartProducts[0];
        const { result } = renderHook(() => useCartProducts(), { wrapper });

        expect(products).toHaveLength(0);
        result.current.addProduct(mockCartProduct);
        expect(products).toHaveLength(1);
        expect(products).toEqual([mockCartProduct]);
        expect(mockUpdateCartTotal).toHaveBeenNthCalledWith(1, products);
      });

      test('should update product quatity in cart when product is already in cart', () => {
        const mockCartProduct = mockCartProducts[0];
        setupMockUseContext([mockCartProduct]);

        const mockUpdateCartTotal = jest.fn();
        jest.spyOn(useCartTotalModule, 'default').mockImplementation(() => ({
          total: {} as ICartTotal,
          updateCartTotal: mockUpdateCartTotal,
        }));

        const { result } = renderHook(() => useCartProducts(), { wrapper });

        result.current.addProduct(mockCartProduct);
        expect(products[0].quantity).toBe(2);
      });
    });

    describe('removeProducts', () => {
      afterEach(() => {
        resetMocks();
      });

      test('should remove product from cart', () => {
        const mockCartProduct = mockCartProducts[0];
        setupMockUseContext([mockCartProduct]);

        const mockUpdateCartTotal = jest.fn();
        jest.spyOn(useCartTotalModule, 'default').mockImplementation(() => ({
          total: {} as ICartTotal,
          updateCartTotal: mockUpdateCartTotal,
        }));

        const { result } = renderHook(() => useCartProducts(), { wrapper });

        expect(products).toHaveLength(1);
        result.current.removeProduct(mockCartProduct);
        expect(products).toHaveLength(0);
        expect(mockUpdateCartTotal).toHaveBeenNthCalledWith(1, products);
      });

      test('should not remove product from cart when product is new', () => {
        setupMockUseContext([mockCartProducts[0]]);

        const mockUpdateCartTotal = jest.fn();
        jest.spyOn(useCartTotalModule, 'default').mockImplementation(() => ({
          total: {} as ICartTotal,
          updateCartTotal: mockUpdateCartTotal,
        }));

        const { result } = renderHook(() => useCartProducts(), { wrapper });

        expect(products).toHaveLength(1);
        result.current.removeProduct(mockCartProducts[1]);
        expect(products).toHaveLength(1);
        expect(mockUpdateCartTotal).toHaveBeenNthCalledWith(1, products);
      });

      test('should increase product quantity', () => {
        const mockCartProduct = mockCartProducts[0];
        setupMockUseContext([mockCartProduct]);

        const mockUpdateCartTotal = jest.fn();
        jest.spyOn(useCartTotalModule, 'default').mockImplementation(() => ({
          total: {} as ICartTotal,
          updateCartTotal: mockUpdateCartTotal,
        }));

        const { result } = renderHook(() => useCartProducts(), { wrapper });

        expect(products[0].quantity).toBe(1);
        result.current.increaseProductQuantity(mockCartProduct);
        expect(products[0].quantity).toBe(2);
        expect(mockUpdateCartTotal).toHaveBeenNthCalledWith(1, products);
      });

      test('should decrease product quantity', () => {
        const mockCartProduct = mockCartProducts[0];
        setupMockUseContext([mockCartProduct]);

        const mockUpdateCartTotal = jest.fn();
        jest.spyOn(useCartTotalModule, 'default').mockImplementation(() => ({
          total: {} as ICartTotal,
          updateCartTotal: mockUpdateCartTotal,
        }));

        const { result } = renderHook(() => useCartProducts(), { wrapper });

        expect(products[0].quantity).toBe(1);
        result.current.decreaseProductQuantity(mockCartProduct);
        expect(products[0].quantity).toBe(0);
        expect(mockUpdateCartTotal).toHaveBeenNthCalledWith(1, products);
      });
    });

    describe('clearCart', () => {
      afterEach(() => {
        resetMocks();
      });

      test('should remove every product and update cartTotal', () => {
        setupMockUseContext([mockCartProducts[0], mockCartProducts[1]]);

        const mockUpdateCartTotal = jest.fn();
        jest.spyOn(useCartTotalModule, 'default').mockImplementation(() => ({
          total: {} as ICartTotal,
          updateCartTotal: mockUpdateCartTotal,
        }));

        const { result } = renderHook(() => useCartProducts(), { wrapper });

        expect(products).toHaveLength(2);
        result.current.clearCart();
        expect(products).toHaveLength(0);
        expect(mockUpdateCartTotal).toHaveBeenNthCalledWith(1, []);
      });
    });

    describe('colors', () => {
      const black: ICartProduct = {
        ...mockCartProducts[0],
        availableColors: ['Black', 'White'],
        color: 'Black',
      };
      const white: ICartProduct = { ...black, color: 'White' };

      const setup = (initialProducts: ICartProduct[]) => {
        setupMockUseContext(initialProducts);
        jest.spyOn(useCartTotalModule, 'default').mockImplementation(() => ({
          total: {} as ICartTotal,
          updateCartTotal: jest.fn(),
        }));
        return renderHook(() => useCartProducts(), { wrapper });
      };

      afterEach(() => {
        resetMocks();
      });

      test('should add another color of the same product as its own line', () => {
        const { result } = setup([black]);

        result.current.addProduct(white);
        expect(products).toEqual([black, white]);
      });

      test('should merge the same color into one line', () => {
        const { result } = setup([black, white]);

        result.current.addProduct(white);
        expect(products.map((p) => [p.color, p.quantity])).toEqual([
          ['Black', 1],
          ['White', 2],
        ]);
      });

      test('should change only the quantity of the chosen color', () => {
        const { result } = setup([black, white]);

        result.current.increaseProductQuantity(black);
        expect(products.map((p) => [p.color, p.quantity])).toEqual([
          ['Black', 2],
          ['White', 1],
        ]);
      });

      test('should remove only the chosen color', () => {
        const { result } = setup([black, white]);

        result.current.removeProduct(black);
        expect(products).toEqual([white]);
      });
    });
  });
});
