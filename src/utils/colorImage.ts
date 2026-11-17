import { IProduct } from 'models';

// The image number N (as in `${sku}-N-product.webp` and `${sku}-N-cart.webp`)
// for the chosen color, taken from the product's `colorImages`. Returns
// undefined when no color is chosen or the product has no mapping, so callers
// keep their default images.
const colorImage = (
  product: Pick<IProduct, 'colorImages'>,
  color?: string
): number | undefined => (color ? product.colorImages?.[color] : undefined);

// The image numbers of the card's front and hover images. Once a color is
// chosen, both show it, so the hover never contradicts the choice. Before
// that (and for products without colorImages) the card keeps image 1 on the
// front and image 2 on hover.
export const cardImages = (
  product: Pick<IProduct, 'colorImages'>,
  color?: string
): { front: number; hover: number } => {
  const chosen = colorImage(product, color);

  return { front: chosen ?? 1, hover: chosen ?? 2 };
};

export default colorImage;
