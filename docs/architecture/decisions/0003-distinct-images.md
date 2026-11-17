# 0003: Front and back product images must differ

**Status:** accepted · **Source:** TSTAPP-2, applied in TSTAPP-3, TSTAPP-4,
TSTAPP-5

## Context

Each product needs three images: `{sku}-1-product.webp` (card),
`{sku}-2-product.webp` (shown when the card is hovered) and
`{sku}-1-cart.webp` (cart thumbnail). See
[catalog images](../components/catalog.md#product-images). Store pages often
have a single photo, and the easy fix of copying it into both product slots
makes the hover do nothing.

## Decision

- `-1-product` and `-2-product` must **not be byte-identical**.
- When the store has two or more photos, use two different ones (TSTAPP-5:
  exterior front and interior view).
- When it has one photo, make `-2-product` a **distinct zoomed crop** of it,
  for example the Red Hat logo, a zip or collar, or a pocket. Never present a
  copy of the front as a back view.
- `-1-cart` is the front, downscaled.
- If a real back view is added to the story later, it takes the
  `-2-product` slot.

## Consequences

- A new product's test compares the checksums of `-1-product` and
  `-2-product` (see the Craghoppers block in `Product.test.tsx`).
- The images ship in the same PR as the catalog entry. A missing one blanks
  the store at runtime.
