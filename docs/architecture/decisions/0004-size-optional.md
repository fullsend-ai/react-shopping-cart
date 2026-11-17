# 0004: Size is optional

**Status:** accepted · **Source:** TSTAPP-5, filtering amended by TSTAPP-6

## Context

Not every product has a size: a backpack has none. `availableSizes` is a
`string[]`, so the type already allows `[]`. The question was whether a
product may have no size at all.

## Decision

`availableSizes` **may be an empty array**. A size is not required for a
catalog entry. Nothing is added to the size vocabulary for products that
have no size.

## Consequences

- **Filtering:** a product with no sizes is listed whatever sizes are
  selected, including none
  ([filter](../components/filter.md#how-the-filters-combine)). This applies to
  every size-less product, with no per-product flag. TSTAPP-6 (SME answer,
  option A) amended it: before, a size-less product was excluded as soon as
  a size was selected. `matchesSizes` (`useProducts.tsx`) implements it, and
  the size-filter tests in `useProducts.test.tsx` and `Filter.test.tsx`
  cover it.
- **Cart line:** shows only the parts that are present, so no size for a
  size-less product: just the `style` (for example `RHNLOD-044`), or the
  chosen color when the style is empty. It never prints `undefined`
  ([cart](../components/cart.md#cart-line)). Implemented by TSTAPP-6.
- **Product card:** unaffected. It does not show sizes.
- Any new UI that reads `availableSizes` must handle `[]`.
