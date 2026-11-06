# OFFERS أوفرس — UAE offers app (clickable prototype)

A mobile-first, Arabic (RTL) prototype of an app that collects store offers across all
seven emirates and compares basket prices between stores.

**Run it with real data (server):** needs Node.js 22.5 or newer, no packages to install.

```bash
cd offers-app
ADMIN_EMAIL=you@example.com ADMIN_PASSWORD='choose-a-strong-one' npm start   # http://localhost:8080
npm test                                                                      # server tests
```

- Shopper app: `http://localhost:8080/`  ·  Admin panel: `http://localhost:8080/admin`
- The first run creates the database (`server/data/offers.db`), the stores, the admin account, and demo offers.
  Remove the demo offers before launch: `npm run clear-demo`.
- Import a file of offers into the review queue: `npm run import -- server/seed/researched-offers.json`

**Put it online:** see [DEPLOY.md](DEPLOY.md) (Render in about 15 minutes, or any Docker host).

**Run it without a server:** open `index.html` (or `offers-preview.html`) in any browser; it uses the built-in demo data. Best viewed at phone width
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

## Where prices come from
Every price is an offer row with a store, a date range, the emirates it covers, a source and a status.

| Source | Who enters it | Goes live |
|---|---|---|
| Store's own offers (`merchant`) | Stores sign up in the app (حسابي → تسجيل المتاجر) | After an admin approves |
| Weekly flyers / store websites (`flyer`, `admin`) | Your team, in the admin panel, with the source link | Immediately |
| Data files from stores (`feed`) | Admin panel | Immediately |
| Researched offers (`research`) | `npm run import` or the admin panel's import | After an admin approves |

The app only shows offers that are approved, have started, and have not ended, filtered by the shopper's emirate.
The product page shows the source and last-updated date.

`server/seed/researched-offers.json` holds offers found through web search on 2026-11-06 (IKEA, amazon.ae, Carrefour).
They come from search snippets, not live pages, so check each one against its source link before approving.
Most end on 11–12 Nov 2026.

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
- `admin.html`, `admin.js` – admin panel
- `server/` – API, database, sign-in, tests, import tool
- `styles.css` – design (purple/orange theme)
- `data.js` – **demo data** (sample prices, not real retailer data)
- `app.js` – screens, routing, compare logic, merchant flow

## Next steps for a production app
1. **Native app**: port these screens to Flutter or React Native (iOS + Android).
2. ~~Backend~~ done (`server/`). Still to add: Google/Apple sign-in, password reset, image upload, sign-in rate limiting.
3. ~~Hosting~~ ready: Dockerfile + Render blueprint, daily backups (see DEPLOY.md).
4. **Data feeds**: partnerships / merchant uploads for prices (scraping retailers usually breaks their terms).
5. Push notifications, English language toggle, maps for branches, analytics.
6. Get permission from each retailer before showing their logo in the published app.
