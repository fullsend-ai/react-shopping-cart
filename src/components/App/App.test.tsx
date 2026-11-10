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

  test('should render the Red Hat logo above the filters and products', () => {
    setup();
    const logo = screen.getByRole('img', { name: /red hat/i });
    const filterTitle = screen.getByText(/Sizes:/i);
    const productsCount = screen.getByText(/Product\(s\) found/i);
    screen.getAllByRole('main').forEach((main) => {
      expect(main).not.toContainElement(logo);
    });
    expect(
      logo.compareDocumentPosition(filterTitle) &
        Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
    expect(
      logo.compareDocumentPosition(productsCount) &
        Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
  });

  test('should not render the recruiter banner', () => {
    setup();
    expect(
      screen.queryByText(/Work in the Netherlands/i)
    ).not.toBeInTheDocument();
  });

  test('should not render the GitHub star button', () => {
    setup();
    expect(
      screen.queryByText(/Leave a star on Github/i)
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: /Star .* on GitHub/i })
    ).not.toBeInTheDocument();
    expect(screen.getByText(/Sizes:/i)).toBeInTheDocument();
  });
});
