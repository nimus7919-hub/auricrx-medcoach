# Herb content maintenance

## Current Spanish revision — 2026-11-03

`src/data/herbDetailsEs.js` now provides individual Spanish uses, evidence, precautions, interactions and dated source URLs for every catalog key. `herbCatalog.js` attaches these details; the Spanish screen renders them instead of the older shared translation summaries. Other locales retain their existing copy. The underlying JSON remains the identity/localization compatibility catalog.

Sources include NCCIH, MedlinePlus, NIH ODS and WHO monographs, with institutional and scientific supplements where the requested collections lack species coverage. WHO volume 2 is read from the e-lactancia mirror because IRIS returned 403. Sources are named accurately rather than uniformly relabeled NCCIH. See [HERB_CONTENT_GAPS.md](HERB_CONTENT_GAPS.md) for source limitations, unresolved taxonomy and unavailable clinical safety data.

The matcher additionally covers hibiscus antihypertensive/antidiabetic classes, chloroquine, hydrochlorothiazide (animal evidence separately sourced), garlic–saquinavir, parsley–vitamin K antagonists, notoginseng saponins–aspirin, dong quai, reishi, holy basil–paracetamol and serotonergic medicines with St. John's wort. Ingredient membership is explicit and finite. Same-source matches merge their ingredient IDs. Existing alert wording, neutral empty state and disclaimer footer remain unchanged. No brand inference or remote medication lookup was added.

Validation: `node scripts/check-herb-review.cjs` parses the changed modules and checks every Spanish catalog entry, sources/dates, legal wording, unchanged alerts/footer and ingredient-match regressions. A device layout check remains outstanding. Thumbnail heights are 170 px in cards and 260 px in details. No native dependency or native configuration changed.

## Historical implementation notes

The notes below describe the previous translation-key content and original image review, superseded for Spanish by the revision above.

Reviewed 2026-11-03. Educational copy is adapted with attribution from NCCIH public-domain text. Images on NCCIH pages may have separate copyrights and were not copied. No MedlinePlus prose is used.

`src/data/herbReview.json` is the 40-entry catalog. `herbCatalog.js` contains static local image requires. The former JS and TS data entry points now re-export this catalog, avoiding inconsistent lists and therapeutic copy. `HerbsScreen.tsx` preserves the existing navigation import and delegates to the JavaScript implementation. No native dependencies were added.

Each specific-source record links to the NCCIH fact sheet actually reviewed. For plants without a reviewed species-specific fact sheet, the app explicitly states this limitation and links to general supplement guidance. It does not attribute species-specific evidence or traditional uses to that general source. Damiana uses the requested editorial historical sentence, followed by the source-coverage limitation. Insufficient evidence labels refer to the stated historical use, not every possible indication. Peppermint's evidence label concerns the leaf; its precautions explicitly distinguish concentrated oil.

General precautions about pregnancy, breastfeeding, children and surgery link separately to [NCCIH: Using Dietary Supplements Wisely](https://www.nccih.nih.gov/health/using-dietary-supplements-wisely). Herb-specific pregnancy, lactation, child, surgery and blood-glucose notes are only included where the linked fact sheet supports them. Absence of a specific warning is not evidence of absence of risk. Aristolochia's kidney and cancer warning additionally links to the [National Cancer Institute](https://www.cancer.gov/about-cancer/causes-prevention/risk/substances/aristolochic-acids); this is clearly attributed to NCI, not NCCIH.

`src/data/herbInteractions.js` maintains NCCIH source URL, actual review date and basis per rule. Class rules list explicit member ingredients; these lists are deliberately finite and not exhaustive. Theoretical relationships remain identified as theoretical in the possible-interactions field and rule basis. Broad liver-metabolism warnings have no personal rule because the source does not identify a reliable finite ingredient list. No rule is inferred from efficacy, a glucose effect alone, or a similar botanical species (e.g. Asian ginseng versus notoginseng).

Matching reads saved `components[].name` and explicit active-ingredient fields. It handles accent/case differences, documented aliases, simple strength suffixes and explicit combination separators. It does not infer ingredients from brand/display names, match substrings, call an AI service, or send medication lists over the network. Unknown ingredients produce no affirmative verdict. Missing ingredient records receive an additional prompt to complete their medication entry. No severity, dose or automatic medication changes are offered. Source and review date appear on every matched alert.

To maintain: verify the exact botanical species and preparation, read the primary source, update assertions and translations in all six languages, then update the date only for sources actually rechecked. Add ingredient aliases and class membership explicitly. Run `node scripts/check-herb-review.cjs`. Review image provenance using `HERB_IMAGE_FIXES.md` before enabling replacement pictures.

Validation does not replace a device accessibility/layout check or professional review of the final localized copy. This change implements the requested editorial controls; it is not a certification of legal compliance.
