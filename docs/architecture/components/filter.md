# Filter

The sidebar has two groups of checkboxes: **Sizes** and **Brand**
([`src/components/Filter/Filter.tsx`](../../../src/components/Filter/Filter.tsx)).
Filtering runs in the browser over the static catalog
([`useProducts.tsx`](../../../src/contexts/products-context/useProducts.tsx)).
The header shows "N Product(s) found".

## Size vocabulary

```ts
export const availableSizes = ['XS', 'S', 'M', 'ML', 'L', 'XL', 'XXL'];
```

These seven sizes are the whole vocabulary, in this display order. It is
**not extended** for new products. A store size that is not in the list maps
to the closest one, even if two store sizes then show as one
([decision 0002](../decisions/0002-size-mapping.md)). For example, 3XLarge
maps to `XXL`.

New products must use only these values. A product with no size uses
`availableSizes: []` ([decision 0004](../decisions/0004-size-optional.md)).

Older catalog entries also use `X`, which is not in the vocabulary, so no
checkbox selects it. Leave those entries as they are unless a story asks
to change them.

## Brand filter

```ts
export const availableBrands = ['Red Hat'];
```

Added by TSTAPP-1 (PR #96). The catalog has no brand field. A product matches
a brand when the brand name appears **as whole words, case-insensitively, in
the title or the description** ([`src/utils/matchesBrand.ts`](../../../src/utils/matchesBrand.ts)).
"Red Hat" matches "red hat logo" and "(Red Hat)" but not "Bored Hat" or
"Red Hatchback". The title and description are checked separately, so a
match cannot span both.

To put a product under the Red Hat filter, write "Red Hat" into its
description (for example "Red Hat logo embroidery"). TSTAPP-2 ("Red Hat logo
embroidery") and TSTAPP-3 ("Red Hat logo print") did this. A new brand is a new entry in `availableBrands`.

## How the filters combine

- **Within a group: OR.** Selecting S and XL shows products that have S or XL.
- **Between groups: AND.** A product must match one of the selected sizes
  **and** one of the selected brands.
- **Empty group = no filter.** With no size selected, every product passes the
  size check, including products with `availableSizes: []`. With any size
  selected, a product with no sizes is excluded.

Each toggle re-reads the catalog and applies both groups. `filterProducts`
changes sizes and keeps the brand selection. `filterProductsByBrand` does the
reverse.

There is no free-text search, sort, price filter or category filter.
