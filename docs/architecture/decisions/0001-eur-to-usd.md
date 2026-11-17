# 0001: Convert EUR prices to USD at the ECB rate, with no retail rounding

**Status:** accepted · **Source:** TSTAPP-2, TSTAPP-3, TSTAPP-4

## Context

The catalog is USD only ([constraints](../constraints.md#commerce)). The
products come from a store that lists prices in euros.

## Decision

- Convert the euro price once, when the product is added, at the **ECB
  reference rate** for a stated date (fetched via frankfurter.dev).
- Round to the cent, and store that value. **Do not re-round** to a
  retail-looking price ($48.99, $49.00).
- Record the rate, its date and the calculation in the story.

| Story    | EUR    | Rate (date)         | Calculation | Stored `price` |
| -------- | ------ | ------------------- | ----------- | -------------- |
| TSTAPP-2 | €44.00 | 1.1052 (2026-11-13) | 48.6288     | `48.63`        |
| TSTAPP-3 | €32.50 | 1.1052 (2026-11-13) | 35.9190     | `35.92`        |
| TSTAPP-4 | €35.00 | 1.1014 (2026-11-16) | 38.5490     | `38.55`        |

## Consequences

- Prices do not follow the exchange rate. When the euro price or the rate
  moves, the stored value is the number to revisit, in a new story.
- A product whose store page has no price (made-to-order, "request
  product") gets a USD price set by the requester, with no conversion. The
  story must say so (TSTAPP-5: $40.00).
- No currency selector or live conversion. Both would need a backend or a
  third-party API, which the CSP does not allow.
