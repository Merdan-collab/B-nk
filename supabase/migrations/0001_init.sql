-- TourDeBænk: initial schema
-- Extensions
create extension if not exists postgis;
create extension if not exists pgcrypto;

-- =========================================================================
-- PROFILES
-- =========================================================================
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  display_name text,
  bio text,
  avatar_url text,
  notify_friend_requests boolean not null default true,
  notify_nearby_friend_checkins boolean not null default false,
  notify_bench_reviews boolean not null default true,
  notify_shares boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles are publicly readable"
  on public.profiles for select
  using (true);

create policy "users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Auto-create a profile row whenever a new auth user signs up
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, username, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', 'baenker_' || substr(new.id::text, 1, 8)),
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- =========================================================================
-- BENCHES
-- =========================================================================
create table public.benches (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  location geography(point, 4326) not null,
  address text,
  district text,
  tags text[] not null default '{}',
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  verified boolean not null default false,
  average_rating numeric(3,2) not null default 0,
  rating_count integer not null default 0,
  avg_view numeric(3,2) not null default 0,
  avg_comfort numeric(3,2) not null default 0,
  avg_coziness numeric(3,2) not null default 0,
  avg_quiet numeric(3,2) not null default 0,
  avg_sun numeric(3,2) not null default 0,
  avg_location_score numeric(3,2) not null default 0
);

create index benches_location_idx on public.benches using gist (location);
create index benches_district_idx on public.benches (district);
create index benches_created_at_idx on public.benches (created_at desc);

alter table public.benches enable row level security;

create policy "benches are publicly readable"
  on public.benches for select
  using (true);

create policy "authenticated users can add benches"
  on public.benches for insert
  to authenticated
  with check (auth.uid() = created_by);

create policy "creators can update their own benches"
  on public.benches for update
  to authenticated
  using (auth.uid() = created_by);

-- Convenience view exposing lat/lng as plain floats
create view public.benches_geo as
select
  b.*,
  st_y(b.location::geometry) as latitude,
  st_x(b.location::geometry) as longitude
from public.benches b;

-- Find benches within a radius (meters) of a point, closest first
create function public.nearby_benches(
  center_lat double precision,
  center_lng double precision,
  radius_meters double precision default 3000,
  max_results integer default 200
)
returns table (
  id uuid,
  name text,
  description text,
  latitude double precision,
  longitude double precision,
  address text,
  district text,
  tags text[],
  verified boolean,
  average_rating numeric,
  rating_count integer,
  distance_meters double precision
)
language sql
stable
as $$
  select
    b.id, b.name, b.description,
    st_y(b.location::geometry) as latitude,
    st_x(b.location::geometry) as longitude,
    b.address, b.district, b.tags, b.verified, b.average_rating, b.rating_count,
    st_distance(b.location, st_setsrid(st_makepoint(center_lng, center_lat), 4326)::geography) as distance_meters
  from public.benches b
  where st_dwithin(
    b.location,
    st_setsrid(st_makepoint(center_lng, center_lat), 4326)::geography,
    radius_meters
  )
  order by distance_meters asc
  limit max_results;
$$;

-- Warn the "add bench" flow about a near-duplicate before insert
create function public.benches_within(
  center_lat double precision,
  center_lng double precision,
  radius_meters double precision default 25
)
returns table (id uuid, name text, distance_meters double precision)
language sql
stable
as $$
  select
    b.id,
    b.name,
    st_distance(b.location, st_setsrid(st_makepoint(center_lng, center_lat), 4326)::geography) as distance_meters
  from public.benches b
  where st_dwithin(
    b.location,
    st_setsrid(st_makepoint(center_lng, center_lat), 4326)::geography,
    radius_meters
  );
$$;

