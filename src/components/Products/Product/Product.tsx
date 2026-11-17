import { KeyboardEvent, useState } from 'react';

import formatPrice from 'utils/formatPrice';
import { IProduct } from 'models';

import { useCart } from 'contexts/cart-context';

import * as S from './style';

interface IProps {
  product: IProduct;
}

const Product = ({ product }: IProps) => {
  const { openCart, addProduct } = useCart();
  const {
    id,
    sku,
    title,
    price,
    installments,
    currencyId,
    currencyFormat,
    isFreeShipping,
    availableColors,
  } = product;

  const [color, setColor] = useState<string>();
  const hasColors = !!availableColors?.length;
  const needsColor = hasColors && !color;
  const colorHintId = `product-${id}-color-hint`;

  const formattedPrice = formatPrice(price, currencyId);
  let productInstallment;

  if (installments) {
    const installmentPrice = price / installments;

    productInstallment = (
      <S.Installment>
        <span>or {installments} x</span>
        <b>
          {currencyFormat}
          {formatPrice(installmentPrice, currencyId)}
        </b>
      </S.Installment>
    );
  }

  const handleAddProduct = () => {
    if (needsColor) return;

    addProduct(
      hasColors
        ? { ...product, color, quantity: 1 }
        : { ...product, quantity: 1 }
    );
    openCart();
  };

  const handleAddProductWhenEnter = (event: KeyboardEvent) => {
    if (event.key === 'Enter' || event.code === 'Space') {
      handleAddProduct();
    }
  };

  // Keys pressed on the color radios (arrows, Space, Enter) choose a color
  // only: they must not reach the card, which adds to the cart on key up.
  const handleColorPickerKeyUp = (event: KeyboardEvent) =>
    event.stopPropagation();

  return (
    <S.Container onKeyUp={handleAddProductWhenEnter} $sku={sku} tabIndex={1}>
      {isFreeShipping && <S.Stopper>Free shipping</S.Stopper>}
      <S.Image alt={title} />
      <S.Title>{title}</S.Title>
      <S.Price>
        <S.Val>
          <small>{currencyFormat}</small>
          <b>{formattedPrice.substring(0, formattedPrice.length - 3)}</b>
          <span>{formattedPrice.substring(formattedPrice.length - 3)}</span>
        </S.Val>
        {productInstallment}
      </S.Price>
      {hasColors && (
        <S.ColorPicker onKeyUp={handleColorPickerKeyUp}>
          <legend>Color</legend>
          {availableColors?.map((option) => (
            <S.ColorOption key={option}>
              <input
                type="radio"
                name={`product-${id}-color`}
                value={option}
                checked={color === option}
                onChange={() => setColor(option)}
              />
              {option}
            </S.ColorOption>
          ))}
        </S.ColorPicker>
      )}
      {hasColors && (
        // Announces the choice: "Add to cart" becomes enabled and the hint
        // goes away, which a screen reader on the radio would not notice.
        <S.ColorStatus role="status" aria-live="polite">
          {color ? `${color} chosen. You can add to cart.` : ''}
        </S.ColorStatus>
      )}
      {needsColor && <S.ColorHint id={colorHintId}>Choose a color</S.ColorHint>}
      <S.BuyButton
        onClick={handleAddProduct}
        tabIndex={-1}
        disabled={needsColor}
        aria-describedby={needsColor ? colorHintId : undefined}
      >
        Add to cart
      </S.BuyButton>
    </S.Container>
  );
};

export default Product;
