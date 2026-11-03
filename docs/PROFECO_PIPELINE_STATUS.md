# PROFECO QQP pipeline status

Audit date: 2026-11-03. Production facts supplied by the owner, not independently queried: Neon database "Admin Data Base Auric Rx", qqp_prices approximately 794,000 rows / 415 MB, fecha 2026-05-04 through 2026-07-31; branch approximately 500 MB against a 1 GB cap. No production connection, import, cleanup, environment-file access, or deployment was performed.

## How imports actually run

- `server/index.js` installs `server/profeco.js` with neonClient. That module creates the QQP schema and schedules a run 120 seconds after process startup and every seven days thereafter using in-process timers. This QQP path has no PRICE_SYSTEM_ENABLED / PROFECO_IMPORT_ENABLED gate. Timers are not a durable scheduler: sleep, downtime and restarts affect execution; each replica gets its own timers and only a process-local overlap guard.
- The same run is available through authenticated `POST /api/admin/ingest/profeco` when ADMIN_TOKEN is configured. It runs QQP and DENUE, then links stores. Failed provider runs are logged; HTTP callers get a failed result. There is no persisted QQP job success timestamp or alert for stale max(fecha).
- Discovery queries `https://www.datos.gob.mx/api/3/action/package_show?id=programa_quien_es_quien_precios_YEAR` for the previous and current UTC year (2025 then 2026 today). No fixed July resource list exists in code. Each package supplies resource IDs and URLs. Missing previous-year packages can be skipped, but other previous-year failures abort before the current year is reached.
- Each resource is read through `https://www.datos.gob.mx/api/3/action/datastore_search`, filtering categoria=Medicamentos, pages of 10,000 sorted by _id. Only an initial request failure triggers CSV fallback to that resource's HTTPS URL. A successful empty DataStore response does not trigger CSV fallback. Fallback downloads and parses the complete CSV in memory.
- `qqp_sources` is a completion ledger, not the discovery list. A resource with row_count > 0 is permanently skipped even if the publisher appends newer dates or replaces its content under the same ID. No last_modified, ETag, content hash or source max date is compared. Inserts use ON CONFLICT(resource_id,_id) DO NOTHING, so simply retrying also cannot update corrected rows under existing IDs. CSV fallback assigns positional IDs; source rewrites require a carefully designed reconciliation policy.
- `row_count` counts valid parsed rows, not actual inserted rows; date-window filtering and conflicts can reduce inserts. `loaded_at` defaults on insert but is not refreshed by its conflict update. Neither field proves freshness.
- `server/price-job.js` and `server/import-profeco.js` are a separate price pipeline writing `prices`, `price_stores` and `price_import_runs`, NOT qqp_prices/qqp_sources. The monthly job downloads the official yearly archive, needs 7-Zip and a reviewed medicine mapping, and is feature-gated. `docs/price-system.md` recommends a monthly external cron (`0 6 2 * *`); that is documentation, not an installed schedule. Running this job will not refresh qqp_prices.
- No Render YAML, QQP cron declaration or GitHub workflow was found in the inspected root, server/, scripts/ and .github paths. server/package.json only declares start/dev. Render dashboard jobs or other externally configured schedulers cannot be established from this checkout.

## Why the stored data stops at July 31

The exact production cause is **unconfirmed** without deployed logs, scheduler state, the live CKAN resource inventory, and a read-only comparison with qqp_sources. The code has no July cutoff. The strongest code-level explanations are:

1. A previously loaded resource was extended in place and is now permanently skipped by resource_id. This is a demonstrated importer limitation, not proof that PROFECO used that publication pattern.
2. CKAN package discovery/DataStore or resource download is failing, or the CKAN mirror has not added newer resources. A package failure prevents even CSV fallback because resource URLs have not yet been discovered. One failed resource aborts later resources; previous-year failures can block current-year discovery.
3. The deployed process is not staying up long enough for the initial run, is sleeping, is running older code, or has recurring import errors. In-process weekly timers alone do not prove successful weekly imports.
4. New files may use a different schema: this path accepts only fecha_registro beginning YYYY-MM-DD (slashes replaced), positive prices and _id. DD/MM/YYYY dates are filtered out; category spelling/case changes may yield empty results. Zero valid rows are retried but do not raise a freshness alarm.

Retention is not evidence of the cause: the inspected cleanup already used max(fecha) minus 90 days before this audit. With newest=2026-07-31 its cutoff is 2026-05-02, consistent with retaining the supplied May-July range. A today-based cutoff on November 3 would instead be August 5 and could wipe that entire range.

## Public-source checks and limits

