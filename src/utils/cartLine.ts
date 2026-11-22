import formatPrice from 'utils/formatPrice';
import { ICartProduct, ICartTotal } from 'models';

// The line description shown under a cart line's title: the parts that are
// present (first size, chosen color, style) joined with " | ". Size-less
// products have no first size and may have no style, so it never prints
// "undefined" (decision 0004). The color keeps two color lines of one product
// distinct.
export const cartLineDesc = (
  product: Pick<ICartProduct, 'availableSizes' | 'color' | 'style'>
): string =>
  [product.availableSizes[0], product.color, product.style]
    .filter(Boolean)
    .join(' | ');

// The cart subtotal, for example "$ 59.53".
export const cartSubtotal = (total: ICartTotal): string =>
  `${total.currencyFormat} ${formatPrice(total.totalPrice, total.currencyId)}`;

// The cart installment line, for example "OR UP TO 9 x $ 6.85", or undefined
// when no line in the cart has installments.
export const cartInstallment = (total: ICartTotal): string | undefined =>
  total.installments
    ? `OR UP TO ${total.installments} x ${total.currencyFormat} ${formatPrice(
        total.totalPrice / total.installments,
        total.currencyId
      )}`
    : undefined;
