import { createHash } from 'crypto';
import { readFileSync } from 'fs';
import path from 'path';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithThemeProvider } from 'utils/test/test-utils';
import matchesBrand from 'utils/matchesBrand';
import { CartProvider } from 'contexts/cart-context';
import { mockCartProducts } from 'utils/test/mocks';
import { getProducts } from 'services/products';
import { availableSizes } from 'components/Filter/Filter';
import Cart from 'components/Cart';
import { IProduct } from 'models';

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

  describe('Craghoppers Grey Half Zip Fleece', () => {
    const title = 'Craghoppers Grey Half Zip Fleece';
    const imagePath = (file: string) =>
      path.resolve(__dirname, '../../../static/products', file);
    const checksum = (file: string) =>
      createHash('sha256')
        .update(readFileSync(imagePath(file)))
        .digest('hex');

    test('should be in the catalog with the requested details', async () => {
      const products = await getProducts();
      const product = products.find((p) => p.title === title);

      expect(product).toMatchObject({
        id: 17,
        style: 'RHNL-032',
        description:
          '100% recycled microfleece, 205gsm, Red Hat logo embroidery',
        price: 48.63,
        currencyId: 'USD',
        currencyFormat: '$',
        isFreeShipping: true,
        installments: 0,
        availableSizes: ['S', 'XXL'],
      });
    });

    test('should have a unique id and a unique 16-digit sku', async () => {
      const products = await getProducts();
      const product = products.find((p) => p.title === title);

      expect(String(product?.sku)).toMatch(/^\d{16}$/);
      expect(products.filter(({ id }) => id === product?.id)).toHaveLength(1);
      expect(products.filter(({ sku }) => sku === product?.sku)).toHaveLength(
        1
      );
    });

    test('should only use sizes from the filter vocabulary', async () => {
      const products = await getProducts();
      const product = products.find((p) => p.title === title);

      product?.availableSizes.forEach((size) => {
        expect(availableSizes).toContain(size);
      });
      expect(product?.availableSizes).not.toContain('XXXL');
    });

    test('should match the Red Hat brand filter', async () => {
      const products = await getProducts();
      const product = products.find((p) => p.title === title);

      expect(product && matchesBrand(product, 'Red Hat')).toBe(true);
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

    test('should not reuse the front image as the hover image', async () => {
      const products = await getProducts();
      const product = products.find((p) => p.title === title);
      const sku = product?.sku;

      expect(checksum(`${sku}-2-product.webp`)).not.toBe(
        checksum(`${sku}-1-product.webp`)
      );
    });

    test('should render with free shipping', async () => {
      const products = await getProducts();
      const product = products.find((p) => p.title === title);

      setup({ product });
      expect(screen.getByText(title)).toBeInTheDocument();
      expect(screen.getByText('Free shipping')).toBeInTheDocument();
    });
  });

  describe('Pullover Heather Grey Hoodie Unisex', () => {
    const title = 'Pullover Heather Grey Hoodie Unisex';
    const imagePath = (file: string) =>
      path.resolve(__dirname, '../../../static/products', file);
    const checksum = (file: string) =>
      createHash('sha256')
        .update(readFileSync(imagePath(file)))
        .digest('hex');

    test('should be in the catalog once with the requested details', async () => {
      const products = await getProducts();
      const matches = products.filter((p) => p.title === title);

      expect(matches).toHaveLength(1);
      expect(matches[0]).toMatchObject({
        id: 18,
        style: 'RHNL-031',
        description:
          '52% ring-spun cotton / 48% polyester, 220gsm, Red Hat logo print',
        price: 35.92,
        currencyId: 'USD',
        currencyFormat: '$',
        isFreeShipping: true,
        installments: 0,
        availableSizes: ['S', 'XL', 'XXL'],
      });
    });

    test('should have a unique id and a unique safe-integer sku', async () => {
      const products = await getProducts();
      const product = products.find((p) => p.title === title);

      expect(Number.isSafeInteger(product?.sku)).toBe(true);
      expect(products.filter(({ id }) => id === product?.id)).toHaveLength(1);
      expect(products.filter(({ sku }) => sku === product?.sku)).toHaveLength(
        1
      );
    });

    test('should only use sizes from the filter vocabulary', async () => {
      const products = await getProducts();
      const product = products.find((p) => p.title === title);

      product?.availableSizes.forEach((size) => {
        expect(availableSizes).toContain(size);
      });
    });

    test('should match the Red Hat brand filter', async () => {
      const products = await getProducts();
      const product = products.find((p) => p.title === title);

      expect(product && matchesBrand(product, 'Red Hat')).toBe(true);
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

    test('should not reuse the front image as the hover image', async () => {
      const products = await getProducts();
      const product = products.find((p) => p.title === title);
      const sku = product?.sku;

      expect(checksum(`${sku}-2-product.webp`)).not.toBe(
        checksum(`${sku}-1-product.webp`)
      );
    });

    test('should render with its price and free shipping', async () => {
      const products = await getProducts();
      const product = products.find((p) => p.title === title);

      setup({ product });
      expect(screen.getByText(title)).toBeInTheDocument();
      expect(screen.getByText('35')).toBeInTheDocument();
      expect(screen.getByText('.92')).toBeInTheDocument();
      expect(screen.getByText('Free shipping')).toBeInTheDocument();
    });
  });

  describe('Hydro Flask 21 oz Standard Mouth water bottle', () => {
    const title = 'Hydro Flask 21 oz Standard Mouth water bottle';
    const imagePath = (file: string) =>
      path.resolve(__dirname, '../../../static/products', file);
    const checksum = (file: string) =>
      createHash('sha256')
        .update(readFileSync(imagePath(file)))
        .digest('hex');
    // Width and height of a WebP file, read from its first chunk.
    const dimensions = (file: string) => {
      const data = readFileSync(imagePath(file));
      const chunk = data.toString('ascii', 12, 16);
      if (chunk === 'VP8 ') {
        return [data.readUInt16LE(26) & 0x3fff, data.readUInt16LE(28) & 0x3fff];
      }
      if (chunk === 'VP8L') {
        const bits = data.readUInt32LE(21);
        return [(bits & 0x3fff) + 1, ((bits >> 14) & 0x3fff) + 1];
      }
      return [data.readUIntLE(24, 3) + 1, data.readUIntLE(27, 3) + 1];
    };

    const getBottle = async () => {
      const products = await getProducts();
      return products.find((p) => p.title === title) as IProduct;
    };

    const getApparel = async () => {
      const products = await getProducts();
      return products.find(
        (p) => p.title === 'Craghoppers Grey Half Zip Fleece'
      ) as IProduct;
    };

    const setupWithCart = (...products: IProduct[]) =>
      renderWithThemeProvider(
        <CartProvider>
          {products.map((product) => (
            <Product product={product} key={product.id} />
          ))}
          <Cart />
        </CartProvider>
      );

    const cartLineTexts = () =>
      screen.queryAllByText(/Quantity:/).map((desc) => desc.textContent);

    test('should be in the catalog once with the requested details', async () => {
      const products = await getProducts();
      const matches = products.filter((p) => p.title === title);

      expect(matches).toHaveLength(1);
      expect(matches[0]).toEqual({
        id: 19,
        sku: 2121000000000001,
        title,
        description:
          '21 oz insulated stainless steel water bottle, Standard Mouth, Red Hat logo print',
        availableSizes: [],
        availableColors: ['Black', 'White'],
        style: '',
        price: 34.95,
        installments: 0,
        currencyId: 'USD',
        currencyFormat: '$',
        isFreeShipping: true,
      });
    });

    test('should have a unique id and a unique safe-integer sku', async () => {
      const products = await getProducts();
      const product = await getBottle();

      expect(Number.isSafeInteger(product.sku)).toBe(true);
      expect(products.filter(({ id }) => id === product.id)).toHaveLength(1);
      expect(products.filter(({ sku }) => sku === product.sku)).toHaveLength(1);
    });

    test('should match the Red Hat brand filter', async () => {
      const product = await getBottle();

      expect(matchesBrand(product, 'Red Hat')).toBe(true);
    });

    test('should have product and cart images', async () => {
      const { sku } = await getBottle();

      expect(() =>
        require(`static/products/${sku}-1-product.webp`)
      ).not.toThrow();
      expect(() =>
        require(`static/products/${sku}-2-product.webp`)
      ).not.toThrow();
      expect(() => require(`static/products/${sku}-1-cart.webp`)).not.toThrow();
    });

    test('should not reuse the front image as the hover image', async () => {
      const { sku } = await getBottle();

      expect(checksum(`${sku}-2-product.webp`)).not.toBe(
        checksum(`${sku}-1-product.webp`)
      );
    });

    test('should have images the size of an existing product', async () => {
      const { sku } = await getBottle();
      const { sku: existingSku } = await getApparel();

      ['1-product', '2-product', '1-cart'].forEach((suffix) => {
        expect(dimensions(`${sku}-${suffix}.webp`)).toEqual(
          dimensions(`${existingSku}-${suffix}.webp`)
        );
      });
    });

    test('should render with its price and free shipping', async () => {
      setupWithCart(await getBottle());

      expect(screen.getByText(title)).toBeInTheDocument();
      expect(screen.getByText('34')).toBeInTheDocument();
      expect(screen.getByText('.95')).toBeInTheDocument();
      expect(screen.getByText('Free shipping')).toBeInTheDocument();
    });

    test('should require a color before adding to the cart', async () => {
      setupWithCart(await getBottle());
      const addButton = screen.getByRole('button', { name: 'Add to cart' });

      expect(screen.getByRole('group', { name: 'Color' })).toBeInTheDocument();
      expect(screen.getByRole('radio', { name: 'Black' })).not.toBeChecked();
      expect(screen.getByRole('radio', { name: 'White' })).not.toBeChecked();
      expect(addButton).toBeDisabled();
      expect(addButton).toHaveAccessibleDescription('Choose a color');
      expect(screen.getByText('Choose a color')).toBeVisible();

      // The card is the first tab stop (tabIndex 1).
      await userEvent.tab();
      await userEvent.keyboard('{Enter}');
      await userEvent.keyboard(' ');
      await userEvent.click(addButton);

      expect(cartLineTexts()).toHaveLength(0);
      expect(screen.getByTitle('Products in cart quantity')).toHaveTextContent(
        '0'
      );
    });

    test('should not add to the cart while picking a color by keyboard', async () => {
      setupWithCart(await getBottle());
      const black = screen.getByRole('radio', { name: 'Black' });
      const white = screen.getByRole('radio', { name: 'White' });

      black.focus();
      await userEvent.keyboard(' ');
      expect(black).toBeChecked();
      await userEvent.keyboard('{ArrowRight}');
      expect(white).toBeChecked();
      expect(white).toHaveFocus();
      await userEvent.keyboard('{Enter}');
      await userEvent.keyboard(' ');

      expect(cartLineTexts()).toHaveLength(0);
      expect(screen.getByTitle('Products in cart quantity')).toHaveTextContent(
        '0'
      );
      expect(screen.queryByText('Choose a color')).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Add to cart' })).toBeEnabled();
    });

    test('should add the chosen color as a cart line and keep it chosen', async () => {
      setupWithCart(await getBottle());

      await userEvent.click(screen.getByRole('radio', { name: 'White' }));
      await userEvent.click(
        screen.getByRole('button', { name: 'Add to cart' })
      );

      expect(cartLineTexts()).toEqual(['White Quantity: 1']);
      // The line price and the subtotal.
      expect(screen.getAllByText('$ 34.95')).toHaveLength(2);
      expect(screen.queryByText(/undefined/)).not.toBeInTheDocument();
      expect(screen.getByRole('radio', { name: 'White' })).toBeChecked();
    });

    test('should add the chosen color from the keyboard', async () => {
      setupWithCart(await getBottle());
      const status = screen.getByRole('status');
      const black = screen.getByRole('radio', { name: 'Black' });

      expect(status).toHaveTextContent('');

      // The card is the first tab stop (tabIndex 1), then the color radios.
      await userEvent.tab();
      await userEvent.tab();
      expect(black).toHaveFocus();
      await userEvent.keyboard(' ');
      expect(black).toBeChecked();
      expect(status).toHaveTextContent('Black chosen. You can add to cart.');

      // Back to the card, which adds the chosen color on Enter.
      await userEvent.tab({ shift: true });
      expect(black).not.toHaveFocus();
      await userEvent.keyboard('{Enter}');

      expect(cartLineTexts()).toEqual(['Black Quantity: 1']);
    });

    test('should merge the same color and split different colors', async () => {
      setupWithCart(await getBottle());
      const addButton = screen.getByRole('button', { name: 'Add to cart' });

      await userEvent.click(screen.getByRole('radio', { name: 'Black' }));
      await userEvent.click(addButton);
      await userEvent.click(screen.getByRole('radio', { name: 'White' }));
      await userEvent.click(addButton);
      await userEvent.click(addButton);

      expect(cartLineTexts()).toEqual([
        'Black Quantity: 1',
        'White Quantity: 2',
      ]);
      // The cart badge.
      expect(screen.getByText('3')).toBeInTheDocument();
      expect(screen.getByText('$ 104.85')).toBeInTheDocument();

      // Cart lines are in the order they were added: Black, then White.
      await userEvent.click(
        screen.getByRole('button', {
          name: `Increase Black ${title} quantity`,
        })
      );
      expect(cartLineTexts()).toEqual([
        'Black Quantity: 2',
        'White Quantity: 2',
      ]);

      await userEvent.click(
        screen.getByRole('button', {
          name: `Decrease White ${title} quantity`,
        })
      );
      expect(cartLineTexts()).toEqual([
        'Black Quantity: 2',
        'White Quantity: 1',
      ]);

      await userEvent.click(
        screen.getByRole('button', { name: `Remove Black ${title} from cart` })
      );
      expect(cartLineTexts()).toEqual(['White Quantity: 1']);
      expect(screen.getByText('1')).toBeInTheDocument();
    });

    test('should leave apparel without a color picker and add it at once', async () => {
      setupWithCart(await getApparel());
      const addButton = screen.getByRole('button', { name: 'Add to cart' });

      expect(screen.queryByRole('group', { name: 'Color' })).toBeNull();
      expect(screen.queryByText('Choose a color')).not.toBeInTheDocument();
      expect(addButton).toBeEnabled();

      await userEvent.tab();
      await userEvent.keyboard('{Enter}');
      expect(cartLineTexts()).toEqual(['S | RHNL-032 Quantity: 1']);

      await userEvent.click(addButton);
      expect(cartLineTexts()).toEqual(['S | RHNL-032 Quantity: 2']);
    });

    describe('checkout', () => {
      let alertSpy: jest.SpyInstance;

      beforeEach(() => {
        alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});
      });

      afterEach(() => {
        alertSpy.mockRestore();
      });

      test('should check out with only the bottle in the cart', async () => {
        setupWithCart(await getBottle());

        await userEvent.click(screen.getByRole('radio', { name: 'Black' }));
        await userEvent.click(
          screen.getByRole('button', { name: 'Add to cart' })
        );
        await userEvent.click(screen.getByRole('button', { name: 'Checkout' }));

        expect(alertSpy).toHaveBeenCalledWith('Checkout - Subtotal: $ 34.95');
      });

      test('should check out with the bottle and apparel in the cart', async () => {
        const apparel = await getApparel();
        setupWithCart(await getBottle(), apparel);
        const [bottleButton, apparelButton] = screen.getAllByRole('button', {
          name: 'Add to cart',
        });

        await userEvent.click(apparelButton);
        await userEvent.click(screen.getByRole('radio', { name: 'Black' }));
        await userEvent.click(bottleButton);
        await userEvent.click(screen.getByRole('button', { name: 'Checkout' }));

        expect(alertSpy).toHaveBeenCalledWith(
          `Checkout - Subtotal: $ ${(apparel.price + 34.95).toFixed(2)}`
        );
      });
    });
  });
});
