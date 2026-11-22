import { useEffect, useRef, useState } from 'react';

import { cartInstallment, cartSubtotal } from 'utils/cartLine';
import CartProducts from './CartProducts';
import CheckoutSummary from './CheckoutSummary';
import CheckoutMessage from './CheckoutMessage';

import { useCart } from 'contexts/cart-context';

import * as S from './style';

// What the cart panel shows: the cart list, the order summary after
// Checkout, the thank-you message after "Confirm order", or the message for
// a Checkout with an empty cart.
type CartView = 'cart' | 'summary' | 'confirmed' | 'empty';

const Cart = () => {
  const { products, total, isOpen, openCart, closeCart, clearCart } = useCart();
  const [view, setView] = useState<CartView>('cart');

  // Focus moves only after a shopper's click: the click handlers set this,
  // and the effect below focuses the new view, then clears it. Opening or
  // closing the panel and adding a product move no focus.
  const pendingFocus = useRef(false);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const checkoutRef = useRef<HTMLButtonElement>(null);
  const previousQuantity = useRef(total.productQuantity);

  useEffect(() => {
    if (!pendingFocus.current) return;
    pendingFocus.current = false;

    if (view === 'cart') {
      checkoutRef.current?.focus();
    } else {
      headingRef.current?.focus();
    }
  }, [view]);

  // Closing the panel goes back to the cart list.
  useEffect(() => {
    if (!isOpen) setView('cart');
  }, [isOpen]);

  // Adding a product (from a card) goes back to the cart list. A falling
  // count does not, so "Confirm order" emptying the cart keeps the thank-you
  // message on screen.
  useEffect(() => {
    if (total.productQuantity > previousQuantity.current) setView('cart');
    previousQuantity.current = total.productQuantity;
  }, [total.productQuantity]);

  const showView = (nextView: CartView) => {
    pendingFocus.current = true;
    setView(nextView);
  };

  const handleCheckout = () =>
    showView(total.productQuantity ? 'summary' : 'empty');

  const handleBackToCart = () => showView('cart');

  const handleConfirmOrder = () => {
    clearCart();
    showView('confirmed');
  };

  const handleToggleCart = (isOpen: boolean) => () =>
    isOpen ? closeCart() : openCart();

  const installment = cartInstallment(total);

  return (
    <S.Container $isOpen={isOpen}>
      <S.CartButton onClick={handleToggleCart(isOpen)}>
        {isOpen ? (
          <span>X</span>
        ) : (
          <S.CartIcon>
            <S.CartQuantity title="Products in cart quantity">
              {total.productQuantity}
            </S.CartQuantity>
          </S.CartIcon>
        )}
      </S.CartButton>

      {isOpen && (
        <S.CartContent>
          <S.CartContentHeader>
            <S.CartIcon $large>
              <S.CartQuantity>{total.productQuantity}</S.CartQuantity>
            </S.CartIcon>
            <S.HeaderTitle>Cart</S.HeaderTitle>
          </S.CartContentHeader>

          {view === 'cart' && <CartProducts products={products} />}

          {view === 'summary' && (
            <CheckoutSummary
              headingRef={headingRef}
              onConfirm={handleConfirmOrder}
              onBack={handleBackToCart}
            />
          )}

          {view === 'confirmed' && (
            <CheckoutMessage
              headingRef={headingRef}
              heading="Order confirmed — great picks!"
              body="Thanks for shopping with us! We hope you love what you picked."
              linkText="Keep shopping"
            />
          )}

          {view === 'empty' && (
            <CheckoutMessage
              headingRef={headingRef}
              heading="Your cart is empty — let's find you something you'll love."
              linkText="Back to the store"
            />
          )}

          {/* Kept mounted (only hidden) outside the cart view, so the Checkout
              button's autoFocus does not fire again on "Back to cart". */}
          <S.CartFooter hidden={view !== 'cart'}>
            <S.Sub>SUBTOTAL</S.Sub>
            <S.SubPrice>
              <S.SubPriceValue>{cartSubtotal(total)}</S.SubPriceValue>
              <S.SubPriceInstallment>
                {installment ? <span>{installment}</span> : null}
              </S.SubPriceInstallment>
            </S.SubPrice>
            <S.CheckoutButton
              ref={checkoutRef}
              onClick={handleCheckout}
              autoFocus
            >
              Checkout
            </S.CheckoutButton>
          </S.CartFooter>
        </S.CartContent>
      )}
    </S.Container>
  );
};

export default Cart;
