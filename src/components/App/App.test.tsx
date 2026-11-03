import { screen } from '@testing-library/react';

import { renderWithThemeProvider } from 'utils/test/test-utils';
import { ProductsProvider } from 'contexts/products-context';
import { CartProvider } from 'contexts/cart-context';

import App from '.';

describe('[components] - App', () => {
  const setup = () => {
    return renderWithThemeProvider(
      <ProductsProvider>
        <CartProvider>
          <App />
        </CartProvider>
      </ProductsProvider>
    );
  };

  test('should render correctly', () => {
    const view = setup();
    expect(view).toMatchSnapshot();
  });

  test('should not render the recruiter banner', () => {
    setup();
    expect(
      screen.queryByText(/Work in the Netherlands/i)
    ).not.toBeInTheDocument();
  });
});
