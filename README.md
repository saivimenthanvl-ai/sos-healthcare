# SOS Healthcare

Emergency ambulance dispatch platform. A patient raises an SOS, the nearest
ambulance is dispatched, and both the patient and the responding crew track the
incident in realtime.

> **This is not an emergency service.** For immediate help, call your local
> emergency number first.

## Stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind 4 · Supabase
(Postgres + Auth + Realtime) · Google Maps JS API

## Getting started

```bash
npm install
cp .env.local.example .env.local   # then fill in your keys
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Required environment variables

| Variable | Used by |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase client |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase client |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Map rendering |
| `GOOGLE_MAPS_API_KEY` *(optional)* | Server-side reverse geocoding |
| `FITBIT_CLIENT_ID` / `FITBIT_CLIENT_SECRET` | *(optional)* Wearable integration |

The Google key needs the Maps JavaScript API, Geocoding API and Places API
enabled. Without it the app still runs; the map components show an empty canvas.

## Database setup

Run these in the Supabase SQL Editor, in order:

1. `supabase/schema.sql` — tables, enums and base RLS policies
2. `supabase/migrations/001_roles_and_dispatch.sql` — roles, dispatch RLS,
   realtime publication, signup trigger
3. `scripts/seed-hospitals.sql` — hospital directory
4. `scripts/seed-ambulances.sql` — ambulance fleet

All four are idempotent, so re-running them is safe.

Migration 001 is what makes the dispatch side work. It adds a `user_role` enum
(`patient` / `paramedic` / `dispatcher`), a `role` column on `profiles`, an
`ambulance_id` linking a paramedic to their vehicle, and the RLS policies that
let staff see active incidents. It also adds `ambulances`, `emergencies` and
`ambulance_locations` to the `supabase_realtime` publication — **without this,
no live updates are ever delivered**, because `schema.sql` only enables RLS.

## Demo accounts

Every account starts as `patient`. Sign up first, then promote:

```sql
-- Dispatcher
update public.profiles set role = 'dispatcher'
 where email = 'dispatch@example.com';

-- Paramedic, crewed to AMB-01
update public.profiles
   set role = 'paramedic',
       ambulance_id = (select id from public.ambulances
                        where vehicle_number = 'AMB-01')
 where email = 'driver@example.com';
```

## Pages

| Route | Purpose |
| --- | --- |
| `/` | Public landing page |
| `/dashboard` | Patient overview: SOS button, recent incidents |
| `/emergency` | Raise an SOS, or track the one in progress |
| `/emergency/[id]` | Past incident detail |
| `/hospitals` | Nearby hospitals, list or map |
| `/hospitals/[id]` | Hospital detail |
| `/profile` | Medical details and emergency contacts |
| `/settings` | Units, notifications, privacy |
| `/dispatch` | **Dispatchers.** Incident board and crew assignment |
| `/paramedic` | **Paramedics.** Job status and position reporting |
| `/privacy`, `/terms`, `/contact` | Static pages |

## How an emergency flows

1. The patient presses SOS on `/emergency`.
2. `POST /api/emergencies` finds the nearest hospital and nearest available
   ambulance, inserts the emergency, links the ambulance to it, and
   reverse-geocodes the coordinates into an address.
3. A dispatcher sees it on `/dispatch` and assigns a crew. That writes
   `assigned_ambulance_id` and sets the ambulance to `dispatched`.
4. The paramedic opens `/paramedic` and walks the job forward:
   `dispatched → en_route → arrived → resolved`. Each step updates both the
   emergency and the ambulance together.
5. The patient watches the same statuses live on `/emergency`, because
   `AmbulanceTracker` subscribes to the incident row.

### Position reporting

The paramedic console has two modes:

- **Use GPS** — reports the crew device's real position via
  `navigator.geolocation.watchPosition`.
- **Simulate** — interpolates the vehicle toward the incident so the whole
  flow can be demonstrated from a desk.

Pings write to `ambulance_locations` and update the ambulance's current
position, which is what the patient's map subscribes to.

## Scripts

```bash
npm run dev     # dev server
npm run lint    # eslint
npx tsc --noEmit  # typecheck
npm run build   # production build
```