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
    expect(await screen.findByText('6 Product(s) found')).toBeInTheDocument();
    expect(screen.getByLabelText('Red Hat')).toBeChecked();

    await userEvent.click(screen.getByLabelText('Red Hat'));
    expect(await screen.findByText('22 Product(s) found')).toBeInTheDocument();
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

  describe('Pullover Heather Grey Hoodie Unisex', () => {
    const title = 'Pullover Heather Grey Hoodie Unisex';

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

    const setupWithTitles = () =>
      renderWithThemeProvider(
        <ProductsProvider>
          <Filter />
          <ProductTitles />
        </ProductsProvider>
      );

    test.each(['S', 'XL', 'XXL', 'Red Hat'])(
      'should show the hoodie when filtering by %s',
      async (label) => {
        setupWithTitles();

        await userEvent.click(screen.getByLabelText(label));
        expect(await screen.findByText(title)).toBeInTheDocument();
      }
    );

    test.each(['XS', 'M', 'ML', 'L'])(
      'should not show the hoodie when filtering by %s',
      async (size) => {
        setupWithTitles();

        await userEvent.click(screen.getByLabelText(size));
        expect(
          await screen.findByText('Red Hat AI Black T-Shirt')
        ).toBeInTheDocument();
        expect(screen.queryByText(title)).not.toBeInTheDocument();
      }
    );
  });

  describe('Hydro Flask 21 oz Standard Mouth water bottle', () => {
    const title = 'Hydro Flask 21 oz Standard Mouth water bottle';

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

    test.each([[['S']], [['S', 'XL']], [['S', 'Red Hat']], [['Red Hat']]])(
      'should show the bottle when filtering by %p',
      async (labels) => {
        renderWithThemeProvider(
          <ProductsProvider>
            <Filter />
            <ProductTitles />
          </ProductsProvider>
        );

        for (const label of labels) {
          await userEvent.click(screen.getByLabelText(label));
        }
        expect(await screen.findByText(title)).toBeInTheDocument();
        // Apparel without the selected sizes or brand is still filtered out.
        expect(
          screen.queryByText('Black Tule Oversized')
        ).not.toBeInTheDocument();
      }
    );
  });

  describe('Black & Red Contrast Hoodie', () => {
    const title = 'Black & Red Contrast Hoodie';

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

    const setupWithTitles = () =>
      renderWithThemeProvider(
        <ProductsProvider>
          <Filter />
          <ProductTitles />
        </ProductsProvider>
      );

    test.each(['S', 'L', 'XL', 'XXL', 'Red Hat'])(
      'should show the hoodie when filtering by %s',
      async (label) => {
        setupWithTitles();

        await userEvent.click(screen.getByLabelText(label));
        expect(await screen.findByText(title)).toBeInTheDocument();
      }
    );

    test.each(['XS', 'M', 'ML'])(
      'should not show the hoodie when filtering by %s',
      async (size) => {
        setupWithTitles();

        await userEvent.click(screen.getByLabelText(size));
        expect(
          await screen.findByText('Red Hat AI Black T-Shirt')
        ).toBeInTheDocument();
        expect(screen.queryByText(title)).not.toBeInTheDocument();
      }
    );
  });

  describe('Case Logic 17.3" Laptop Backpack', () => {
    const title = 'Case Logic 17.3" Laptop Backpack';

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

    const setupWithTitles = () =>
      renderWithThemeProvider(
        <ProductsProvider>
          <Filter />
          <ProductTitles />
        </ProductsProvider>
      );

    test('should show the backpack with no filter selected', async () => {
      setupWithTitles();

      // Toggle the brand filter on and off to list the unfiltered catalog.
      await userEvent.click(screen.getByLabelText('Red Hat'));
      await userEvent.click(screen.getByLabelText('Red Hat'));
      expect(
        await screen.findByText('Black Tule Oversized')
      ).toBeInTheDocument();
      expect(screen.getByText(title)).toBeInTheDocument();
    });

    // It has no size, so it passes every size filter (decision 0004).
    test.each([...availableSizes, 'Red Hat'])(
      'should show the backpack when filtering by %s',
      async (label) => {
        setupWithTitles();

        await userEvent.click(screen.getByLabelText(label));
        expect(await screen.findByText(title)).toBeInTheDocument();
      }
    );
  });
});
