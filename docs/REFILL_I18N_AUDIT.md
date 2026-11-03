# Refill and screen localization audit

Second static pass inspected all current JS/TS files in `src/screens` and `components` for JSX text, placeholders, accessibility labels/hints, and alert/toast expressions. Backup/corrupted copies were excluded. Login appearance and animations were unchanged.

## Confirmed leftovers outside the refill sheets

- `src/screens/DocScanScreen.tsx:1267`: PDF success alert includes hardcoded ?Layout?, ?Margins?, and ?Font?, plus the raw `pdfLayout` value.
- `src/screens/DocScanScreen.tsx:1272`: PDF saved alert includes hardcoded ?Location?, ?Layout?, ?Margins?, and ?Font?, plus the raw `pdfLayout` value.

These are listed for follow-up as requested. Brand names (RX MEDCOACH, AURIC), PDF, measurement units, React Native option names, translation keys, style values, and debug logs are not untranslated UI prose. No additional direct English placeholder or accessibility-label literals were identified. Dynamic caller/service text and server-provided content require runtime review; this static scan is not a guarantee that every language path is translated.

## Refill changes

Both sheets now use live translation resources instead of caller-provided labels, including sort values, alerts, form placeholders and contribution feedback. Medication rows use PROFECO presentation data. The medication header shows state/national ranges, pack details, active radius and the requested medicine name. Empty states distinguish an unmatched medicine from no priced stores within the radius.

## Validation

Server syntax, changed TypeScript syntax, presentation examples (30 tablets / 500 mg and 120 ml / 100 mg/5 ml), distance, and es/en JSON checks passed. Full TypeScript check reports missing unrelated dependencies and the existing MedicationAutocomplete props typing issue. Expo export was skipped because the project Babel configuration loads .env files, which this task forbids opening. Live database/location/UI behavior was not exercised.
