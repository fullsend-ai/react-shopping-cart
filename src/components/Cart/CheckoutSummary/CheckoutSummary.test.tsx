import { fireEvent, screen, within } from '@testing-library/react';

import { renderWithThemeProvider } from 'utils/test/test-utils';
import { CartProvider, useCart } from 'contexts/cart-context';
import { mockCartProducts } from 'utils/test/mocks';
import { ICartProduct } from 'models';

import CheckoutSummary from '.';

interface IHarnessProps {
  line: ICartProduct;
  onConfirm(): void;
  onBack(): void;
}

// Puts one line in the cart through the cart context, then shows the summary.
const Harness = ({ line, onConfirm, onBack }: IHarnessProps) => {
  const { products, addProduct } = useCart();

  return products.length ? (
    <CheckoutSummary onConfirm={onConfirm} onBack={onBack} />
  ) : (
    <button onClick={() => addProduct(line)}>fill</button>
  );
};

describe('[components] - CheckoutSummary', () => {
  const setup = (line: ICartProduct) => {
    const onConfirm = jest.fn();
    const onBack = jest.fn();

    renderWithThemeProvider(
      <CartProvider>
        <Harness line={line} onConfirm={onConfirm} onBack={onBack} />
      </CartProvider>
    );
    fireEvent.click(screen.getByRole('button', { name: 'fill' }));

    return { onConfirm, onBack };
  };

  test('should list the line with its description, quantity and line price', () => {
    setup({ ...mockCartProducts[0], quantity: 3 });

    const view = screen.getByRole('region', { name: 'Order summary' });
    const [line] = within(view).getAllByRole('listitem');

    expect(within(view).getAllByRole('listitem')).toHaveLength(1);
    expect(line).toHaveTextContent(mockCartProducts[0].title);
    expect(line).toHaveTextContent('S | White T-shirt');
    expect(line).toHaveTextContent('Quantity: 3');
    expect(within(line).getByText('$ 32.70')).toBeInTheDocument();
    // The line price and the subtotal.
    expect(within(view).getAllByText('$ 32.70')).toHaveLength(2);
    expect(within(view).getByText('OR UP TO 9 x $ 3.63')).toBeInTheDocument();
  });

  test('should call the actions', () => {
    const { onConfirm, onBack } = setup(mockCartProducts[1]);

    fireEvent.click(screen.getByRole('button', { name: 'Confirm order' }));
    expect(onConfirm).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: 'Back to cart' }));
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
