# Cart

A floating cart on the right of the page
([`src/components/Cart/Cart.tsx`](../../../src/components/Cart/Cart.tsx)),
backed by the cart context
([`src/contexts/cart-context/`](../../../src/contexts/cart-context/)). Clicking
"Add to cart" (or pressing Enter or Space on a focused card) adds one unit and
opens the cart.

State is held in React `useState` only. Reloading the page empties the cart.

## Cart line

[`CartProduct.tsx`](../../../src/components/Cart/CartProducts/CartProduct/CartProduct.tsx)
renders one line per product:

- the `{sku}-1-cart.webp` thumbnail ([catalog images](catalog.md#product-images))
- the title
- `"{first size} | {style}"`. For a product with no sizes,
  [decision 0004](../decisions/0004-size-optional.md) requires just
  `"{style}"`, but that is **not implemented yet**: today the line prints
  `"undefined | {style}"` (`CartProduct.tsx` always reads `availableSizes[0]`).
  The first story that adds a size-less product must fix it.
- `Quantity: N`
- the unit price and − / + buttons. − is disabled at quantity 1. The ×
  button removes the line.

A product appears once, and adding it again increases the quantity. Lines are
matched by product `id`. The shopper **does not choose a size**: the line shows the
product's first listed size. Per-line size choice would be a new feature
across the card, the cart model and the cart line.

## Subtotal

`useCartTotal` recalculates on every change:

- `productQuantity`: the total number of units (shown on the cart badge)
- `totalPrice`: the sum of `price × quantity`
- `currencyId` / `currencyFormat`: always `USD` / `$`

Prices are shown with two decimals (`src/utils/formatPrice.ts`). There is no
tax, discount, coupon or shipping line.

## Free shipping

`isFreeShipping` only shows a "Free shipping" badge on the product card. The
cart does not show or charge shipping, and no product has a shipping cost.
"Free shipping over $X" or shipping fees would need a new pricing rule in the
cart total.

## Installments

- **Product card:** when `installments > 0`, shows `or N x $price/N`.
- **Cart:** shows `OR UP TO N x $subtotal/N`, where N is the **largest**
  `installments` of any line. Lines with `0` don't lower it. When every line
  has `0`, the installment line is hidden.

Installments are display only: no interest, no payment plan, nothing is
charged.

## Checkout

The Checkout button shows an `alert()` with the subtotal, or "Add some
product in the cart!" when the cart is empty. There is no checkout flow
([constraints](../constraints.md#commerce)).
