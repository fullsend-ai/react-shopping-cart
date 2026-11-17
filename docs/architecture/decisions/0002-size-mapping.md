# 0002: Map store sizes to the closest vocabulary size; never extend the vocabulary

**Status:** accepted · **Source:** TSTAPP-2 (decided as option B), applied in
TSTAPP-3 and TSTAPP-4

## Context

The size filter offers seven sizes: XS, S, M, ML, L, XL, XXL
([filter](../components/filter.md#size-vocabulary)). Store products offer
other sizes, for example 3XLarge. Adding `XXXL` would add a checkbox every
shopper sees, and change the filter's tests and snapshots.

## Decision

A store size with an exact entry maps to it. A store size with **no exact
entry is replaced by the closest vocabulary size**. The vocabulary in
`src/components/Filter/Filter.tsx` is **not extended**.

| Store size | Catalog size                            |
| ---------- | --------------------------------------- |
| Small      | `S`                                     |
| Large      | `L`                                     |
| XLarge     | `XL`                                    |
| 2XLarge    | `XXL`                                   |
| 3XLarge    | `XXL` (closest, collapses onto 2XLarge) |

Remove duplicates after mapping. For TSTAPP-2, Small, 2XLarge and 3XLarge
became `["S", "XXL"]`.

## Consequences

- Accepted trade-off: the card can show fewer sizes than the store offers,
  and collapsed sizes look the same in the UI.
- A new product's test checks that every size is in the vocabulary (no
  `XXXL`).
- A story that asks for a new filter size is a change to this decision, not
  a catalog change.
