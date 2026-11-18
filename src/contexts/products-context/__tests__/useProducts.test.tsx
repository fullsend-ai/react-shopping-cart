import { renderHook } from '@testing-library/react';
import { ICartProduct } from 'models';
import React, { ReactNode } from 'react';
import { ProductsProvider } from '..';
import useProducts from '../useProducts';

import { mockProducts } from 'utils/test/mocks';
import { getProducts } from 'services/products';

const wrapper = ({ children }: { children: ReactNode }) => (
  <ProductsProvider>{children}</ProductsProvider>
);

describe('[contexts] - products-context', () => {
  describe('useProducts', () => {
    let isFetching: boolean;
    let products: ICartProduct[];
    let filters: string[];
    let brandFilters: string[];
    const originalUseContext = React.useContext;

    const setupMockUseContext = (options: { [key: string]: any } = {}) => {
      isFetching = false;
      products = options.initialProducts || [];
      filters = options.initialFilters || [];
      brandFilters = options.initialBrandFilters || [];

      const mockSetIsFetching = jest.fn().mockImplementation((newState) => {
        isFetching = newState;
        return isFetching;
      });

      const mockSetProducts = jest
        .fn()
        .mockImplementation((fetchedProducts) => {
          products = fetchedProducts;
          return products;
        });
      const mockSetFilters = jest.fn().mockImplementation((activeFilters) => {
        filters = activeFilters;
        return filters;
      });
      const mockSetBrandFilters = jest
        .fn()
        .mockImplementation((activeBrandFilters) => {
          brandFilters = activeBrandFilters;
          return brandFilters;
        });

      const mockUseContext = jest.fn().mockImplementation(() => ({
        isFetching: false,
        setIsFetching: mockSetIsFetching,
        products: options.initialProducts,
        setProducts: mockSetProducts,
        filters: options.initialFilters,
        setFilters: mockSetFilters,
        brandFilters: options.initialBrandFilters,
        setBrandFilters: mockSetBrandFilters,
      }));
      React.useContext = mockUseContext;
    };

    const resetMocks = () => {
      React.useContext = originalUseContext;
    };

    describe('fetchProducts', () => {
      afterEach(() => {
        resetMocks();
      });

      test('should filter products', async () => {
        setupMockUseContext({ initialProducts: mockProducts });

        const { result } = renderHook(() => useProducts(), { wrapper });

        expect(products).toEqual(mockProducts);
        await result.current.filterProducts(['M']);
        expect(products).toEqual([
          {
            availableSizes: ['M', 'ML'],
            currencyFormat: '$',
            currencyId: 'USD',
            description: '',
            id: 13,
            installments: 5,
            isFreeShipping: true,
            price: 29.45,
            sku: 51498472915966370,
            style: 'Tule',
            title: 'Black Tule Oversized',
          },
          {
            availableSizes: ['XS', 'S', 'M', 'ML', 'L', 'XL', 'XXL'],
            currencyFormat: '$',
            currencyId: 'USD',
            description: '100% combed ring-spun cotton, 145gsm',
            id: 16,
            installments: 9,
            isFreeShipping: true,
            price: 13,
            sku: 1771149885871948,
            style: 'Red Hat AI logo',
            title: 'Red Hat AI Black T-Shirt',
          },
        ]);
      });

      test('should keep the brand filter when filtering by size', async () => {
        setupMockUseContext({
          initialProducts: mockProducts,
          initialBrandFilters: ['Red Hat'],
        });

        const { result } = renderHook(() => useProducts(), { wrapper });

        await result.current.filterProducts(['M']);
        expect(products.map((p) => p.title)).toEqual([
          'Red Hat AI Black T-Shirt',
        ]);
        expect(filters).toEqual(['M']);
        expect(brandFilters).toEqual(['Red Hat']);
      });
    });

    describe('filterProductsByBrand', () => {
      afterEach(() => {
        resetMocks();
      });

      test('should show only products of the selected brand', async () => {
        setupMockUseContext({ initialProducts: mockProducts });

        const { result } = renderHook(() => useProducts(), { wrapper });

        await result.current.filterProductsByBrand(['Red Hat']);
        expect(products.map((p) => p.title)).toEqual([
          'Red Hat AI Black T-Shirt',
          'Craghoppers Grey Half Zip Fleece',
          'Pullover Heather Grey Hoodie Unisex',
          'Black & Red Contrast Hoodie',
        ]);
        expect(brandFilters).toEqual(['Red Hat']);
      });

      test('should combine the brand filter with the size filter', async () => {
        setupMockUseContext({
          initialProducts: mockProducts,
          initialFilters: ['S'],
        });

        const { result } = renderHook(() => useProducts(), { wrapper });

        await result.current.filterProductsByBrand(['Red Hat']);
        expect(products.map((p) => p.title)).toEqual([
          'Red Hat AI Black T-Shirt',
          'Craghoppers Grey Half Zip Fleece',
          'Pullover Heather Grey Hoodie Unisex',
          'Black & Red Contrast Hoodie',
        ]);
        expect(filters).toEqual(['S']);
      });

      test('should return no products when the brand does not offer the size', async () => {
        setupMockUseContext({
          initialProducts: mockProducts,
          initialFilters: ['X'],
        });

        const { result } = renderHook(() => useProducts(), { wrapper });

        await result.current.filterProductsByBrand(['Red Hat']);
        expect(products).toEqual([]);
      });

      test('should restore size-only filtering when the brand is cleared', async () => {
        setupMockUseContext({
          initialProducts: mockProducts,
          initialFilters: ['M'],
          initialBrandFilters: ['Red Hat'],
        });

        const { result } = renderHook(() => useProducts(), { wrapper });

        await result.current.filterProductsByBrand([]);
        expect(products.map((p) => p.title)).toEqual([
          'Black Tule Oversized',
          'Red Hat AI Black T-Shirt',
        ]);
        expect(brandFilters).toEqual([]);
      });

      test('should show all products when no filter is selected', async () => {
        setupMockUseContext({ initialProducts: mockProducts });

        const { result } = renderHook(() => useProducts(), { wrapper });

        await result.current.filterProductsByBrand([]);
        expect(products).toEqual(await getProducts());
      });
    });
  });
});
