# Catalog

The catalog is one JSON file,
[`src/static/json/products.json`](../../../src/static/json/products.json), with
the products under `data.products`. `src/services/products.ts` loads it with a
build-time `require()`. It has no backend, admin screen or database. Adding a
product is a PR that changes this file and adds three images.

## Product schema

Every entry has all eleven fields (`IProduct` in
[`src/models/index.ts`](../../../src/models/index.ts)):

| Field            | Type     | Rule                                                                                                                                                        |
| ---------------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`             | number   | Sequential. The next product takes the next free integer. Unique.                                                                                           |
| `sku`            | number   | Unique product code. It also names the image files. See [id and SKU rules](#id-and-sku-rules).                                                                            |
| `title`          | string   | Product name shown on the card and in the cart.                                                                                                             |
| `description`    | string   | Short copy (fabric, weight, decoration). Not shown on the card, but the brand filter reads it.                                                              |
| `availableSizes` | string[] | Sizes from the [filter vocabulary](filter.md#size-vocabulary). May be `[]` for products with no size ([decision 0004](../decisions/0004-size-optional.md)). |
| `style`          | string   | Store code or style name (for example `RHNL-032`). Shown in the cart line. May be `""`.                                                                     |
| `price`          | number   | USD, two decimals at most, never re-rounded to a retail price ([decision 0001](../decisions/0001-eur-to-usd.md)).                                           |
| `installments`   | number   | Number of payments shown as "or N x $…". `0` hides it.                                                                                                      |
| `currencyId`     | string   | Always `"USD"`.                                                                                                                                             |
| `currencyFormat` | string   | Always `"$"`.                                                                                                                                               |
| `isFreeShipping` | boolean  | Shows the "Free shipping" badge on the card.                                                                                                                |

Example (the Craghoppers fleece added by TSTAPP-2):

```json
{
  "availableSizes": ["S", "XXL"],
  "currencyFormat": "$",
  "currencyId": "USD",
  "description": "100% recycled microfleece, 205gsm, Red Hat logo embroidery",
  "id": 17,
  "installments": 0,
  "isFreeShipping": true,
  "price": 48.63,
  "sku": 4802531667943152,
  "style": "RHNL-032",
  "title": "Craghoppers Grey Half Zip Fleece"
}
```

The schema has no fields for stock, order limits, categories, brand, colour or
a product page URL. Adding one is a model change (`IProduct`, the test mocks,
and every product entry), not a data change.

New store products so far have used `isFreeShipping: true` and
`installments: 0`.

## Id and SKU rules

- **`id`** is a small sequential integer (0 to 18 today). A new product takes
  the next free id. Several open stories may "reserve" the same id, so check
  the file again when implementing. The change that merges second takes the
  next free id.
- **`sku`** must be unique. A **new** SKU must be a 16-digit integer at most
  `9007199254740991` (`Number.MAX_SAFE_INTEGER`). Most larger numbers are
  silently rounded when the JSON is parsed, so the image name the code builds
  would not match the file. The test should check that the SKU is a safe
  integer (`Number.isSafeInteger`), not just its digit count: a 16-digit
  number can still be over the limit.
- **Existing SKUs** are 15 to 17 digits, and 12 of the 19 are above the
  safe-integer limit. They happen to be exactly representable, so they parse
  unchanged and their images resolve. Do not renumber or "fix" them: the
  image files are named after them. Do not copy them as a pattern for new
  SKUs either.

## Product images

Each product needs three WebP files in `src/static/products/`, named by SKU:

| File                   | Used by                                    | Content                                                                                                    |
| ---------------------- | ------------------------------------------ | ---------------------------------------------------------------------------------------------------------- |
| `{sku}-1-product.webp` | product card (`Products/Product/style.ts`) | front view, full frame                                                                                     |
| `{sku}-2-product.webp` | product card on hover                      | back or alternate view. Must differ from the front ([decision 0003](../decisions/0003-distinct-images.md)) |
| `{sku}-1-cart.webp`    | cart line (`CartProduct.tsx`)              | front view, downscaled                                                                                     |

Match the size of existing images. Source photos from the store are usually
500×500 PNG or JPG and must be converted to WebP.

**All three files are required, and a missing one breaks the store at
runtime, not at build time.** The images are loaded with template-literal
`require()` calls. Webpack bundles every file in `src/static/products/` and
looks the name up when the card or cart line renders. A missing file throws
`Cannot find module` during render. The app has no error boundary, so the
whole page goes blank. `npm run build` still succeeds, and the shared test
suite does not catch it either. Only the per-product tests in
`Product.test.tsx` check that a product's images resolve. Every new product
should get such a test, and its images must ship in the same PR as its
catalog entry.

## Tests that count products

Some tests hard-code catalog totals (for example the brand-filter tests count
the products that match "Red Hat"). Adding a product can break them. Update
the counts and snapshots in the same PR.
