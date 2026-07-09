-- Breakfast Taco Tour v2 shared database schema
create extension if not exists pgcrypto;

create table if not exists public.restaurants (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  reviewer_name text not null,
  review_date date not null,
  ordered text,
  price text,
  taste numeric(2,1) not null check (taste between 1 and 5),
  service numeric(2,1) not null check (service between 1 and 5),
  atmosphere numeric(2,1) not null check (atmosphere between 1 and 5),
  value numeric(2,1) not null check (value between 1 and 5),
  tortilla numeric(2,1) not null check (tortilla between 1 and 5),
  salsa numeric(2,1) not null check (salsa between 1 and 5),
  filling numeric(2,1) not null check (filling between 1 and 5),
  balance numeric(2,1) not null check (balance between 1 and 5),
  sentence_review text,
  memorable_quote text,
  created_at timestamptz not null default now()
);

create table if not exists public.awards (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.review_awards (
  review_id uuid not null references public.reviews(id) on delete cascade,
  award_id uuid not null references public.awards(id) on delete cascade,
  primary key (review_id, award_id)
);

alter table public.restaurants enable row level security;
alter table public.reviews enable row level security;
alter table public.awards enable row level security;
alter table public.review_awards enable row level security;

drop policy if exists "Public restaurants read" on public.restaurants;
create policy "Public restaurants read" on public.restaurants for select using (true);
drop policy if exists "Public restaurants insert" on public.restaurants;
create policy "Public restaurants insert" on public.restaurants for insert with check (true);
drop policy if exists "Public restaurants update" on public.restaurants;
create policy "Public restaurants update" on public.restaurants for update using (true) with check (true);
drop policy if exists "Public reviews read" on public.reviews;
create policy "Public reviews read" on public.reviews for select using (true);
drop policy if exists "Public reviews insert" on public.reviews;
create policy "Public reviews insert" on public.reviews for insert with check (true);
drop policy if exists "Public awards read" on public.awards;
create policy "Public awards read" on public.awards for select using (true);
drop policy if exists "Public awards insert" on public.awards;
create policy "Public awards insert" on public.awards for insert with check (true);
drop policy if exists "Public awards update" on public.awards;
create policy "Public awards update" on public.awards for update using (true) with check (true);
drop policy if exists "Public review awards read" on public.review_awards;
create policy "Public review awards read" on public.review_awards for select using (true);
drop policy if exists "Public review awards insert" on public.review_awards;
create policy "Public review awards insert" on public.review_awards for insert with check (true);
