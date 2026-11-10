import { fireEvent, screen } from '@testing-library/react';

import { renderWithThemeProvider } from 'utils/test/test-utils';
import { CartProvider } from 'contexts/cart-context';

import Cart from '.';

describe('[components] - Cart', () => {
  const setup = () => {
    return renderWithThemeProvider(
      <CartProvider>
        <Cart />
      </CartProvider>
    );
  };

  test('should render correctly', () => {
    const view = setup();
    expect(view).toMatchSnapshot();
  });

  test('should open the cart without leaking transient props to the DOM', () => {
    const consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    try {
      const { container } = setup();

      fireEvent.click(screen.getByRole('button'));

      expect(screen.getByText('Cart')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'X' })).toBeInTheDocument();

      // React drops unknown boolean props from the DOM but logs a warning,
      // so check both the rendered markup and the console output.
      expect(container.innerHTML).not.toMatch(/\s\$?(isopen|large)[\s=>]/i);
      const loggedMessages = consoleErrorSpy.mock.calls.map((args) =>
        args.map(String).join(' ')
      );
      expect(loggedMessages.join('\n')).not.toMatch(/\b(isOpen|large)\b/);
    } finally {
      consoleErrorSpy.mockRestore();
    }
  });
});
