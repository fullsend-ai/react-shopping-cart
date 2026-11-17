# Constraints

These are the store's hard limits today. A feature request that needs one of
them lifted is not a small change: it means new infrastructure or a
different product. Feasibility reviews should reject it or send it back as a
larger initiative. Example: "let employees pay with recognition points" needs
payments, accounts and a backend, so it is out of scope.

Requests that work inside these limits are in scope. That covers adding
products, new filters on existing fields, display changes to the product card
or cart, and copy changes.

## Platform

| Constraint                   | What it means                                                                                                                                                                                   | Evidence                                                         |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| **No backend**               | No server, API or database. The site is static files on Firebase Hosting. Anything that needs to store or share data between visitors is out of scope.                                          | `firebase.json` (static `build/` folder), no API calls in `src/` |
| **Catalog is static**        | Products live in `src/static/json/products.json` and are built into the bundle. No admin UI or live catalog updates. A product change is a PR and a redeploy.                                   | `src/services/products.ts`                                       |
| **No user accounts or auth** | No sign-in, profiles, wish lists, order history or per-user prices.                                                                                                                             | no auth code in `src/`                                           |
| **TypeScript 4.9**           | `react-scripts` 5 needs the TypeScript 4.x compiler API. Do not use TypeScript 5+ features (for example `NoInfer`, `const` type parameters).                                                    | [`AGENTS.md`](../../AGENTS.md)                                   |
| **Content Security Policy**  | Scripts may come only from the site itself and Google Tag Manager (inline scripts and styles are allowed: `'unsafe-inline'`). Fetches may go only to the site itself, Google Tag Manager and Google Analytics. A new third-party widget or API needs a `firebase.json` change. | `firebase.json`                                                  |

## Commerce

| Constraint                         | What it means                                                                                                                                                                                                        | Evidence                                   |
| ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------ |
| **No payments or checkout**        | "Checkout" shows an `alert()` with the subtotal. No payment provider, no points, no orders.                                                                                                                          | `src/components/Cart/Cart.tsx`             |
| **No inventory**                   | No stock levels, per-size availability or "sold out" state. A listed size is always shown as available.                                                                                                              | `IProduct` in `src/models/index.ts`        |
| **No order rules**                 | No quantity caps, minimum orders, made-to-order terms, lead times or "request product" flows. Store pages that have them are listed without them (TSTAPP-2, TSTAPP-4, TSTAPP-5).                                     | `IProduct`                                 |
| **USD only**                       | Every price is stored and shown in US dollars. Prices from other currencies are converted once, when the product is added. See [`decisions/0001-eur-to-usd.md`](decisions/0001-eur-to-usd.md). No currency switcher. | `useCartTotal.ts` hard-codes `USD` / `$`   |
| **No shipping or tax calculation** | "Free shipping" is a badge, not a cost. The subtotal has no shipping, tax or discount lines.                                                                                                                         | [`components/cart.md`](components/cart.md) |
| **No cart persistence**            | The cart is in memory. A reload empties it, and it is not shared between tabs or devices.                                                                                                                            | `CartContextProvider.tsx` (`useState`)     |

## Catalog vocabulary

| Constraint                     | What it means                                                                                            | Evidence                                                           |
| ------------------------------ | -------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| **Fixed size vocabulary**      | XS, S, M, ML, L, XL, XXL. It is not extended for new products. Other store sizes map to the closest one. | [`decisions/0002-size-mapping.md`](decisions/0002-size-mapping.md) |
| **Brand is derived from text** | No brand field. The Red Hat filter matches words in the title or description.                            | [`components/filter.md`](components/filter.md)                     |
| **Single locale**              | English UI with hard-coded strings and `$` formatting. No translations.                                  | `src/components/`                                                  |
