# TourDeBænk 🪑

The social map of Copenhagen's best benches — Google Maps × Strava × a tiny
social network, all built around park benches. Discover benches, rate them on
six dimensions, check in ("online på bænken") when you're sitting there, see
which friends have visited, and share your favourites.

## Stack

- **Frontend:** Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Backend/DB:** Supabase (PostgreSQL + PostGIS)
- **Auth:** Supabase Auth (Google, Apple, email/password)
- **Maps:** Google Maps JavaScript API (`@googlemaps/js-api-loader` +
  `@googlemaps/markerclusterer`)
- **Storage:** Supabase Storage (`bench-photos` bucket)
- **Realtime:** Supabase Realtime (Postgres changes on `checkins` /
  `notifications`)

## MVP feature set (implemented)

1. Auth (Google / Apple / email)
2. Interactive map centered on Copenhagen, benches as clustered pins
3. Bench profile pages (photos, multi-dimension ratings, reviews, check-ins,
   friends who've visited)
4. Add-a-bench flow with near-duplicate detection
5. Photo upload to Supabase Storage + likes
6. Star ratings (overall + view/comfort/coziness/quiet/sun/location)
7. Favorites + custom lists (private or shared with friends)
8. Friends (search, requests, friend activity)
9. Share a bench (native share sheet, WhatsApp/SMS/Messenger, copy link,
   in-app share to a friend)
10. GPS-verified check-in (must be within 50 m), auto-expires after 60 min,
    three visibility levels (private/friends/public)
11. Realtime "🟢 N here now" on the map and bench page
12. Explore (10 categories + Bench of the Week), search + filters, profile
    stats & badges, opt-in notifications

## Getting started

### 1. Create a Supabase project

1. Create a project at [supabase.com](https://supabase.com).
2. In the SQL editor, run the migrations in `supabase/migrations/` **in
   order** (`0001_init.sql`, then `0002_create_bench_rpc.sql`). They enable
   PostGIS, create every table, RLS policy, trigger and RPC function, and
   create the public `bench-photos` storage bucket.
   - Alternatively, with the [Supabase CLI](https://supabase.com/docs/guides/cli)
     linked to your project: `supabase db push`.
3. Under **Authentication → Providers**, enable **Google** and **Apple** (add
   your OAuth client IDs/secrets) alongside the built-in **Email** provider.
4. Under **Authentication → URL Configuration**, add
   `http://localhost:3000/auth/callback` (and your production URL) as a
   redirect URL.
5. Copy the project URL, anon key, and service role key into `.env.local`
   (see below).

### 2. Get a Google Maps API key

Enable the **Maps JavaScript API** and the **Geometry** library in the
[Google Cloud Console](https://console.cloud.google.com/), then create an API
key restricted to your domain(s).

### 3. Configure environment variables

```bash
cp .env.example .env.local
```

Fill in:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=
```

### 4. Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). You'll be redirected to
`/login` until you sign in.

### 5. Typecheck / lint / build

```bash
npm run typecheck
npm run lint
npm run build
```

## Architecture notes

- **PostGIS everywhere for location.** `benches.location` is a
  `geography(point, 4326)` column with a GiST index. The `nearby_benches(lat,
  lng, radius_meters)` RPC does the radius search (`ST_DWithin`) and returns
  results sorted by distance — this is what powers the map's viewport-based
  fetch and the "find benches near me" flow, and is designed to stay fast
  even with tens of thousands of benches.
- **Denormalized rating aggregates.** `benches.average_rating`,
  `rating_count`, and the six per-dimension averages are maintained by a
  trigger (`recalculate_bench_rating`) on `ratings` insert/update/delete, so
  reads never need to aggregate on the fly.
- **Row Level Security is the authorization layer**, not application code.
  Every table has RLS enabled; the public read / own-row-write pattern is
  used throughout, with two more interesting cases:
  - **Check-ins** are always visible to their own owner (so profile stats
    like "Check-ins: 54" work), but to *other* people only while `active`
    and unexpired, and only per the row's `visibility` (`private` /
    `friends` / `public`). This is also how the map/bench page's realtime
    "here now" indicator respects privacy automatically — the query itself
    can never return more than the viewer is allowed to see.
  - **Favorites** are visible to the owner and their accepted friends (via
    the `is_friend()` helper function), which is what lets a friend's
    profile page show "favoritbænke" without a bespoke permission check in
    app code.
- **GPS check-in verification happens server-side.** The `checkIn` server
  action re-fetches the bench's true coordinates from the database and
  computes the Haversine distance to the coordinates the client's
  `navigator.geolocation` reported, rejecting the check-in if it's more than
  `CHECKIN_MAX_DISTANCE_METERS` (50 m) away. The client-reported position is
  inherently trust-limited (as with any GPS check-in feature), but the bench
  location itself can't be spoofed.
- **Bench creation goes through a Postgres RPC** (`create_bench`) rather than
  a plain insert, because PostgREST can't cast a `{lat, lng}` pair into a
  `geography` column on its own — the function does the
  `ST_SetSRID(ST_MakePoint(...))` conversion and still runs with the
  caller's own privileges (not `SECURITY DEFINER`), so the existing
  `created_by = auth.uid()` RLS check still applies.
- **Realtime is scoped to what's needed.** The map subscribes to
  `checkins` changes and re-fetches the current viewport (debounced); the
  bench page subscribes filtered to its own `bench_id`. Neither ever
  streams a user's continuous position — only discrete "checked in" /
  "checked out" state, per the product requirement that live GPS is never
  exposed to other users.
- **Notifications** are written by Postgres triggers where possible
  (`friend_request`, `friend_accepted`, `new_review`), each of which checks
  the *recipient's* opt-in flag on `profiles` (e.g. `notify_bench_reviews`)
  before inserting a row, and by server actions for anything that isn't a
  simple table trigger (`bench_shared`, `nearby_friend_checkin`).
  - **Known simplification:** because the app deliberately never tracks a
    user's continuous live location (only discrete bench check-ins), a
    "friend checked in nearby" notification can't be based on true
    proximity to the *recipient's* current position. Instead, opted-in
    friends are notified whenever a friend checks in anywhere (with
    `friends`/`public` visibility) — i.e. "a friend is now at a bench", not
    "a friend is near you". If real proximity-based alerts are wanted
    later, a bench's district/geohash could be compared against a friend's
    own most recent active check-in location.

## Data model

See `supabase/migrations/0001_init.sql` for the full schema. Tables:
`profiles`, `benches`, `ratings`, `reviews`, `photos`, `photo_likes`,
`checkins`, `friendships`, `favorites`, `lists`, `list_items`,
`notifications`. Bench import from Copenhagen open-data sources can be done
with a script that calls the `create_bench` RPC (or inserts directly with
`SECURITY DEFINER` semantics) once you have a dataset of coordinates.

## Roadmap beyond the MVP

Gamification/badges and the six explore categories are already in, kept
intentionally lightweight per the product brief ("humoristisk og sekundær —
ikke gøre appen rodet"). Natural next steps: bulk bench import from
Copenhagen open data, push notifications (web push / native), photo
moderation, and admin verification of user-submitted benches (the `verified`
flag already exists on `benches` but nothing sets it yet).
