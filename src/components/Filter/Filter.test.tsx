import { screen } from '@testing-library/react';
import { renderWithThemeProvider } from 'utils/test/test-utils';
import { ProductsProvider } from 'contexts/products-context/';

import Filter from '.';
import { availableSizes } from './Filter';

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
});