-- =========================================================================
-- RATINGS (one per user per bench, multi-dimensional)
-- =========================================================================
create table public.ratings (
  id uuid primary key default gen_random_uuid(),
  bench_id uuid not null references public.benches(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  overall smallint not null check (overall between 1 and 5),
  view smallint check (view between 1 and 5),
  comfort smallint check (comfort between 1 and 5),
  coziness smallint check (coziness between 1 and 5),
  quiet smallint check (quiet between 1 and 5),
  sun smallint check (sun between 1 and 5),
  location_score smallint check (location_score between 1 and 5),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (bench_id, user_id)
);

alter table public.ratings enable row level security;

create policy "ratings are publicly readable"
  on public.ratings for select
  using (true);

create policy "users manage their own ratings"
  on public.ratings for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create function public.recalculate_bench_rating(p_bench_id uuid)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  update public.benches b set
    average_rating = coalesce((select round(avg(overall)::numeric, 2) from public.ratings where bench_id = p_bench_id), 0),
    rating_count = coalesce((select count(*) from public.ratings where bench_id = p_bench_id), 0),
    avg_view = coalesce((select round(avg(view)::numeric, 2) from public.ratings where bench_id = p_bench_id and view is not null), 0),
    avg_comfort = coalesce((select round(avg(comfort)::numeric, 2) from public.ratings where bench_id = p_bench_id and comfort is not null), 0),
    avg_coziness = coalesce((select round(avg(coziness)::numeric, 2) from public.ratings where bench_id = p_bench_id and coziness is not null), 0),
    avg_quiet = coalesce((select round(avg(quiet)::numeric, 2) from public.ratings where bench_id = p_bench_id and quiet is not null), 0),
    avg_sun = coalesce((select round(avg(sun)::numeric, 2) from public.ratings where bench_id = p_bench_id and sun is not null), 0),
    avg_location_score = coalesce((select round(avg(location_score)::numeric, 2) from public.ratings where bench_id = p_bench_id and location_score is not null), 0)
  where b.id = p_bench_id;
end;
$$;

create function public.on_rating_changed()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  perform public.recalculate_bench_rating(coalesce(new.bench_id, old.bench_id));
  return null;
end;
$$;

create trigger ratings_after_change
  after insert or update or delete on public.ratings
  for each row execute procedure public.on_rating_changed();

-- =========================================================================
-- REVIEWS (free-text, separate from star ratings)
-- =========================================================================
create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  bench_id uuid not null references public.benches(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now()
);

create index reviews_bench_idx on public.reviews (bench_id, created_at desc);

alter table public.reviews enable row level security;

create policy "reviews are publicly readable"
  on public.reviews for select
  using (true);

create policy "users manage their own reviews"
  on public.reviews for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- =========================================================================
-- PHOTOS
-- =========================================================================
create table public.photos (
  id uuid primary key default gen_random_uuid(),
  bench_id uuid not null references public.benches(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  storage_path text not null,
  caption text,
  like_count integer not null default 0,
  created_at timestamptz not null default now()
);

create index photos_bench_idx on public.photos (bench_id, created_at desc);

alter table public.photos enable row level security;

create policy "photos are publicly readable"
  on public.photos for select
  using (true);

create policy "users manage their own photos"
  on public.photos for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create table public.photo_likes (
  id uuid primary key default gen_random_uuid(),
  photo_id uuid not null references public.photos(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (photo_id, user_id)
);

alter table public.photo_likes enable row level security;

create policy "photo likes are publicly readable"
  on public.photo_likes for select
  using (true);

create policy "users manage their own likes"
  on public.photo_likes for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create function public.on_photo_like_changed()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  update public.photos set like_count = (
    select count(*) from public.photo_likes where photo_id = coalesce(new.photo_id, old.photo_id)
  ) where id = coalesce(new.photo_id, old.photo_id);
  return null;
end;
$$;

create trigger photo_likes_after_change
  after insert or delete on public.photo_likes
  for each row execute procedure public.on_photo_like_changed();

-- Storage bucket for bench photos
insert into storage.buckets (id, name, public)
values ('bench-photos', 'bench-photos', true)
on conflict (id) do nothing;

create policy "bench photos are publicly viewable"
  on storage.objects for select
  using (bucket_id = 'bench-photos');

create policy "authenticated users can upload bench photos"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'bench-photos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "users can delete their own bench photos"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'bench-photos' and (storage.foldername(name))[1] = auth.uid()::text);

-- =========================================================================
-- FRIENDSHIPS
-- =========================================================================
create table public.friendships (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.profiles(id) on delete cascade,
  addressee_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined')),
  created_at timestamptz not null default now(),
  responded_at timestamptz,
  check (requester_id <> addressee_id),
  unique (requester_id, addressee_id)
);

create index friendships_addressee_idx on public.friendships (addressee_id, status);
create index friendships_requester_idx on public.friendships (requester_id, status);

alter table public.friendships enable row level security;

create policy "users see their own friendships"
  on public.friendships for select
  to authenticated
  using (auth.uid() = requester_id or auth.uid() = addressee_id);

create policy "users can send friend requests"
  on public.friendships for insert
  to authenticated
  with check (auth.uid() = requester_id);

create policy "participants can update a friendship"
  on public.friendships for update
  to authenticated
  using (auth.uid() = requester_id or auth.uid() = addressee_id);

create policy "participants can delete a friendship"
  on public.friendships for delete
  to authenticated
  using (auth.uid() = requester_id or auth.uid() = addressee_id);

create function public.is_friend(a uuid, b uuid)
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select exists (
    select 1 from public.friendships
    where status = 'accepted'
      and ((requester_id = a and addressee_id = b) or (requester_id = b and addressee_id = a))
  );
$$;

-- =========================================================================
-- FAVORITES
-- =========================================================================
create table public.favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  bench_id uuid not null references public.benches(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, bench_id)
);

alter table public.favorites enable row level security;

create policy "users and friends see favorites"
  on public.favorites for select
  to authenticated
  using (auth.uid() = user_id or public.is_friend(auth.uid(), user_id));

create policy "users manage their own favorites"
  on public.favorites for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- =========================================================================
-- LISTS
-- =========================================================================
create table public.lists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  is_shared_with_friends boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.lists enable row level security;

create policy "owners and friends can read lists"
  on public.lists for select
  to authenticated
  using (
    auth.uid() = user_id
    or (is_shared_with_friends and public.is_friend(auth.uid(), user_id))
  );

create policy "users manage their own lists"
  on public.lists for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create table public.list_items (
  id uuid primary key default gen_random_uuid(),
  list_id uuid not null references public.lists(id) on delete cascade,
  bench_id uuid not null references public.benches(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (list_id, bench_id)
);

alter table public.list_items enable row level security;

create policy "list items follow list visibility"
  on public.list_items for select
  to authenticated
  using (
    exists (
      select 1 from public.lists l
      where l.id = list_items.list_id
        and (l.user_id = auth.uid() or (l.is_shared_with_friends and public.is_friend(auth.uid(), l.user_id)))
    )
  );

create policy "list owners manage list items"
  on public.list_items for all
  to authenticated
  using (exists (select 1 from public.lists l where l.id = list_items.list_id and l.user_id = auth.uid()))
  with check (exists (select 1 from public.lists l where l.id = list_items.list_id and l.user_id = auth.uid()));

-- =========================================================================
-- CHECK-INS (realtime "online på bænken")
-- =========================================================================
create table public.checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  bench_id uuid not null references public.benches(id) on delete cascade,
  checked_in_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '60 minutes'),
  visibility text not null default 'friends' check (visibility in ('private', 'friends', 'public')),
  active boolean not null default true
);

create index checkins_bench_active_idx on public.checkins (bench_id) where active;
create index checkins_user_active_idx on public.checkins (user_id) where active;

alter table public.checkins enable row level security;

create policy "checkins are visible per privacy setting"
  on public.checkins for select
  to authenticated
  using (
    user_id = auth.uid()
    or (
      active and expires_at > now() and (
        visibility = 'public'
        or (visibility = 'friends' and public.is_friend(auth.uid(), user_id))
      )
    )
  );

create policy "users manage their own checkins"
  on public.checkins for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

alter publication supabase_realtime add table public.checkins;

create function public.expire_stale_checkins()
returns void
language sql
security definer set search_path = public
as $$
  update public.checkins set active = false where active and expires_at <= now();
$$;

-- =========================================================================
-- NOTIFICATIONS
-- =========================================================================
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null check (type in ('friend_request', 'friend_accepted', 'bench_shared', 'nearby_friend_checkin', 'new_review', 'new_rating')),
  payload jsonb not null default '{}',
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create index notifications_user_idx on public.notifications (user_id, created_at desc);

alter table public.notifications enable row level security;

create policy "users see their own notifications"
  on public.notifications for select
  to authenticated
  using (auth.uid() = user_id);

create policy "users update their own notifications"
  on public.notifications for update
  to authenticated
  using (auth.uid() = user_id);

alter publication supabase_realtime add table public.notifications;

-- Notify a bench's creator (and reviewers) when a new review/rating lands
create function public.notify_new_review()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  bench_owner uuid;
  owner_opted_in boolean;
begin
  select created_by into bench_owner from public.benches where id = new.bench_id;
  if bench_owner is not null and bench_owner <> new.user_id then
    select notify_bench_reviews into owner_opted_in from public.profiles where id = bench_owner;
    if coalesce(owner_opted_in, false) then
      insert into public.notifications (user_id, type, payload)
      values (bench_owner, 'new_review', jsonb_build_object('bench_id', new.bench_id, 'reviewer_id', new.user_id));
    end if;
  end if;
  return new;
end;
$$;

create trigger reviews_after_insert
  after insert on public.reviews
  for each row execute procedure public.notify_new_review();

create function public.notify_friend_request()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  opted_in boolean;
begin
  if tg_op = 'INSERT' and new.status = 'pending' then
    select notify_friend_requests into opted_in from public.profiles where id = new.addressee_id;
    if coalesce(opted_in, false) then
      insert into public.notifications (user_id, type, payload)
      values (new.addressee_id, 'friend_request', jsonb_build_object('friendship_id', new.id, 'requester_id', new.requester_id));
    end if;
  elsif tg_op = 'UPDATE' and new.status = 'accepted' and old.status is distinct from 'accepted' then
    select notify_friend_requests into opted_in from public.profiles where id = new.requester_id;
    if coalesce(opted_in, false) then
      insert into public.notifications (user_id, type, payload)
      values (new.requester_id, 'friend_accepted', jsonb_build_object('friendship_id', new.id, 'addressee_id', new.addressee_id));
    end if;
  end if;
  return new;
end;
$$;

create trigger friendships_after_insert
  after insert on public.friendships
  for each row execute procedure public.notify_friend_request();

create trigger friendships_after_update
  after update on public.friendships
  for each row execute procedure public.notify_friend_request();
