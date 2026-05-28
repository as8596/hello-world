# Little Hollow — Landing Page

> Cozy worlds. Timeless stories. Tiny wonders.

Marketing landing page for **Little Hollow**, a collectible blind-box toy brand
that also sells themed merchandise and apparel. Built with Next.js (App Router)
and styled directly from the brand guidelines.

## Features

- **Brand-faithful design system** — the six brand colors, three typographic
  roles (Fraunces / Nunito / Caveat via `next/font`), and decorative SVG
  iconography are wired through CSS custom properties in `app/globals.css`.
- **Landing sections** — hero, featured blind-box series, "how blind boxes
  work", brand values, filterable merch & apparel grid, new-drop banner, and
  newsletter signup.
- **Mock shop interactions (front-end only)** — working add-to-cart with a
  header count badge, a slide-out cart drawer with quantity steppers and
  subtotal, product quick-view modals, and a client-side merch category filter.
  Cart state persists to `localStorage`. No backend or payments.

## Getting started

```bash
npm install
npm run dev      # http://localhost:3000
```

Other scripts: `npm run build` (production build) and `npm run start` (serve the
build).

## Project structure

```
app/            # layout (fonts, providers, header/footer), page composition, globals.css
components/     # Header, Hero, FeaturedSeries, MerchGrid, ProductCard, QuickViewModal,
                # CartDrawer, Newsletter, Footer, Icon, Button, PlaceholderImage, …
context/        # CartContext (useReducer + localStorage), UIContext (modal/drawer state)
lib/            # types, sample product/series data, price formatter
public/products # drop real product photos here to replace the styled placeholders
```

## Swapping in real product photos

Imagery currently uses styled placeholder cards (brand gradient + icon + label).
To use a real photo, add an `imageSrc` to the relevant entry in
`lib/products.ts` (e.g. `imageSrc: "/products/forest-folk.jpg"`) and drop the
file into `public/products/`. `components/PlaceholderImage.tsx` renders the photo
automatically when `imageSrc` is present.
