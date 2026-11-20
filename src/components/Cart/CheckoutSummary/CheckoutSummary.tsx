import { Ref } from 'react';

import formatPrice from 'utils/formatPrice';
import { cartInstallment, cartLineDesc, cartSubtotal } from 'utils/cartLine';

import { useCart } from 'contexts/cart-context';

import * as S from './style';

interface IProps {
  headingRef?: Ref<HTMLHeadingElement>;
  onConfirm(): void;
  onBack(): void;
}

// The read-only order summary shown after Checkout. It reads the same
// products and total as the cart, so it always matches it. Quantities are
// changed in the cart ("Back to cart"), not here.
const CheckoutSummary = ({ headingRef, onConfirm, onBack }: IProps) => {
  const { products, total } = useCart();
  const installment = cartInstallment(total);

  return (
    <S.Container aria-labelledby="checkout-summary-heading">
      <S.Heading id="checkout-summary-heading" ref={headingRef} tabIndex={-1}>
        Order summary
      </S.Heading>
      <S.Lines>
        {products.map((product) => {
          const { id, title, quantity, price, currencyId, currencyFormat } =
            product;

          return (
            <S.Line key={`${id}-${product.color ?? ''}`}>
              <S.Details>
                <S.Title>{title}</S.Title>
                <S.Desc>
                  {cartLineDesc(product)} <br />
                  Quantity: {quantity}
                </S.Desc>
              </S.Details>
              <S.LinePrice>{`${currencyFormat} ${formatPrice(
                price * quantity,
                currencyId
              )}`}</S.LinePrice>
            </S.Line>
          );
        })}
      </S.Lines>
      <S.Subtotal>
        <S.Sub>SUBTOTAL</S.Sub>
        <S.SubPrice>
          <S.SubPriceValue>{cartSubtotal(total)}</S.SubPriceValue>
          {installment && (
            <S.SubPriceInstallment>{installment}</S.SubPriceInstallment>
          )}
        </S.SubPrice>
      </S.Subtotal>
      <S.Actions>
        <S.Button onClick={onConfirm}>Confirm order</S.Button>
        <S.SecondaryButton onClick={onBack}>Back to cart</S.SecondaryButton>
      </S.Actions>
    </S.Container>
  );
};

export default CheckoutSummary;
