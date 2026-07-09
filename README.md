# 2026 B/CS Breakfast Taco Tour

A mobile-first Progressive Web App for a small private group rating breakfast taco restaurants around Bryan/College Station, TX.

## Features

- Score restaurants with reviewer name, date, order, price, review, quote, ratings, and awards.
- Weighted overall score: Taste 50%, Customer Service 20%, Atmosphere 15%, Value 15%.
- Taco breakdown ratings for tortilla, salsa, filling quality, and taco balance.
- Leaderboard averages only submitted reviews for each restaurant.
- Restaurant profiles with averages, reviews, and awards.
- Awards board and JSON export backup.
- Shared Supabase database so everyone using the same deployed URL sees the same restaurants, reviews, leaderboard, awards, and scores.
- Installable PWA with manifest and app icon.


## Supabase setup

### 1. Create the Supabase project

1. Go to https://supabase.com/dashboard/projects and select **New project**.
2. Choose an organization, enter a project name, set a database password, and select the closest region.
3. Wait for the project to finish provisioning.
4. In **Project Settings → API**, copy:
   - **Project URL**
   - **anon public** key

### 2. Create the tables

1. In the Supabase dashboard, open **SQL Editor**.
2. Paste the complete contents of `supabase/schema.sql`.
3. Click **Run**.

The schema creates:

- `restaurants`
- `reviews`
- `awards`
- `review_awards` for the many-to-many relationship between reviews and awards

The app stores restaurant, reviewer, date, order, price, Taste, Customer Service, Atmosphere, Value, Tortilla, Salsa, Filling Quality, Taco Balance, review text, quote, and selected awards. Every rating is stored on the current 1.0–10.0 scale with 0.1 increments.

### 3. Optional starter data

To pre-load the original starter restaurant, run this in Supabase SQL Editor after creating the schema:

```sql
insert into public.restaurants (name)
values ('Jesse’s Taqueria')
on conflict (name) do nothing;

with restaurant as (
  select id from public.restaurants where name = 'Jesse’s Taqueria'
), review as (
  insert into public.reviews (
    restaurant_id, reviewer_name, review_date, ordered, price,
    taste, service, atmosphere, value, tortilla, salsa, filling, balance,
    sentence_review, memorable_quote
  )
  select id, 'Tour Crew', '2026-01-01', 'Breakfast tacos', '',
    8, 8, 8, 8, 8, 8, 8, 8,
    'Ready for the first official stop on the B/CS Breakfast Taco Tour.',
    'Let the tortilla rankings begin.'
  from restaurant
  returning id
), award as (
  insert into public.awards (name)
  values ('Hidden Gem')
  on conflict (name) do update set name = excluded.name
  returning id
)
insert into public.review_awards (review_id, award_id)
select review.id, award.id from review, award
on conflict do nothing;
```

### 4. Enable realtime updates

In Supabase, open **Database → Replication** and enable realtime for these tables:

- `restaurants`
- `reviews`
- `review_awards`

The app also refreshes immediately after saving, but realtime lets other open browsers update without a manual reload.

## Environment variables

Create `.env.local` for local development:

```bash
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key
```

Only use the anon public key in the browser. Do not add the Supabase service role key to this app.

## Local testing

```bash
npm install
npm run dev
```

Open `http://localhost:3000`, save a score, and confirm it appears in Supabase Table Editor and in another browser window using the same local app.

## Build

```bash
npm run lint
npm run build
npm start
```

## Deploy to Vercel

1. Push this repo to GitHub.
2. Import it at https://vercel.com/new.
3. Keep the default Next.js settings.
4. In the Vercel project, open **Settings → Environment Variables**.
5. Add:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
6. Redeploy the project after adding the variables.
7. Open the Vercel URL on two devices and confirm both see the same saved taco scores.

## Data notes

The shared data logic lives in `lib/tacoDb.ts`, the browser client setup lives in `lib/supabase.ts`, and the scoring/grouping logic remains isolated in `lib/tacoData.ts`.
