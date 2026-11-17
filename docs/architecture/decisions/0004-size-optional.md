# 0004: Size is optional

**Status:** accepted · **Source:** TSTAPP-5

## Context

Not every product has a size: a backpack has none. `availableSizes` is a
`string[]`, so the type already allows `[]`. The question was whether a
product may have no size at all.

## Decision

`availableSizes` **may be an empty array**. A size is not required for a
catalog entry. Nothing is added to the size vocabulary for products that
have no size.

## Consequences

- **Filtering:** with no size selected, a product with no sizes is listed.
  With any size selected, it is excluded
  ([filter](../components/filter.md#how-the-filters-combine)). This is the
  intended behaviour and is covered by tests.
- **Cart line:** shows only the `style` (for example `RHNLOD-044`), not
  `"{first size} | {style}"`. It must never print `undefined`
  ([cart](../components/cart.md#cart-line)).
- **Product card:** unaffected. It does not show sizes.
- Any new UI that reads `availableSizes` must handle `[]`.
