# Phase Zero Plan — Nearest Community Health Post

A Singapore web app where a user enters a 6-digit postal code and sees the nearest Community Health Post: name, address, map location, and distance. This document covers planning and foundations only — no application code.

## 1. Goals

Phase Zero goals (keep it small):

- Confirm the data we have is usable and spot any gaps before building.
- Decide the technical approach for turning a postal code into a location, and for finding the nearest post.
- Pick a simple, low-cost tech stack that deploys cleanly on Vercel.
- Sketch the project structure and UI direction so Phase One can start coding immediately.

Explicitly out of scope for the first version: opening hours, contact details, turn-by-turn directions/routing, multi-language support, and the final animated visual design (we plan for it, but don't build it yet).

## 2. Assumptions

- The Community Health Post list is a static or near-static dataset (doesn't change minute-to-minute), so it can be loaded from a file or small database rather than a live feed. **Needs confirmation.**
- Each post record already has a postal code, and postal code alone is enough to place it on a map (see checklist below). **Needs confirmation.**
- "Nearest" means straight-line (as-the-crow-flies) distance, not walking/driving distance. This is much simpler to build and is fine for Phase Zero. **Needs confirmation.**
- Expected traffic is low-to-moderate (a community tool, not a national campaign), so free-tier services should be enough. **Needs confirmation.**
- Only Singapore postal codes are in scope (6 digits, numeric).

## 3. Data Review & Checklist

Before Phase One starts, check the existing Community Health Post list for:

- **Completeness**: every row has a postal code, and the postal code is 6 digits.
- **Format consistency**: no leading zeros dropped (e.g. "059911" stored as text, not the number 59911), no stray spaces or dashes.
- **Duplicates**: same post listed twice, or two posts sharing one postal code (possible if in the same building).
- **Coordinates**: does the list already include latitude/longitude, or only postal code + address? If coordinates are missing, we geocode once during setup (see below) rather than on every user request.
- **Naming**: consistent post name field, no HTML or formatting artifacts in the text.
- **Row count**: rough number of posts, so we know if "nearest" needs any performance optimization (a few hundred posts is trivial; tens of thousands would need more care). **Needs confirmation.**

Recommended action: run the existing list through a one-time cleaning/geocoding pass and store the result (name, address, postal code, latitude, longitude) as the app's source data, rather than re-deriving coordinates on every request.

**Status: done.** The real CHP list (150 posts) was sourced, geocoded, and loaded into Supabase — see `infra-status.md`.

## 4. Postal-Code Geocoding & Nearest-Post Distance

**Step A — Geocode the health post list (one-time, done ahead of launch):**
Convert each post's postal code/address into latitude and longitude using **OneMap** (run by the Singapore Land Authority) — the standard free option for local postal codes and addresses.

**Step B — Geocode the user's input postal code (at request time):**
Same OneMap lookup, done live when the user submits their 6-digit code. Validate the input first (see below) so we don't waste API calls on obviously bad input.

**Step C — Input validation:**
- Must be exactly 6 digits, numeric only.
- Reject anything else immediately with a clear message (e.g. "Please enter a 6-digit Singapore postal code") — don't call the geocoding API for invalid formats.
- If the format is valid but the geocoding service can't find it (unassigned or non-existent code), show a clear "We couldn't find that postal code" message rather than a blank or broken result.

**Step D — Find the nearest post:**
Once we have the user's coordinates, calculate the straight-line distance to every post in our list using the **Haversine formula** (a standard, simple math formula for distance between two lat/long points on a sphere — no external service needed). Sort and return the closest one (and optionally the next 2-3 as alternates, though showing just the nearest matches the stated scope).

This approach needs no routing/directions API and no database with geospatial features for Phase Zero — a small in-memory or flat-file list is enough given a modest post count.

**OneMap API access — confirmed (researched 2026-09-02):**
- Registration is required for an OneMap developer account (email + password, confirmed by email), but it's **free** for Singapore mapping use.
- **Forward geocoding — the `search` endpoint that turns a postal code/address into coordinates — does NOT require an access token or authentication.** This covers both our uses: geocoding the health post list once, and geocoding each user's postal code live. So Phase One may not need a OneMap account at all for the core feature.
- An access token (JWT, ~3-day validity, obtained via email+password login) is only needed for authenticated endpoints such as reverse geocoding (coordinates → address), which this app doesn't use.
- The `search` endpoint is not typo-tolerant, so exact postal codes matter (fits our validation step above).
- Rate limits for the unauthenticated search endpoint aren't published anywhere found so far — **still needs confirmation** once we're geocoding at real volume (unlikely to matter at Phase Zero/One scale, but worth a quick check before wider rollout).
- Sources: [OneMap API Documentation](https://www.onemap.gov.sg/apidocs/), [OneMap authentication docs](https://www.onemap.gov.sg/apidocs/authentication), [Exploring Singapore's OneMap API](https://www.sheshbabu.com/posts/exploring-singapore-onemap-api/), [OneMap community forum — access tokens](https://discuss.onemap.sg/t/how-to-get-an-access-token/57)

## 5. Lightweight Map Option & Tech Stack (Vercel)

**Recommended stack:**

- **Framework**: Next.js (React) — pairs naturally with Vercel (same company), simple deployment, good free tier.
- **Map library**: Leaflet — small, free, no account needed for basic use. Pair it with OpenStreetMap tiles (free, no key) or OneMap's own tile layer (gives an authentic Singapore basemap). **Needs confirmation**: OneMap tile usage terms if we go that route; otherwise default to OpenStreetMap tiles, which are safe and well-documented.
- **Data storage**: a Supabase Postgres database holding the cleaned/geocoded post list (already provisioned — see infra-status.md).
- **Hosting**: Vercel, free/hobby tier should suffice for Phase Zero traffic. **Needs confirmation** on expected usage if this changes.

This keeps the whole app to one deployable Next.js project with no separate backend service to manage.

## 6. Project Structure

```
health-post-finder/
├── data/
│   ├── chp_list.csv             # name + postal_code, sourced from SingHealth CHP finder
│   └── chp_geocoded.json        # name, postal_code, address, latitude, longitude (loaded into Supabase)
├── app/                         # Next.js App Router routes
│   ├── layout.tsx
│   ├── page.tsx                 # main search + result screen (placeholder for now)
│   └── globals.css
├── lib/
│   └── supabaseClient.ts        # Supabase connection
├── .env.example
├── plan.md
└── infra-status.md
```

Phase One additions (not built yet): `components/PostalCodeForm`, `components/ResultCard`, `components/MapView`, `lib/geocode` (OneMap call), `lib/distance` (Haversine), `lib/validatePostalCode`.

## 7. UI & Animation Direction

Phase Zero deliverable is planning only, but for context on where the design is headed:

- **Final vision**: a dynamic, animated interface — e.g. smooth transitions when a result appears, an animated marker drop on the map, subtle motion on load/hover.
- **Phase Zero**: just note this direction and pick tools/libraries that won't block it later (e.g. confirm Next.js + a CSS animation library or Framer Motion works well together) — don't build the animations yet.
- Keep the input screen extremely simple: one input box, one button, clear validation messages, and a loading state while geocoding/searching runs.

## 8. Accessibility & Privacy Basics

**Accessibility (plan for Phase One):**
- Postal code input must be usable via keyboard alone and properly labeled for screen readers.
- Error messages (invalid/unmatched postal code) must be announced to assistive tech, not just shown visually (e.g. via ARIA live regions).
- Map should have a text alternative (the address and distance shown as plain text, not only on the map).
- Sufficient color contrast, especially once animation/design is added later.

**Privacy:**
- The only personal input is a postal code — not precise personal location, but still worth minimizing: avoid logging user postal codes long-term unless there's a clear reason.
- OneMap's forward-geocoding endpoint requires no account/login for our use, which limits what it could log about us; still worth checking OneMap's own data-retention policy before wider rollout. **Needs confirmation.**
- No user accounts, cookies, or tracking needed for this feature — keep it stateless if possible.

## 9. Risks

- **Data quality risk**: if the source health post list has bad/missing postal codes, geocoding will fail silently for some entries. One row ("House of Joy Tampines Greenweave") has no postal code and is currently unreachable by postal-code search — see infra-status.md.
- **Geocoding API risk**: reliance on OneMap means an outage affects the whole app; the endpoint we need doesn't require auth so there's no token-expiry risk, but rate limits at scale are still unconfirmed.
- **Postal code ambiguity**: some Singapore postal codes cover large areas (e.g. big estates) or are shared by multiple buildings, which can make "distance" less meaningful for those cases. Two postal codes in our data are each shared by two different posts.
- **Scope creep risk**: since the final vision includes animation and more data fields, it's tempting to add them early — Phase Zero should resist this and stay foundational.

## 10. Phase One Handoff

When Phase Zero is done, Phase One should have:

- A cleaned, geocoded health post dataset — **done**, 150 posts loaded into Supabase (`data/chp_list.csv`, `data/chp_geocoded.json` in this repo are the staging files).
- Confirmed answers to every "Needs confirmation" item above.
- OneMap API access decided: **no account needed** for the core postal-code-to-coordinates lookup (see Section 4).
- The project scaffolded per Section 6 — **done**, deployed to Vercel, wired to Supabase, and now in this git repo (see infra-status.md).
- A clear go-ahead to build: input validation → geocode → calculate nearest → display result + map — in that order, as the core working slice, before any animation work begins.
- Two open data decisions: the missing "House of Joy Tampines Greenweave" postal code, and whether to filter "(by referral only)" / "(temporarily closed)" posts from results.