- The [official PROFECO open-data catalog](https://datos.profeco.gob.mx/) was readable through the web tool. It labels the 2026 QQP archive **updated October 2026** and links [QQP_2026.rar](https://datos.profeco.gob.mx/docs/qqp/QQP_2026.rar), the same default URL used by price-job.js. The archive link was recognized as application/vnd.rar, which the web tool cannot inspect. October is the catalog's update label, not a verified maximum observation date or proof of newer medicine records. The catalog labels this archive canasta basica; medicine coverage must be verified inside the file.
- The [public QQP presentation history](https://qqph.profeco.gob.mx/) lists November 2, 2026. This is evidence of continued public reporting, not evidence that downloadable medicine records or CKAN resources cover that date.
- The [2026 datos.gob.mx dataset page](https://www.datos.gob.mx/dataset/programa_quien_es_quien_precios_2026) returned 403 through the web tool. The exact package_show API URL was inaccessible there; direct Node fetches for both 2025/2026 package_show returned EACCES in this restricted workspace. This does not establish that production gets the same response.
- The legacy `https://datos.profeco.gob.mx/datos_abiertos/qqp.php` returned 404. The current catalog and yearly archive remain the useful public links.

Conclusion: do not claim the portal stopped publishing on July 31. There are later publication indicators, but the latest downloadable medicine observation period and CKAN resource list could not be verified here.

## Retention change

`pruneQQP()` now explicitly snapshots max(fecha) in a statement-level CTE, requires a non-null anchor, and deletes only rows strictly older than newest minus 90 days AND strictly older than newest. It never uses today and cannot delete the newest date. Empty tables delete nothing; boundary dates survive. The behavior was already anchored correctly; this change makes the guards explicit. No cleanup was executed.

Pruning runs only after all QQP resources finish, before catalog matching. Earlier failures skip cleanup. The import's insertion window and resource-age skip also use the stored maximum, while `/api/prices` uses the newest matched observation. Source ledger entries remain after pruning. No other qqp_prices deletion was found in the inspected server/scripts paths.

`VACUUM ANALYZE` is attempted after pruning. Ordinary vacuum allows space reuse but does not generally shrink the relation file; do not expect the displayed 415 MB to fall immediately. Do not run VACUUM FULL or a large backfill casually with the supplied capacity limit: rewrites/index work and transient storage need headroom. This audit added no such operation.

## Recommended fix and schedule

1. In the deployed environment, inspect logs for PROFECO resource/ingest/retention lines and upstream errors, confirm the deployed module version, uptime and any Render dashboard cron. Compare the 2025/2026 package resource IDs, URLs and last_modified values to qqp_sources. For IDs already loaded, check whether their remote content extends beyond July. For new IDs, inspect category/date fields and DataStore counts. Do this read-only first; do not clear the completion ledger to force a bulk reload.
2. Download/extract the official 2026 archive outside production using sufficient temporary disk, validate its actual medicine coverage and maximum fecha_registro, then compare with the CKAN feed. If only the official archive is current, add a bounded, streaming adapter that writes the existing QQP tables. Reusing price-job.js unchanged writes the wrong tables.
3. Replace permanent ID-only completion with a resource manifest containing version/hash, remote modification time, observed date range, actual insert/update counts and completion status. Refresh changed resources with stable observation IDs and deliberate correction handling; do not blindly combine positional CSV IDs with DataStore IDs. Validate headers/category/date format and alert on zero valid medicine rows. Isolate resource failures and prioritize current-year discovery.
4. Use one durable external daily scheduler, suggested **06:00 UTC daily (`0 6 * * *`)**, for catalog discovery and only new/changed resource imports. Retain explicit authenticated manual retry. Use a database lock and durable job state to prevent overlap across replicas and scheduler/manual runs; replace or disable the in-process timers when that scheduler is deployed. A daily check does not imply the provider publishes daily. Neither a new cron nor the broader ingestion repair was deployed by this audit.
5. Record last attempt/success, discovered/changed/skipped resources, per-resource failure and source maximum date. Alert on repeated errors or no successful check for 48 hours; separately alert when observation age exceeds an owner-selected publication allowance (for example 45 days). Continue showing the actual as_of date in the app.
6. Before any authorized backfill, estimate medicine-row/index/storage growth against the 1 GB cap. Process newest periods first, bound ingestion to a validated newest-source 90-day window, and prune incrementally with the protected stored maximum. The present importer prunes only at the end, so a large catch-up can exceed available space before cleanup. Consider a capacity increase if bounded processing still lacks headroom.

## Validation

Only source/documentation edits and syntax checks were performed; no application startup or importer invocation (both could connect to production), and no live cleanup. Server-only change: deploy the server update; no new Expo/native build is needed.
