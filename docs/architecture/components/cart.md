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
- the parts that are present, joined with `" | "`: the first size, the chosen
  color and the style. Apparel shows `"{first size} | {style}"` (for example
  `"S | RHNL-032"`). A size-less product skips the size, and an empty style is
  skipped too, so the TSTAPP-6 bottle shows just `"Black"` or `"White"`. The
  line never prints `undefined`
  ([decision 0004](../decisions/0004-size-optional.md)).
- `Quantity: N`
- the unit price and − / + buttons. − is disabled at quantity 1. The ×
  button removes the line.

A product appears once per color, and adding it again increases the quantity.
Lines are matched by product `id` and `color`. Products without colors have
no `color`, so they match on `id` alone. The cart list keys each line by
`id` and `color`. The shopper **does not choose a size**: the line shows the
product's first listed size. Per-line size choice would be a new feature
across the card, the cart model and the cart line.

## Color choice

A product with `availableColors` ([catalog](catalog.md#product-schema)) shows
a "Color" radio group on its card, with nothing preselected (TSTAPP-6, the
first product with colors).

- Until a color is chosen, "Add to cart" is disabled and described by a
  visible "Choose a color" hint, and Enter or Space on the card adds nothing.
- The radios keep their native keys (arrows move, Space selects). Their key
  events do not reach the card, so choosing a color never adds to the cart.
- The choice is card state. It stays chosen after adding and resets only when
  the card unmounts.
- The cart line gets the chosen `color`, and each color is its own line. Every
  line uses the product's single `-1-cart` thumbnail; the line text names the
  color. There are no per-color images, SKUs, stock or color filter.

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
