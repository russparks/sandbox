# Project Locations (Vite + React + Google Maps)

A fast, static site that plots **Projects** and **Leads** on a greyscale Google Map with **Advanced Markers** (collisionBehavior: REQUIRED) and clean, non-overlapping callouts.

## Quick start

```bash
npm i
cp .env.example .env
# open .env and paste your NEW regenerated API key safely
npm run dev
# build
npm run build
npm run preview
```

## Environment

Create `.env` (copy from `.env.example`):

```
VITE_GOOGLE_MAPS_API_KEY=YOUR_REGENERATED_KEY
VITE_GOOGLE_MAPS_MAP_ID=maps_sandbox
```

> The code uses the **Map ID** if present (vector). If you delete `VITE_GOOGLE_MAPS_MAP_ID`, it falls back to a local greyscale raster style.

### Enable & restrict

- Enable **Maps JavaScript API** and **Geocoding API** in Google Cloud.
- Add a billing account.
- Restrict the API key by **HTTP referrer** (web sites). Example patterns:
  - Local dev: `http://localhost:5173/*`, `http://127.0.0.1:5173/*`
  - Production: `https://yourdomain.com/*` or a subpath like `https://yourdomain.com/projects/*`
- If you see “This page can’t load Google Maps correctly”, fix key restrictions/billing.

## Data files & assets

During dev these are under `public/` and will be copied into `/dist` on build:

```
/dist
  index.html
  /assets           (vite bundle)
  /data/projects.json
  /data/leads.json
  /images/precon.png
  /images/construction.png
  /images/permanent.png
  /images/person-icon.png
```

Fetch paths are **relative**: `./data/...` and `./images/...`, so it works from a subfolder like `/projects/`.

## Implementation notes

- **Advanced Markers** with `collisionBehavior: REQUIRED` (fallback: classic Marker + InfoWindow).
- Geocoding uses GB bias and we `fitBounds` over all results.
- Toggles hide/show markers via `marker.map = null` (no re-geocoding).
- Zod validates JSON at runtime and logs helpful warnings.

## File overview

- `src/App.tsx` – layout, toggles, footer lists.
- `src/Map.tsx` – loader, geocoding, markers/callouts, collision, visibility toggles.
- `src/useDatasets.ts` – data fetch + validation + legacy support.
- `src/mapStyles.ts` – local greyscale fallback.
- `src/icons.ts` – status → icon and text colors.
- `src/types.ts` – TS types.
