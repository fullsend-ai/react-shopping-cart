import { screen } from '@testing-library/react';
import { renderWithThemeProvider } from 'utils/test/test-utils';
import { CartProvider } from 'contexts/cart-context';
import { mockCartProducts } from 'utils/test/mocks';
import { getProducts } from 'services/products';
import { availableSizes } from 'components/Filter/Filter';

import Product from '.';

describe('[components] - Product', () => {
  const setup = (props = {}) => {
    return renderWithThemeProvider(
      <CartProvider>
        <Product product={mockCartProducts[0]} {...props} />
      </CartProvider>
    );
  };

  test('should render correctly', () => {
    const view = setup();
    expect(view).toMatchSnapshot();
  });

  test('should not show free shipping for Cropped Stay Groovy off white', async () => {
    const products = await getProducts();
    const product = products.find(({ id }) => id === 0);

    expect(product?.title).toBe('Cropped Stay Groovy off white');
    expect(product?.isFreeShipping).toBe(false);

    setup({ product });
    expect(screen.queryByText('Free shipping')).not.toBeInTheDocument();
  });

  test('should show free shipping for products that have it', async () => {
    const products = await getProducts();
    const product = products.find(
      ({ title }) => title === 'Basic Cactus White T-shirt'
    );

    expect(product?.isFreeShipping).toBe(true);

    setup({ product });
    expect(screen.getByText('Free shipping')).toBeInTheDocument();
  });

  describe('Red Hat AI Black T-Shirt', () => {
    const title = 'Red Hat AI Black T-Shirt';

    test('should be in the catalog with the requested details', async () => {
      const products = await getProducts();
      const product = products.find((p) => p.title === title);

      expect(product).toMatchObject({
        price: 13,
        currencyId: 'USD',
        currencyFormat: '$',
        isFreeShipping: true,
        availableSizes: ['XS', 'S', 'M', 'ML', 'L', 'XL', 'XXL'],
      });
    });

    test('should have a unique id and sku', async () => {
      const products = await getProducts();
      const product = products.find((p) => p.title === title);

      expect(products.filter(({ id }) => id === product?.id)).toHaveLength(1);
      expect(products.filter(({ sku }) => sku === product?.sku)).toHaveLength(
        1
      );
    });

    test('should be available in every size filter', async () => {
      const products = await getProducts();
      const product = products.find((p) => p.title === title);

      availableSizes.forEach((size) => {
        expect(product?.availableSizes).toContain(size);
      });
    });

    test('should have product and cart images', async () => {
      const products = await getProducts();
      const product = products.find((p) => p.title === title);
      const sku = product?.sku;

      expect(() =>
        require(`static/products/${sku}-1-product.webp`)
      ).not.toThrow();
      expect(() =>
        require(`static/products/${sku}-2-product.webp`)
      ).not.toThrow();
      expect(() => require(`static/products/${sku}-1-cart.webp`)).not.toThrow();
    });

    test('should render with free shipping', async () => {
      const products = await getProducts();
      const product = products.find((p) => p.title === title);

      setup({ product });
      expect(screen.getByText(title)).toBeInTheDocument();
      expect(screen.getByText('Free shipping')).toBeInTheDocument();
    });
  });
});
