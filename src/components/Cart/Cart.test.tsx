import { fireEvent, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { renderWithThemeProvider } from 'utils/test/test-utils';
import { CartProvider } from 'contexts/cart-context';
import Product from 'components/Products/Product';
import { IGetProductsResponse, IProduct } from 'models';

import Cart from '.';

const catalog: IProduct[] = (
  require('static/json/products.json') as IGetProductsResponse
).data.products;
const byId = (id: number) => catalog.find((p) => p.id === id) as IProduct;

const tShirt = byId(16); // Red Hat AI Black T-Shirt, $ 13.00, 9 installments
const fleece = byId(17); // Craghoppers Grey Half Zip Fleece, $ 48.63, 0
const bottle = byId(19); // Hydro Flask bottle (TSTAPP-6), Black / White, 0

describe('[components] - Cart', () => {
  const setup = (cards: IProduct[] = []) => {
    return renderWithThemeProvider(
      <CartProvider>
        {cards.map((product) => (
          <Product product={product} key={product.id} />
        ))}
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

  describe('checkout', () => {
    let alertSpy: jest.SpyInstance;

    beforeEach(() => {
      alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});
    });

    afterEach(() => {
      alertSpy.mockRestore();
    });

    // Cards render in the order given, so the n-th "Add to cart" button is
    // the n-th card's.
    const addToCart = async (cardIndex: number, color?: string) => {
      if (color) {
        await userEvent.click(screen.getByRole('radio', { name: color }));
      }
      await userEvent.click(
        screen.getAllByRole('button', { name: 'Add to cart' })[cardIndex]
      );
    };

    // The button that opens the closed cart, named by its quantity badge.
    const cartToggle = () =>
      screen.getByRole('button', { name: 'Products in cart quantity' });

    const summary = () => screen.getByRole('region', { name: 'Order summary' });

    const openSummary = async () => {
      await userEvent.click(screen.getByRole('button', { name: 'Checkout' }));
      return summary();
    };

    test('should show an in-page order summary that matches the cart', async () => {
      setup([fleece, bottle]);

      await addToCart(0);
      await addToCart(0);
      await addToCart(1, 'Black');
      await addToCart(1, 'White');

      // The cart footer's subtotal.
      expect(screen.getByText('$ 167.16')).toBeVisible();

      const view = await openSummary();
      const lines = within(view).getAllByRole('listitem');

      expect(lines).toHaveLength(3);
      expect(lines[0]).toHaveTextContent(fleece.title);
      expect(lines[0]).toHaveTextContent('S | RHNL-032');
      expect(lines[0]).toHaveTextContent('Quantity: 2');
      expect(within(lines[0]).getByText('$ 97.26')).toBeInTheDocument();
      expect(lines[1]).toHaveTextContent(bottle.title);
      expect(within(lines[1]).getByText(/^Black/)).toBeInTheDocument();
      expect(lines[1]).toHaveTextContent('Quantity: 1');
      expect(within(lines[1]).getByText('$ 34.95')).toBeInTheDocument();
      expect(within(lines[2]).getByText(/^White/)).toBeInTheDocument();
      expect(lines[2]).not.toHaveTextContent(/undefined/);

      expect(within(view).getByText('SUBTOTAL')).toBeInTheDocument();
      expect(within(view).getByText('$ 167.16')).toBeInTheDocument();
      expect(within(view).queryByText(/OR UP TO/)).not.toBeInTheDocument();

      // Read-only: no quantity or remove buttons in the summary.
      expect(
        within(view)
          .getAllByRole('button')
          .map((button) => button.textContent)
      ).toEqual(['Confirm order', 'Back to cart']);
      expect(alertSpy).not.toHaveBeenCalled();
    });

    test.each([
      ['a T-shirt (9)', [tShirt], 'OR UP TO 9 x $ 1.44'],
      [
        'a T-shirt (9) and a fleece (0)',
        [tShirt, fleece],
        'OR UP TO 9 x $ 6.85',
      ],
    ])(
      'should show the same installment info as the cart for %s',
      async (_, cards, installment) => {
        setup(cards);

        for (let index = 0; index < cards.length; index++) {
          await addToCart(index);
        }

        expect(screen.getByText(installment)).toBeVisible();

        const view = await openSummary();

        expect(within(view).getByText(installment)).toBeInTheDocument();
      }
    );

    test('should hide the installment info when every line has 0', async () => {
      setup([fleece]);

      await addToCart(0);
      expect(screen.queryByText(/OR UP TO/)).not.toBeInTheDocument();

      const view = await openSummary();

      // The line price and the subtotal.
      expect(within(view).getAllByText('$ 48.63')).toHaveLength(2);
      expect(within(view).queryByText(/OR UP TO/)).not.toBeInTheDocument();
    });

    test('should go back to the unchanged cart and show the updated summary', async () => {
      setup([fleece, bottle]);

      await addToCart(0);
      await addToCart(1, 'Black');

      await openSummary();
      await userEvent.click(
        screen.getByRole('button', { name: 'Back to cart' })
      );

      expect(
        screen.queryByRole('region', { name: 'Order summary' })
      ).not.toBeInTheDocument();
      expect(
        screen.getByRole('button', {
          name: `Remove ${fleece.title} from cart`,
        })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', {
          name: `Remove Black ${bottle.title} from cart`,
        })
      ).toBeInTheDocument();
      expect(screen.getByText('$ 83.58')).toBeVisible();
      expect(screen.getByRole('button', { name: 'Checkout' })).toHaveFocus();

      await userEvent.click(
        screen.getByRole('button', {
          name: `Increase ${fleece.title} quantity`,
        })
      );

      const view = await openSummary();
      const lines = within(view).getAllByRole('listitem');

      expect(lines).toHaveLength(2);
      expect(lines[0]).toHaveTextContent('Quantity: 2');
      expect(within(lines[0]).getByText('$ 97.26')).toBeInTheDocument();
      expect(within(view).getByText('$ 132.21')).toBeInTheDocument();
    });

    test('should confirm the order, show the thank-you message and empty the cart', async () => {
      setup([tShirt]);

      await addToCart(0);
      await openSummary();
      await userEvent.click(
        screen.getByRole('button', { name: 'Confirm order' })
      );

      expect(
        screen.getByRole('heading', { name: 'Order confirmed — great picks!' })
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          'Thanks for shopping with us! We hope you love what you picked.'
        )
      ).toBeInTheDocument();
      expect(
        screen.queryByText(/already getting it ready/)
      ).not.toBeInTheDocument();
      expect(
        screen.getByRole('link', { name: 'Keep shopping' })
      ).toHaveAttribute('href', '/');
      expect(
        screen.queryByRole('button', { name: 'Confirm order' })
      ).not.toBeInTheDocument();

      // The header badge already shows the emptied cart, and the message
      // stays after the total update.
      expect(screen.getByText('0')).toBeInTheDocument();
      expect(
        screen.getByRole('heading', { name: 'Order confirmed — great picks!' })
      ).toBeInTheDocument();

      await userEvent.click(screen.getByRole('button', { name: 'X' }));
      expect(screen.getByTitle('Products in cart quantity')).toHaveTextContent(
        '0'
      );

      await userEvent.click(cartToggle());
      expect(
        screen.getByText(/Add some products in the cart/)
      ).toBeInTheDocument();
      expect(alertSpy).not.toHaveBeenCalled();
    });

    test('should show the empty-cart message on Checkout with an empty cart', async () => {
      setup();

      await userEvent.click(cartToggle());
      await userEvent.click(screen.getByRole('button', { name: 'Checkout' }));

      expect(
        screen.getByRole('heading', {
          name: "Your cart is empty — let's find you something you'll love.",
        })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('link', { name: 'Back to the store' })
      ).toHaveAttribute('href', '/');
      expect(
        screen.queryByRole('region', { name: 'Order summary' })
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole('button', { name: 'Confirm order' })
      ).not.toBeInTheDocument();
      expect(alertSpy).not.toHaveBeenCalled();
    });

    describe('focus', () => {
      test("should focus each view's heading when the shopper opens it", async () => {
        setup([tShirt]);

        await userEvent.click(cartToggle());
        await userEvent.click(screen.getByRole('button', { name: 'Checkout' }));
        expect(
          screen.getByRole('heading', {
            name: "Your cart is empty — let's find you something you'll love.",
          })
        ).toHaveFocus();

        await addToCart(0);
        await openSummary();
        expect(
          screen.getByRole('heading', { name: 'Order summary' })
        ).toHaveFocus();

        await userEvent.click(
          screen.getByRole('button', { name: 'Confirm order' })
        );
        expect(
          screen.getByRole('heading', {
            name: 'Order confirmed — great picks!',
          })
        ).toHaveFocus();
      });

      test('should not move focus on opening the panel', async () => {
        setup();

        await userEvent.click(cartToggle());

        // Only the Checkout button's existing autoFocus applies.
        expect(screen.getByRole('button', { name: 'Checkout' })).toHaveFocus();
      });

      test('should not move focus when the panel closes from the summary', async () => {
        setup([tShirt]);

        await addToCart(0);
        await openSummary();

        const closeButton = screen.getByRole('button', { name: 'X' });
        await userEvent.click(closeButton);

        expect(closeButton).toHaveFocus();
        expect(
          screen.queryByRole('region', { name: 'Order summary' })
        ).not.toBeInTheDocument();

        // Reopening shows the cart list, not the summary.
        await userEvent.click(cartToggle());
        expect(
          screen.getByRole('button', {
            name: `Remove ${tShirt.title} from cart`,
          })
        ).toBeInTheDocument();
        expect(
          screen.queryByRole('region', { name: 'Order summary' })
        ).not.toBeInTheDocument();
      });

      test('should reset to the cart list without moving focus when a product is added from a card', async () => {
        setup([tShirt, fleece]);

        await addToCart(0);
        await openSummary();

        const addFleece = screen.getAllByRole('button', {
          name: 'Add to cart',
        })[1];
        await userEvent.click(addFleece);

        expect(addFleece).toHaveFocus();
        expect(
          screen.queryByRole('region', { name: 'Order summary' })
        ).not.toBeInTheDocument();
        expect(
          screen.getByRole('button', {
            name: `Remove ${fleece.title} from cart`,
          })
        ).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Checkout' })).toBeVisible();
      });
    });

    test('should never show a browser alert during checkout', async () => {
      setup([tShirt]);

      // Empty checkout.
      await userEvent.click(cartToggle());
      await userEvent.click(screen.getByRole('button', { name: 'Checkout' }));

      // Summary, back and confirm.
      await addToCart(0);
      await openSummary();
      await userEvent.click(
        screen.getByRole('button', { name: 'Back to cart' })
      );
      await openSummary();
      await userEvent.click(
        screen.getByRole('button', { name: 'Confirm order' })
      );

      expect(alertSpy).not.toHaveBeenCalled();
    });
  });
});
