import { createHash } from 'crypto';
import { readFileSync } from 'fs';
import path from 'path';
import { screen } from '@testing-library/react';
import { renderWithThemeProvider } from 'utils/test/test-utils';
import matchesBrand from 'utils/matchesBrand';
import { CartProvider } from 'contexts/cart-context';
import { mockCartProducts } from 'utils/test/mocks';
import { getProducts } from 'services/products';
import { availableSizes } from 'components/Filter/Filter';

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
      createHash('sha256').update(readFileSync(imagePath(file))).digest('hex');

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
      createHash('sha256').update(readFileSync(imagePath(file))).digest('hex');

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
});
