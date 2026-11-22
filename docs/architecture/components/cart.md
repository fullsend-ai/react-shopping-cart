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

- the `{sku}-1-cart.webp` thumbnail, or for a line with a color, the
  `{sku}-N-cart.webp` that the product's `colorImages` maps that color to
  ([catalog images](catalog.md#product-images))
- the title
- the parts that are present, joined with `" | "`: the first size, the chosen
  color and the style. Apparel shows `"{first size} | {style}"` (for example
  `"S | RHNL-032"`). A size-less product skips the size, and an empty style is
  skipped too, so the TSTAPP-6 bottle shows just `"Black"` or `"White"`. The
  line never prints `undefined`
  ([decision 0004](../decisions/0004-size-optional.md)).
- `Quantity: N`
- the unit price and − / + buttons. − is disabled at quantity 1. The ×
  button removes the line. The three buttons have accessible names that
  include the color and title (for example "Increase Black {title}
  quantity"), because one product can have several lines.

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
- The radios have the card's `tabIndex` (1), so Tab reaches them right after
  their own card and Shift+Tab returns to it; Enter there adds the chosen
  color.
- A visually hidden polite status announces the chosen color and that
  adding is now possible.
- The choice is card state. It stays chosen after adding and resets only when
  the card unmounts.
- Choosing a color switches the card image to that color's image (from
  `colorImages`), on the front and on hover. Before a color is chosen, the
  card shows image 1 with image 2 on hover.
- The cart line gets the chosen `color`, and each color is its own line. Its
  thumbnail is the color's `{sku}-N-cart.webp` from `colorImages` (the
  bottle: Black `-1-cart`, White `-2-cart`), and the line text names the
  color. There are no per-color SKUs, stock or color filter.
- The card is a flex column with the price and "Add to cart" at the bottom,
  so the color picker and hint do not push its button below the buttons of
  the other cards in the row.

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

Checkout stays inside the cart panel (TSTAPP-8). There is no browser
`alert()`. The panel shows one view at a time:

- **Order summary**
  ([`CheckoutSummary`](../../../src/components/Cart/CheckoutSummary/CheckoutSummary.tsx)),
  after Checkout with items in the cart. It lists each line read-only (title,
  the cart line's `" | "` description, `Quantity: N` and the line price),
  then the subtotal and installment info, computed the same way as the cart
  (`src/utils/cartLine.ts`). It has **Confirm order** and **Back to cart**
  buttons. Quantities are changed in the cart, not here.
- **Order confirmed**
  ([`CheckoutMessage`](../../../src/components/Cart/CheckoutMessage/CheckoutMessage.tsx)),
  after Confirm order. Confirming empties the cart (`clearCart()`) and shows
  "Order confirmed — great picks!" with a **Keep shopping** link to `/`.
- **Empty cart** (also `CheckoutMessage`), after Checkout with an empty cart.
  It shows "Your cart is empty — let's find you something you'll love." with
  a **Back to the store** link to `/`, and no Confirm order.

The view is not persisted. It goes back to the cart list when the panel
closes or when a product is added. The cart footer (subtotal and Checkout)
is hidden outside the cart list view.

Confirm order records nothing: there is no payment, no order and no
confirmation email ([constraints](../constraints.md#commerce)).
