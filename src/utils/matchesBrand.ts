import { IProduct } from 'models';

const containsText = (text: string | undefined, search: string): boolean =>
  (text || '').toLowerCase().includes(search.toLowerCase());

const matchesBrand = (
  product: Pick<IProduct, 'title' | 'description'>,
  brand: string
): boolean =>
  containsText(product.title, brand) ||
  containsText(product.description, brand);

export default matchesBrand;
