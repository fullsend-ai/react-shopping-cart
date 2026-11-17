# Architecture

React Shopping Cart is a single-page storefront demo. It shows a product
catalog, lets a shopper filter it by size and brand, and keeps a floating cart
with a subtotal. There is no server: the whole store is a static bundle.

This folder is the architecture context that the planning agents read before
work is written or coded (feature requests are reviewed for feasibility against
it, and implementation plans are written from it). Start here, then read
[`constraints.md`](constraints.md) for what the store does **not** do.

| Document                                           | What it covers                                                                           |
| -------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| [`constraints.md`](constraints.md)                 | Hard limits. Ideas that break one are out of scope.                                      |
| [`components/catalog.md`](components/catalog.md)   | `products.json` schema, id and SKU rules, product images                                 |
| [`components/filter.md`](components/filter.md)     | Size and brand filters and how they combine                                              |
| [`components/cart.md`](components/cart.md)         | Cart line, subtotal, free shipping, installments                                         |
| [`components/ui-shell.md`](components/ui-shell.md) | Page layout, header, loader, theme, shared checkbox, what to reuse                       |
| [`delivery.md`](delivery.md)                       | Jira → agents → PR → merge, workflows, auto-merge rules, hosting (not deployed on merge) |
| [`decisions/`](decisions/)                         | Business rules settled in Jira (TSTAPP)                                                  |

## Stack

- **Create React App** (`react-scripts` 5) with **TypeScript 4.9**, React 19
  and `styled-components` 6. TypeScript cannot move to 5.x while CRA stays;
  see [`AGENTS.md`](../../AGENTS.md).
- **Firebase Hosting** serves the `build/` folder as static files, with a
  catch-all rewrite to `index.html` and a Content-Security-Policy (inline scripts and styles allowed; see
  [constraints](constraints.md))
  ([`firebase.json`](../../firebase.json)). Google Analytics (gtag) is the only
  third-party script.
- Node.js 22.22.1 or later (`.nvmrc`: 24).

## How it fits together

```
src/index.tsx
  ThemeProvider
    ProductsProvider   (contexts/products-context)  products, size filters, brand filters
      CartProvider     (contexts/cart-context)      cart lines, open/closed, totals
        App
          Filter       components/Filter      size + brand checkboxes
          Products     components/Products    product cards (Product)
          Cart         components/Cart        floating cart (CartProducts > CartProduct)
```

- **Catalog.** `services/products.ts` reads
  [`src/static/json/products.json`](../../src/static/json/products.json) with a
  build-time `require()`. The catalog is compiled into the bundle, so changing a
  product means a code change and a redeploy. See
  [`components/catalog.md`](components/catalog.md).
- **State.** Two React contexts, no state library. `useProducts` filters the
  catalog in memory. `useCart` adds, removes and changes quantities and
  recomputes the total on every change. Nothing is persisted: a page reload
  empties the cart.
- **Images.** Product images are WebP files in `src/static/products/`, named by
  SKU and bundled by webpack.
- **Checkout** is a browser `alert()` showing the subtotal. There is no order,
  payment or confirmation step.

## Where to change things

| To change...            | Edit                                                                                                             |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Add or edit a product   | `src/static/json/products.json` + 3 images in `src/static/products/`                                             |
| Product data shape      | `src/models/index.ts` (`IProduct`)                                                                               |
| Filter options or logic | `src/components/Filter/Filter.tsx`, `src/contexts/products-context/useProducts.tsx`, `src/utils/matchesBrand.ts` |
| Product card            | `src/components/Products/Product/`                                                                               |
| Cart line, subtotal     | `src/components/Cart/`, `src/contexts/cart-context/`                                                             |
| Price formatting        | `src/utils/formatPrice.ts`                                                                                       |

## Validation

The repo has no build or test CI. Run each of these and report the results in
the PR (see [`AGENTS.md`](../../AGENTS.md)):

```sh
npm ci
npm run typecheck
npm run build
CI=true npm test
```

Agent PRs are merged automatically after a clean review only when every changed
path is in the allowlist in `.github/workflows/auto-merge.yml`. A merge does not
deploy the site. See [`delivery.md`](delivery.md).
