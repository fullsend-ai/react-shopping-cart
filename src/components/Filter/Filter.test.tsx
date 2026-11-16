import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithThemeProvider } from 'utils/test/test-utils';
import { ProductsProvider, useProducts } from 'contexts/products-context/';

import Filter from '.';
import { availableBrands, availableSizes } from './Filter';

describe('[components] - Filter', () => {
  const setup = () => {
    return renderWithThemeProvider(
      <ProductsProvider>
        <Filter />
      </ProductsProvider>
    );
  };

  test('should render correctly', () => {
    const view = setup();
    expect(view).toMatchSnapshot();
  });

  test('should render every filter size avaliable', () => {
    setup();
    expect(availableSizes.every((size) => screen.getByText(size))).toBe(true);
  });

  test('should render the Red Hat brand filter', () => {
    setup();
    expect(screen.getByText('Brand:')).toBeInTheDocument();
    expect(availableBrands).toEqual(['Red Hat']);
    expect(screen.getByLabelText('Red Hat')).toBeInTheDocument();
  });

  test('should update the product count when toggling the brand filter', async () => {
    const ProductCount = () => {
      const { products } = useProducts();
      return <p>{products.length} Product(s) found</p>;
    };

    renderWithThemeProvider(
      <ProductsProvider>
        <Filter />
        <ProductCount />
      </ProductsProvider>
    );

    expect(screen.getByText('0 Product(s) found')).toBeInTheDocument();

    await userEvent.click(screen.getByLabelText('Red Hat'));
    expect(await screen.findByText('2 Product(s) found')).toBeInTheDocument();
    expect(screen.getByLabelText('Red Hat')).toBeChecked();

    await userEvent.click(screen.getByLabelText('Red Hat'));
    expect(await screen.findByText('18 Product(s) found')).toBeInTheDocument();
    expect(screen.getByLabelText('Red Hat')).not.toBeChecked();
  });

  test.each(['S', 'XXL', 'Red Hat'])(
    'should show the Craghoppers Grey Half Zip Fleece when filtering by %s',
    async (label) => {
      const ProductTitles = () => {
        const { products } = useProducts();
        return (
          <ul>
            {products.map(({ id, title }) => (
              <li key={id}>{title}</li>
            ))}
          </ul>
        );
      };

      renderWithThemeProvider(
        <ProductsProvider>
          <Filter />
          <ProductTitles />
        </ProductsProvider>
      );

      await userEvent.click(screen.getByLabelText(label));
      expect(
        await screen.findByText('Craghoppers Grey Half Zip Fleece')
      ).toBeInTheDocument();
    }
  );
});
