# Nearest Community Health Post

Singapore web app: enter a 6-digit postal code, see the nearest Community
Health Post's name, address, map location, and distance.

See `plan.md` (in the project's Claude docs) for the full Phase Zero plan.

## Status

This is the Phase Zero infrastructure checkpoint — foundations only:

- **Database**: Supabase project `hgbmjzpgihapzkgydven` (region `ap-southeast-1`),
  with an empty `health_posts` table (name, address, postal_code, latitude,
  longitude) and public read-only Row Level Security enabled.
- **Hosting**: deployed to Vercel as a placeholder page that confirms the
  Supabase connection is live.
- **Not built yet** (Phase One): postal-code input/validation, geocoding via
  OneMap, nearest-post distance calculation, the Leaflet map, and the final
  animated UI.

## Local development

```bash
npm install
cp .env.example .env.local
npm run dev
```

## Data

The `health_posts` table is currently empty. Loading the cleaned/geocoded
Community Health Post list is a Phase One task (see plan.md, Section 3-4).

## Source control

No GitHub repository is connected yet — this project was scaffolded and
deployed directly. Connect a GitHub repo when ready for CI-based deployments
(push-to-deploy) instead of manual deploys.
