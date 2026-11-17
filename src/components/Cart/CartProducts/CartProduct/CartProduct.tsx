import formatPrice from 'utils/formatPrice';
import colorImage from 'utils/colorImage';
import { ICartProduct } from 'models';

import { useCart } from 'contexts/cart-context';

import * as S from './style';

interface IProps {
  product: ICartProduct;
}
const CartProduct = ({ product }: IProps) => {
  const { removeProduct, increaseProductQuantity, decreaseProductQuantity } =
    useCart();
  const {
    sku,
    title,
    price,
    style,
    currencyId,
    currencyFormat,
    availableSizes,
    color,
    quantity,
  } = product;

  // Size-less products have no first size and may have no style, so join
  // only the parts that are present (never print "undefined").
  const desc = [availableSizes[0], color, style].filter(Boolean).join(' | ');
  // One product can have several lines (one per color), so the buttons name
  // the line they change.
  const lineName = color ? `${color} ${title}` : title;
  // The thumbnail follows the line's color; otherwise it is image 1.
  const image = colorImage(product, color) ?? 1;

  const handleRemoveProduct = () => removeProduct(product);
  const handleIncreaseProductQuantity = () => increaseProductQuantity(product);
  const handleDecreaseProductQuantity = () => decreaseProductQuantity(product);

  return (
    <S.Container>
      <S.DeleteButton
        onClick={handleRemoveProduct}
        title="remove product from cart"
        aria-label={`Remove ${lineName} from cart`}
      />
      <S.Image
        src={require(`static/products/${sku}-${image}-cart.webp`)}
        alt={title}
      />
      <S.Details>
        <S.Title>{title}</S.Title>
        <S.Desc>
          {desc} <br />
          Quantity: {quantity}
        </S.Desc>
      </S.Details>
      <S.Price>
        <p>{`${currencyFormat}  ${formatPrice(price, currencyId)}`}</p>
        <div>
          <S.ChangeQuantity
            onClick={handleDecreaseProductQuantity}
            disabled={quantity === 1 ? true : false}
            aria-label={`Decrease ${lineName} quantity`}
          >
            -
          </S.ChangeQuantity>
          <S.ChangeQuantity
            onClick={handleIncreaseProductQuantity}
            aria-label={`Increase ${lineName} quantity`}
          >
            +
          </S.ChangeQuantity>
        </div>
      </S.Price>
    </S.Container>
  );
};

export default CartProduct;
