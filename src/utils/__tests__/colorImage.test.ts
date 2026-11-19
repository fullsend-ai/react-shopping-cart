import { cardImages, colorImage } from '../colorImage';

describe('[utils] - colorImage', () => {
  const bottle = { colorImages: { Black: 1, White: 2 } };

  test('should return the image number of the chosen color', () => {
    expect(colorImage(bottle, 'White')).toBe(2);
    expect(colorImage(bottle, 'Black')).toBe(1);
  });

  test('should return undefined without a color or a mapping', () => {
    expect(colorImage(bottle)).toBeUndefined();
    expect(colorImage({}, 'White')).toBeUndefined();
  });
});

describe('[utils] - cardImages', () => {
  const bottle = { colorImages: { Black: 1, White: 2 } };

  test('should show image 1 on the front and image 2 on hover before a color is chosen', () => {
    expect(cardImages(bottle)).toEqual({ front: 1, hover: 2 });
  });

  test('should show the chosen color on both the front and the hover', () => {
    expect(cardImages(bottle, 'White')).toEqual({ front: 2, hover: 2 });
    expect(cardImages(bottle, 'Black')).toEqual({ front: 1, hover: 1 });
  });

  test('should keep images 1 and 2 for products without colorImages', () => {
    expect(cardImages({})).toEqual({ front: 1, hover: 2 });
    expect(cardImages({}, 'White')).toEqual({ front: 1, hover: 2 });
  });
});
