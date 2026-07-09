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
  taste numeric(3,1) not null check (taste between 1.0 and 10.0 and taste * 10 = trunc(taste * 10)),
  service numeric(3,1) not null check (service between 1.0 and 10.0 and service * 10 = trunc(service * 10)),
  atmosphere numeric(3,1) not null check (atmosphere between 1.0 and 10.0 and atmosphere * 10 = trunc(atmosphere * 10)),
  value numeric(3,1) not null check (value between 1.0 and 10.0 and value * 10 = trunc(value * 10)),
  tortilla numeric(3,1) not null check (tortilla between 1.0 and 10.0 and tortilla * 10 = trunc(tortilla * 10)),
  salsa numeric(3,1) not null check (salsa between 1.0 and 10.0 and salsa * 10 = trunc(salsa * 10)),
  filling numeric(3,1) not null check (filling between 1.0 and 10.0 and filling * 10 = trunc(filling * 10)),
  balance numeric(3,1) not null check (balance between 1.0 and 10.0 and balance * 10 = trunc(balance * 10)),
  sentence_review text,
  memorable_quote text,
  created_at timestamptz not null default now()
);


do $$
declare
  constraint_record record;
begin
  for constraint_record in
    select conname
    from pg_constraint
    where conrelid = 'public.reviews'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) ~ '(taste|service|atmosphere|value|tortilla|salsa|filling|balance)'
  loop
    execute format('alter table public.reviews drop constraint if exists %I', constraint_record.conname);
  end loop;
end $$;

alter table public.reviews
  alter column taste type numeric(3,1),
  alter column service type numeric(3,1),
  alter column atmosphere type numeric(3,1),
  alter column value type numeric(3,1),
  alter column tortilla type numeric(3,1),
  alter column salsa type numeric(3,1),
  alter column filling type numeric(3,1),
  alter column balance type numeric(3,1),
  add constraint reviews_taste_scale check (taste between 1.0 and 10.0 and taste * 10 = trunc(taste * 10)),
  add constraint reviews_service_scale check (service between 1.0 and 10.0 and service * 10 = trunc(service * 10)),
  add constraint reviews_atmosphere_scale check (atmosphere between 1.0 and 10.0 and atmosphere * 10 = trunc(atmosphere * 10)),
  add constraint reviews_value_scale check (value between 1.0 and 10.0 and value * 10 = trunc(value * 10)),
  add constraint reviews_tortilla_scale check (tortilla between 1.0 and 10.0 and tortilla * 10 = trunc(tortilla * 10)),
  add constraint reviews_salsa_scale check (salsa between 1.0 and 10.0 and salsa * 10 = trunc(salsa * 10)),
  add constraint reviews_filling_scale check (filling between 1.0 and 10.0 and filling * 10 = trunc(filling * 10)),
  add constraint reviews_balance_scale check (balance between 1.0 and 10.0 and balance * 10 = trunc(balance * 10));

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
