# UI shell

The page frame around the catalog and the cart: header, loader, GitHub
corner, the two-column layout, the theme, and the shared checkbox the filters
use.

## Layout

[`src/components/App/App.tsx`](../../../src/components/App/App.tsx) renders, in
order:

```
Container
  Loader          only while isFetching
  GithubCorner    corner link, top-left of the page
  Header          Red Hat logo, centred
  TwoColumnGrid   <main>, max-width 1200px
    Side          Filter (Sizes, Brand)
    Main
      MainHeader  "N Product(s) found"
      Products    product card grid
  Cart            floating, outside the grid
```

- **TwoColumnGrid** ([`App/style.ts`](../../../src/components/App/style.ts)) is
  one column on phones, and `1fr 4fr` (sidebar and products) from the
  `tablet` breakpoint up.
- **Products** grid ([`Products/style.ts`](../../../src/components/Products/style.ts)):
  2 columns, 3 from `tablet`, 4 from `desktop`.
- **Cart** sits outside the grid as a fixed panel that opens over the page
  ([cart](cart.md)).

There is no router, no other page and no footer. The app is a single view.

## Components

| Component      | File                                  | What it does                                                                                                                                                                                        |
| -------------- | ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Header`       | `src/components/Header/`              | Shows `src/static/red-hat-logo.svg` (alt "Red Hat"), centred, 40px high. No navigation, search or account menu.                                                                                     |
| `Loader`       | `src/components/Loader/`              | A fixed, centred spinner over the page while `isFetching` is true, which is during the initial load and after every filter toggle.                                                                  |
| `GithubCorner` | `src/components/Github/GithubCorner/` | The octocat corner link, an absolutely positioned SVG at the top-left (mirrored). It points to the **upstream** repo `jeffersonRibeiro/react-shopping-cart`, not `fullsend-ai/react-shopping-cart`. |
| `Checkbox`     | `src/commons/Checkbox/`               | The shared filter checkbox. See below.                                                                                                                                                              |

## Theme

[`src/commons/style/theme.ts`](../../../src/commons/style/theme.ts) is the only
source of design tokens. Read them as `theme.colors.*` and
`theme.breakpoints.*` in `styled-components`:

| Token                                       | Value                                          |
| ------------------------------------------- | ---------------------------------------------- |
| `colors.primary`                            | `#1b1a20` (near-black: buttons, checked state) |
| `colors.secondary`                          | `#eabf00` (yellow: hover, focus outline)       |
| `breakpoints.mobile` / `tablet` / `desktop` | `480px` / `768px` / `1025px`                   |

`global-style.tsx` sets the body font (system font stack) and removes the
body margin. `public/normalize.css` is loaded from `index.html`. Styles live
in a `style.ts` next to each component, imported as `* as S`. There is no CSS
framework and no component library.

## Shared checkbox

[`src/commons/Checkbox/Checkbox.tsx`](../../../src/commons/Checkbox/Checkbox.tsx)
takes `label`, `handleOnChange(label)` and an optional `className`. It renders a
hidden `<input type="checkbox">` with a styled `<span class="checkmark">`
label.

- It keeps its **own** checked state (`useState(false)`). The filter context
  does not control it. So the checkboxes cannot be cleared or preset from
  outside, for example by a "Clear filters" button or a filter read from a
  URL. Either one means making the checkbox controlled (a `checked` prop).
- [`Filter/style.ts`](../../../src/components/Filter/style.ts) styles it two
  ways. `S.Checkbox` is the round, 35px size chip. `S.BrandCheckbox` extends
  it into a pill that grows with longer labels.

## What to reuse

- **A new filter group:** add a values list next to `availableSizes` and
  `availableBrands` in `Filter.tsx`, render it with `S.BrandCheckbox` for word
  labels or `S.Checkbox` for short codes, under its own `S.Title`. Add its
  state to the products context and its match function to `useProducts`, and
  combine it with AND like the others ([filter](filter.md#how-the-filters-combine)).
  Do not add a second checkbox component.
- **A layout change:** use the theme breakpoints and colours rather than new
  literals, keep the sidebar in `S.Side`, and keep the cart outside the grid.
- **New copy or a banner:** the header holds only the logo today. Put
  page-level text in `MainHeader` or a new component in `App`.
- **Accessibility:** product cards are focusable, and Enter or Space adds to
  the cart. Focus states use `colors.secondary`. Keep both for new
  interactive elements.
