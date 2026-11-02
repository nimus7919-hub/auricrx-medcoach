# Medication reference prices

The app now uses recorded MXN prices through `POST /pharmacies/prices`. The medication refill screen no longer reads the local Excel price catalog. No scraping was enabled. Missing, ambiguous, disabled, future-dated, or more than 60-day-old observations produce no numeric price. Stale entries are grey and retain their consultation date. Every displayed medication price has the Spanish/English reference notice, and partner observations show `Precio verificado`.

## Deployment and flags

Apply `server/price-schema.sql` to Neon explicitly using your migration tooling. It creates a separate reviewed product catalog, stores, partners, observations, placements, monthly import history, and an encrypted OAuth token store. Existing medication/user tables are untouched. Back up the database before applying migrations as usual.

Set variables in your hosting provider's secret/configuration manager. No `.env` files were changed. Every flag defaults off and accepts only the exact value `true`:

| Variable | Enables |
| --- | --- |
| `PRICE_SYSTEM_ENABLED` | Master price switch |
| `PROFECO_IMPORT_ENABLED` | Official QQP import job |
| `ML_PRICES_ENABLED` | Mercado Libre OAuth and recorded marketplace offers |
| `PARTNER_PRICES_ENABLED` | Partner feed API and partner prices |
| `PARTNER_PORTAL_ENABLED` | Portal and sponsored OTC placements; mutations also require partner prices enabled |

`DATABASE_URL` is the existing Neon connection. Use a restricted database role for the price jobs/API. Do not expose database credentials, OAuth secrets, or partner keys to Expo.

## Reviewed catalog and matching

Provision `price_products(id, active_ingredient, strength, form, ean, prescription_status)` from a trusted reviewed catalog. Composition matching requires **all three** of ingredient, strength and form. EAN further restricts matching when supplied; it never overrides conflicting composition. Case/accents/whitespace are normalized, but brand names, unknown forms, salts, pack sizes, and ambiguous variants are never guessed. Distinct presentations should have distinct IDs and EANs. Requests that cannot distinguish them return no price.

The app accepts optional `activeIngredient`, `strength`, `form`, and `ean` on its medication object. Existing records containing only brand/name and dosage will show no price until enriched with reviewed composition. This is intentional. Unknown prescription status is the default and is ineligible for ads. Only owners should modify catalog classification; pharmacy partners cannot modify it.

Provision `price_stores` with a stable ID and chain. Set `external_place_id` to the exact Google Places ID used by nearby pharmacies so imported prices appear at the correct branch. Chain-name matching alone is insufficient. PROFECO stores receive a deterministic `profeco-…` ID from their chain/address/state/municipality; link these to Places IDs after review.

## Phase 1: monthly PROFECO job

