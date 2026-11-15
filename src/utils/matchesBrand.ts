import { IProduct } from 'models';

const escapeRegExp = (value: string): string =>
  value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Match the search as whole words only, so 'Red Hat' does not match
// 'Bored Hat' or 'Red Hatchback'.
const containsWords = (text: string | undefined, search: string): boolean =>
  new RegExp(`(^|\\W)${escapeRegExp(search)}(\\W|$)`, 'i').test(text || '');

const matchesBrand = (
  product: Pick<IProduct, 'title' | 'description'>,
  brand: string
): boolean =>
  containsWords(product.title, brand) ||
  containsWords(product.description, brand);

export default matchesBrand;
