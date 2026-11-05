import { screen } from '@testing-library/react';
import { renderWithThemeProvider } from 'utils/test/test-utils';
import { CartProvider } from 'contexts/cart-context';
import { mockCartProducts } from 'utils/test/mocks';
import { getProducts } from 'services/products';

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
});
