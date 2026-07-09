# 2026 B/CS Breakfast Taco Tour

A mobile-first Progressive Web App for a small private group rating breakfast taco restaurants around Bryan/College Station, TX.

## Features

- Score restaurants with reviewer name, date, order, price, photo, review, quote, ratings, and awards.
- Weighted overall score: Taste 50%, Customer Service 20%, Atmosphere 15%, Value 15%.
- Taco breakdown ratings for tortilla, salsa, filling quality, and taco balance.
- Leaderboard averages only submitted reviews for each restaurant.
- Restaurant profiles with averages, photos, reviews, and awards.
- Awards board, gallery, and JSON export/import backup.
- Works immediately with localStorage; no accounts or cloud setup required.
- Installable PWA with manifest and app icon.

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000` on your phone or computer. For iPhone testing, use the same Wi-Fi network and open the local network URL shown by Next.js.

## Build

```bash
npm run build
npm start
```

## Deploy to Vercel

1. Push this repo to GitHub.
2. Import it at https://vercel.com/new.
3. Keep the default Next.js settings.
4. Deploy.

## Deploy to Netlify

1. Push this repo to GitHub.
2. Import it in Netlify.
3. Build command: `npm run build`
4. Publish directory: `.next`
5. Use Netlify's Next.js runtime/plugin if prompted.

## Data notes

The app currently stores reviews in browser localStorage under `bcs-breakfast-taco-tour-v1`. Use **Settings/Backup → Export JSON** after each taco stop, then import that JSON on another device if needed.

The data logic is isolated in `lib/tacoData.ts` so Firebase or Supabase syncing can be added later without changing the UI heavily.

## Starter restaurant

The starter data includes Jesse’s Taqueria in Bryan.
