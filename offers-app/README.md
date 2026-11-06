# OFFERS أوفرس — UAE offers app (clickable prototype)

A mobile-first, Arabic (RTL) prototype of an app that collects store offers across all
seven emirates and compares basket prices between stores.

**Run it:** open `index.html` in any browser (no build step). Best viewed at phone width
or on a phone; it can be added to the home screen (PWA manifest included).

## Screens
| Screen | What it does |
|---|---|
| Splash | Brand intro |
| Home (الرئيسية) | Emirate picker, search, category grid, rotating offer banners, top savings |
| Category | Sub-categories (groceries), category chips, sort by discount/price |
| Product detail | Discount badge, old/new price, validity, price in every store (cheapest highlighted), share, similar products |
| Stores (المتاجر) | Search + filter by type, favourite stores, per-store offer list |
| Favourites (المفضلة) | Saved offers and stores |
| Compare (قارن) | Basket price comparison table across stores, quantities, best single store vs. cheapest multi-store total |
| Account / merchant | Feature list, merchant sign-up (4 steps), store dashboard, **add new offer** form (published offers appear in the app) |

State (favourites, basket, merchant offers) is kept in the browser's localStorage.

## Store logos and product photos
- Stores use their real names. Each store in `data.js` can have a `logo:` path. Carrefour, IKEA and amazon logos are
  included (from the open Simple Icons set); the others show a coloured name badge until you add their logo file.
- To add a logo: put the file in `assets/logos/` (PNG or SVG, e.g. `lulu.png`) and add `logo: "assets/logos/lulu.png"`
  to that store in `data.js`. Use the logo files each retailer gives you (brand kit / partner agreement).
- Product photos: put a photo in `assets/products/` and add `img: "assets/products/p1.jpg"` to the product.
  Without a photo the product shows a matching icon.
- All screen icons are from Lucide (ISC licence) and are in `icons.js`.

## Files
- `index.html` – shell
- `offers-preview.html` – the whole app in one file (open directly)
- `icons.js` – icon set
- `assets/` – logos and product photos
- `styles.css` – design (purple/orange theme)
- `data.js` – **demo data** (sample prices, not real retailer data)
- `app.js` – screens, routing, compare logic, merchant flow

## Next steps for a production app
1. **Native app**: port these screens to Flutter or React Native (iOS + Android).
2. **Backend**: database + API for stores, branches, products, offers; merchant auth (email/Google/Apple).
3. **Admin review** of merchant offers before publishing; image upload.
4. **Data feeds**: partnerships / merchant uploads for prices (scraping retailers usually breaks their terms).
5. Push notifications, English language toggle, maps for branches, analytics.
6. Get permission from each retailer before showing their logo in the published app.
