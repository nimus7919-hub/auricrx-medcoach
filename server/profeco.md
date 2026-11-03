# PROFECO QQP and INEGI DENUE

`index.js` installs `profeco.js` before the legacy development-admin middleware. Schema setup runs at startup using neonClient; failure to enable pg_trgm leaves name and ingredient/strength matching available.

Configuration (server environment only):
- ADMIN_TOKEN: enables POST /api/admin/ingest/profeco. Send x-admin-token or Authorization: Bearer. Unset means 404. The existing development admin endpoints keep their existing restrictions.
- INEGI_TOKEN: required for DENUE. No token means DENUE is skipped; nearby searches use QQP monitored stores if the DENUE table is empty.
- GOOGLE_PLACES_API_KEY: optional Distance Matrix enrichment for the first five results. No Places discovery is used by the new routes.

QQP runs after two minutes and weekly thereafter while the Express process remains alive. Resources recorded in qqp_sources with a positive row_count are skipped; interrupted resources retry using (resource_id, _id) conflicts. CSV is attempted if the initial DataStore request fails; blocked CSV downloads fail the resource without marking it complete. Source history is retained while prices strictly older than max(fecha) minus 90 days are purged. Empty tables are a no-op and the newest observation period is explicitly protected. This cutoff never uses today's date. Unmatched products are recorded in qqp_match_review. Catalog IDs use an explicit id when available, otherwise the normalized medication name. See ../docs/PROFECO_PIPELINE_STATUS.md for the November 2026 audit and scheduling recommendations.

DENUE uses both pharmacy SCIAN classes and all 32 states, in pages of 1000. A daily freshness check refreshes completed imports every 30 days. Completion is recorded only after all states succeed. Records link to monitored QQP stores within 150 metres with a matching chain name.

GET /api/pharmacies/nearby?lat=...&lng=...&radius=3000 returns up to 30 pharmacies. Radius is capped at 20000 metres. Distances are straight-line metres, with optional driving_distance_m and driving_duration_s.

GET /api/prices?med=...&state=...&lat=...&lng=... accepts a catalog ID or name. Coordinates and state are optional. It returns state and national summaries, the selected summary, per_chain, nearest (10 stores, latest observation per store), source, as_of and fallback. Prices are MXN. Its 90-day window is relative to the latest available observation for the matched products, because publications lag. The response states window_anchor=latest_observation. Always display as_of; a reference price does not indicate inventory or a current store quote. No matched data returns empty summaries with null prices and as_of.

Validation performed without loading environment files: Node syntax checks; TypeScript transpilation diagnostics for changed app files; mocked endpoint checks for radius/coordinates, DENUE and QQP selection, state fallback, national summaries and last store price. Live database creation and provider ingestion require verification in the deployed environment. Normal Expo export was skipped because the existing Babel react-native-dotenv plugin reads environment files. No native dependency or configuration changed.
