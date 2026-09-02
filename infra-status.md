# Infrastructure Status — Nearest Community Health Post

Last updated: 2026-09-02

## Supabase (database) — LOADED with real data

- Project name: `Nearest Facilty`
- Project ref / ID: `hgbmjzpgihapzkgydven`
- Region: `ap-southeast-1` (close to Singapore)
- URL: `https://hgbmjzpgihapzkgydven.supabase.co`
- Publishable (anon) key: `sb_publishable_LO1HNNcZok0hA3iMsSWymQ_ijyft7pQ`
  (safe to expose client-side — scoped by Row Level Security, not a secret)
- Table: `public.health_posts` — columns: id (uuid), name, address,
  postal_code, latitude, longitude, created_at, updated_at. Indexed on
  postal_code. Row Level Security enabled with a public read-only policy.
- **150 Community Health Posts loaded** (2026-09-02), sourced from the
  embedded Google My Maps layer on the SingHealth CHP finder page
  (https://www.singhealth.com.sg/community-care/connect-with-our-place-based-care-team/find-a-community-health-posts),
  geocoded via OneMap's unauthenticated `search` endpoint (postal code →
  address + lat/long).
- **1 row has no coordinates**: "House of Joy Tampines Greenweave" (Eastern
  Region: Tampines West) — the source map listed no postal code for it, only
  raw map coordinates (103.9375639, 1.3641565) in the KML, which weren't
  used for reverse geocoding since that needs OneMap auth (out of scope for
  now). This row will be silently unreachable by postal-code search until
  fixed — either look up its postal code manually, or reverse-geocode its
  coordinates later.
- A number of names include suffixes like "(by referral only)" or
  "(temporarily closed)" straight from the source — worth deciding in Phase
  One whether to filter these out of "nearest post" results, since a walk-in
  visitor probably shouldn't be routed to one.
- Two postal codes are shared by two posts each: `520922` (PCF Sparkle Care
  AAC @ Tampines West 813 / PCF Sparkle Care @ Tampines 922) and `828629`
  (St Luke's ElderCare @ One Punggol / One Punggol CC) — likely the same
  building housing two named services; not a data error, just worth knowing
  "nearest" could return either at that location.

## Vercel (hosting) — LIVE and confirmed

- Project name: `health-post-finder` (project id `prj_BWJHkUCEZog2wvl6WkNhw2sN8qSn`)
- Account/scope: `theethylene` (personal account, team id `team_4POpQklPFTgqSjuqT7kTqfZi`)
- Live URL: https://health-post-finder.vercel.app (also `health-post-finder-theethylene.vercel.app`)
- Latest deployment id: `dpl_4kvkiqzfVpHwhyctLuPkQDR2kd4E` — **state: READY**.
- Deployed via direct file upload initially (no git repo); the app is now
  also pushed to GitHub (see below). Linking Vercel to this repo for
  push-to-deploy is a future step, not done automatically.
- Framework: Next.js **14.2.35** (patched; see prior notes on the Dec 2025
  RSC security advisory).

## GitHub (source control) — connected

- Repo: https://github.com/theethylene/Nearest-Facility.git
- No GitHub MCP connector is available to this session, but plain `git`
  commands against github.com work directly through this environment (the
  container's proxy authenticates git operations transparently), so a
  connector wasn't actually needed to push.
- App scaffold, data files, and this planning documentation were committed
  and pushed here on 2026-09-02.
- Not yet done: linking this repo to the Vercel project for push-to-deploy
  (`create_git_project`) — only do this if/when asked.

## App scaffold (in this repo)

Next.js 14.2.35 + TypeScript, `@supabase/supabase-js`, with `leaflet` /
`react-leaflet` added as dependencies for the Phase One map. Structure:
`app/page.tsx`, `app/layout.tsx`, `lib/supabaseClient.ts`, `.env.example`,
`README.md`, `data/chp_list.csv`, `data/chp_geocoded.json`. No
search/geocoding logic yet — placeholder page only.

## OneMap API access — resolved (2026-09-02)

Researched and confirmed (see plan.md Section 4 for full detail and sources):

- Free to use; developer account registration exists but **is not required**
  for our core need.
- The forward-geocoding `search` endpoint (postal code/address → lat/long)
  needs **no authentication at all**.
- Used successfully to geocode all 149 postal codes in the CHP list (147
  unique) with a 350ms delay between requests to avoid a WAF rate-limit page
  — 100% success rate at that pace. Calls were made from the browser (not
  this container's shell), since this session's cloud sandbox does not have
  onemap.gov.sg on its network allowlist.
- Rate limits for the unauthenticated endpoint at higher volume are still
  unconfirmed — fine at this app's scale.

## Next steps (Phase One)

1. Decide how to handle "House of Joy Tampines Greenweave" (missing postal
   code/coordinates) and the "(by referral only)" / "(temporarily closed)"
   entries.
2. Build postal-code input, validation, nearest-post calculation (Haversine),
   the Leaflet map, and eventually the animated UI — the data backing all of
   this is now live in Supabase.
3. Optionally link this GitHub repo to the Vercel project for
   push-to-deploy.
