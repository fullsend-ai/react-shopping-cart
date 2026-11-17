import { IProduct } from 'models';

// The image number N (as in `${sku}-N-product.webp` and `${sku}-N-cart.webp`)
// for the chosen color, taken from the product's `colorImages`. Returns
// undefined when no color is chosen or the product has no mapping, so callers
// keep their default images.
const colorImage = (
  product: Pick<IProduct, 'colorImages'>,
  color?: string
): number | undefined => (color ? product.colorImages?.[color] : undefined);

export default colorImage;