Official sources: [PROFECO open data catalog](https://datos.profeco.gob.mx/) and [QQP field dictionary](https://datos.profeco.gob.mx/docs/qqp/QQP_diccionario_dataset.csv). The catalog currently links yearly RAR archives, for example `https://datos.profeco.gob.mx/docs/qqp/QQP_2026.rar`; this is an official dataset download, not a pharmacy scraper.

Create a reviewed JSON file referenced by `PROFECO_PRODUCT_MAP_FILE`. Keys are the normalized, lowercase `producto|presentacion|marca` tuple from QQP. Values contain `active_ingredient`, `strength`, `form`, and optional `ean` matching the catalog. This avoids inferring ingredient or dosage from commercial labels. Example (replace the key with the actual dataset values):

```json
{
  "exact producto|exact presentacion|exact marca": {
    "active_ingredient": "paracetamol", "strength": "500 mg", "form": "tableta", "ean": "REVIEWED_EAN"
  }
}
```

Install 7-Zip on the job host; set `PROFECO_7Z_PATH` if `7z` is not on PATH. `PROFECO_IMPORT_DIR` chooses the retained audit directory. Optional `PROFECO_DATA_URL` must be an HTTPS URL on `datos.profeco.gob.mx`. The default is the current year's official archive. If the archive contains multiple CSV files, set `PROFECO_CSV_BASENAME` to the dataset filename. Alternatively set `PROFECO_CSV_FILE` to a freshly downloaded/extracted UTF-8 CSV and skip downloading/extraction. Archives and extracted files are retained, not deleted.

Schedule one instance monthly, e.g. cron `0 6 2 * *`, running:

```sh
node server/price-job.js
```

For a controlled CSV backfill: `node server/import-profeco.js /path/qqp.csv 2026-11`. Monthly completion is recorded in Neon; repeated completed months are skipped. Interrupted imports can retry safely with observation uniqueness. Only one importer should run at a time. A failed import may have committed earlier valid observations; retries upsert them. Reports include imported, unmatched, and filtered counts. Review zero/missing medicine results before rollout.

The adapter accepts QQP `producto`, `presentacion`, `marca`, `categoria`/`familia` (must contain `medicamento`), `precio`, `fecharegistro`/`fecha_registro`, `cadenacomercial`/`cadena_comercial`, `direccion`, `estado`, and `municipio`. It supports ISO dates and `DD/MM/YYYY`. Validate headers/encoding against the downloaded dictionary and dataset before enabling: the dictionary could not be fetched in this development environment. Unmatched composition/store identity is skipped. Sources containing no medicines will produce no medicine prices, never fabricated replacements.

## Phase 2: Mercado Libre and partner feeds

Create an authorized Mercado Libre application/account and complete its authorization-code grant outside the app. Configure `ML_CLIENT_ID`, `ML_CLIENT_SECRET`, initial `ML_REFRESH_TOKEN`, and a stable `ML_TOKEN_ENCRYPTION_KEY` (64 hexadecimal characters representing 32 random bytes). The client refreshes via the official OAuth endpoint, caches access tokens, and persists rotated refresh tokens encrypted with AES-256-GCM in Neon. Keep the encryption key in your secret manager; losing it requires reauthorization. Run one ML sync instance to avoid refresh-token rotation races. Official API access/permissions must be validated with your account; failures never fall back to scraping.

Create an owner-reviewed JSON array mapping API item IDs to exact catalog composition and EAN:

```json
[{ "item_id": "MLM123456789", "active_ingredient": "paracetamol", "strength": "500 mg", "form": "tableta", "ean": "REVIEWED_EAN" }]
```

Run `node server/ml-prices.js /path/reviewed-ml-items.json` on your scheduler. Each active MXN listing must return the same GTIN/EAN as its reviewed mapping. Listing titles are never treated as authoritative composition. API observations are timestamped at consultation and appear as a separate online offer, without branch directions. `ML_AFFILIATE_TAG`, when configured, is appended as `matt_tool` to validated HTTPS Mercado Libre Mexico permalinks. Verify that the tag is the tracking tool ID supplied by your affiliate account; affiliate program eligibility is an owner setup requirement.

Provision a pharmacy:

```sql
INSERT INTO price_partners(id,chain,enabled) VALUES('pharmacy-1','Farmacia Ejemplo',true);
INSERT INTO price_stores(id,partner_id,chain,external_place_id)
VALUES('branch-1','pharmacy-1','Farmacia Ejemplo','REVIEWED_GOOGLE_PLACE_ID');
```

Generate a long random partner token. Store only its SHA-256 hex digest in `PRICE_PARTNER_KEYS_JSON`, a JSON object mapping partner IDs to digests. The partner sends `Authorization: Bearer <raw-token>`. Optional `PRICE_ADMIN_TOKEN` grants administration with required `X-Partner-Id`; it is separate from the existing development-only admin routes. Unconfigured keys fail closed. Revoke access by disabling the partner or removing its key. Disabling a partner also hides its feed prices and placements.

`POST /api/partner/prices/feed` accepts `Content-Type: text/csv` (2 MB / 5,000 rows maximum):

```csv
active_ingredient,strength,form,ean,store_id,price_mxn,observed_at
paracetamol,500 mg,tableta,REVIEWED_EAN,branch-1,32.50,2026-11-01T12:00:00Z
```

Every row must match a reviewed product and a branch owned by the authenticated partner. Partner-provided chain, confidence or verification fields are ignored. Validated feeds commit as one transaction; duplicate observation keys update the price and fetch time. Future/invalid observations and nonpositive amounts fail. `GET /api/partner/prices/feed` lists the partner's recent observations, stores, reviewed products, and placements. Feed updates preserve price history; upload newer observations rather than deleting records.

## Phase 3: partner portal and advertising

Open `/partner/prices`. The portal shell is public when enabled; all account data and mutations require the bearer token entered in the password field. Credentials remain in page memory, never URLs or local storage. Use HTTPS. Partners can inspect their feed, upload a CSV, schedule an OTC promotion, and stop their own placement. Product text is rendered as text, not HTML.

`POST /api/partner/prices/placements` takes `product_id,title,starts_at,ends_at`. `POST /api/partner/prices/placements/:id/stop` deactivates an owned placement. Creation requires explicitly classified OTC products both in the API and a database trigger. Rx and unknown classifications cannot be sponsored, including promotions. Public delivery rechecks current classification, partner activation, and date range so catalog changes immediately suppress ineligible ads. Partner promotion titles require owner content review before enabling accounts; there is no automated medical-claim review.

`GET /api/prices/placements` returns current ads with `Patrocinado` and `Consulte a su medico`. The medication refill screen shows them in a separate list header with both texts unconditionally; they never affect price ranking or the lowest-price badge.

## Validation and remaining rollout work

Run `node --test server/price-system.test.js` and `node --check` on changed server JS files. Six tests passed, along with TypeScript/TSX and Expo Babel checks. Android JavaScript export passed to `temp-export/price-system-validation` (Expo emitted a separate `ios.googleServicesFile` configuration warning). Tests cover matching ambiguity/EAN conflicts, freshness boundaries, CSV parsing, cross-partner store rejection, default-off behavior, authentication, OTC rejection, public sponsorship labels, and ML link/flag safety.

No production migration, real dataset import, OAuth grant, affiliate account, partner provisioning, or scheduler deployment was performed here. Live provider/database integration and a device smoke test remain rollout requirements. No native modules changed; this work needs a server deployment and app JavaScript update, not a new native binary.
