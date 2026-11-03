# Herb image audit — 2026-11-03

## Licensed photo update ? 2026-11-03

The 16 supplied Commons photos now replace the neutral icon for: damiana, chamomile, garlic, litsea_glaucescens, artemisia_annua, mexican_oregano, heliopsis_longipes, lippia_dulcis, astragalus, ganoderma, cinnamon, st_johns_wort, eucalyptus, peppermint, holy_basil, hibiscus. Assets use the existing slug convention at `assets/herbs/<slug>.jpg`; previous PNGs are retained. The historical audit below describes the previous assets, not the new photos.

Author, license, species and Commons page URL are stored in each herb's `imageAttribution` record. These entries have `imageVerified: true`, removing their pending caption. The detail modal displays ?Foto: {author}, {license}, Wikimedia Commons? with links to the license and source. See [HERB_PHOTO_CREDITS.md](HERB_PHOTO_CREDITS.md) for the supplied credits.

The app copy of chamomile.jpg is cropped with jimp-compact to x=230, y=330, width=255, height=280 from the 960?628 source, focusing on chamomile flowers and excluding the poppies. The modification is recorded in its attribution and shown as ?Recorte?. The crop remains under CC BY-SA 4.0. All source files in tmp_herb_photos remain unchanged.

Toronjil de monte, Zarzaparrilla Gris, Epazote, Peric?n, Yauhtli, Ang?lica China, Notoginseng and Regaliz retain the neutral placeholder and pending-verification caption. Other existing image mappings are unchanged. JS/data/assets only; no new native build is required.


All 40 active catalog entries were visually compared with their local files. This is a mismatch audit, not botanical authentication. Existing images may be illustrations; no source/license provenance is inferred. No images were downloaded, deleted or overwritten.

Manzanilla and Ajo have no verified replacement elsewhere among the local herb images. `chamomile_backup.png` is also ginger. No reciprocal mislabeled pair was found that could responsibly be swapped. Incorrect and uncertain pictures now use `assets/icons/herb_emoji_transparent.png`, with a localized pending-verification caption. Ginger remains assigned to ginger.png.

Review contact sheet: [herb-image-review-2026-11-03.jpg](herb-image-review-2026-11-03.jpg).

| Herb (ES / key) | Current local file | What it shows | Needed image / action |
|---|---|---|---|
| Damiana / damiana | `assets/herbs/damiana.png` | Yellow five-petaled flower; plausibly Turnera, species uncertain. | Verified Turnera diffusa flowering branch with diagnostic leaves. Neutral icon until verified. |
| Epazote / epazote | `assets/herbs/epazote.png` | Weedy foliage and seed clusters; plausible epazote. | Verified Dysphania ambrosioides foliage and flower clusters. Neutral icon until verified. |
| Diente de león / dandelion | `assets/herbs/dandelion.png` | Yellow composite flower and toothed leaves. | Retained; recognizable dandelion illustration. |
| Manzanilla / chamomile | `assets/herbs/chamomile.png` | Ginger rhizome and yellow slices; duplicate of ginger.png. | Matricaria recutita flowers with white rays, yellow centers and finely divided leaves. Neutral icon until verified. |
| Ajo / garlic | `assets/herbs/garlic.png` | Narrow green leaves and dry grass/root-like material; no recognizable garlic bulbs. | Allium sativum whole bulbs and separated cloves. Neutral icon until verified. |
| Autosanadora / prunella_vulgaris | `assets/herbs/prunella_vulgaris.png` | Purple flowers in a compact terminal head. | Retained; consistent with Prunella vulgaris. |
| Yauhtli / Clavel de tierra / tagetes_lucida | `assets/herbs/tagetes_lucida.png` | Large yellow daisy-like flower heads; inconsistent with small clustered Tagetes lucida heads. | Verified Tagetes lucida flowering plant; do not substitute pericon.png without verification. Neutral icon until verified. |
| Toronjil de monte / clinopodium_mexicanum | `assets/herbs/clinopodium_mexicanum.png` | Purple flowers and broad mint-like leaves; identity uncertain. | Verified Clinopodium mexicanum flowering shoot. Neutral icon until verified. |
| Laurel Mexicano / litsea_glaucescens | `assets/herbs/litsea_glaucescens.png` | Glossy leaves and small clustered buds; identity uncertain. | Verified Litsea glaucescens branch with diagnostic leaves and flowers. Neutral icon until verified. |
| Artemisa dulce / artemisia_annua | `assets/herbs/artemisia_annua.png` | Illustrated deeply divided foliage, no diagnostic flowers. | Verified Artemisia annua showing foliage and inflorescences. Neutral icon until verified. |
| Aloe vera / aloe_vera | `assets/herbs/aloe_vera.png` | Potted succulent rosette with fleshy pointed leaves. | Retained; recognizable aloe. |
| Jengibre / ginger | `assets/herbs/ginger.png` | Ginger rhizome with pale yellow slices. | Retained; correct ginger. No reciprocal chamomile asset exists. |
| Equinácea / echinacea | `assets/herbs/echinacea.png` | Pink drooping rays around a raised orange cone. | Retained; recognizable Echinacea. |
| Ginkgo / ginkgo_biloba | `assets/herbs/ginkgo_biloba.png` | Distinctive fan-shaped leaves. | Retained; recognizable Ginkgo. |
| Notoginseng / notoginseng | `assets/herbs/notoginseng.png` | Illustrated palmate foliage, roots and nodules; identity unverified. | Verified Panax notoginseng plant and root. Neutral icon until verified. |
| Cúrcuma / turmeric | `assets/herbs/turmeric.png` | Orange rhizomes, orange slices and yellow-orange powder. | Retained; recognizable turmeric. |
| Romero / rosemary | `assets/herbs/rosemary.png` | Sprig with narrow needle-like leaves. | Retained; recognizable rosemary. |
| Perejil / parsley | `assets/herbs/parsley.png` | Bunch of flat lobed parsley-like leaves. | Retained; recognizable flat-leaf parsley. |
| Hinojo / fennel | `assets/herbs/fennel.png` | White fennel bulb and fine green fronds. | Retained; recognizable fennel. |
| Aristolochia odoratissima / aristolochia | `assets/herbs/aristolochia.png` | Labeled botanical illustration of a pipe-shaped flower and vine. | Retained at genus level; not suitable for species identification. |
| Orégano Mexicano / mexican_oregano | `assets/herbs/mexican_oregano.png` | Broad textured mint-like leaves; species uncertain. | Verified Lippia graveolens flowering branch. Neutral icon until verified. |
| Yerba Mansa / yerba_mansa | `assets/herbs/yerba_mansa.png` | White-bracted cone and broad leaves; plausible Anemopsis. | Retained; consistent with Anemopsis californica. |
| Zarzaparrilla Gris / gray_sarsaparilla | `assets/herbs/gray_sarsaparilla.png` | Illustrated compound foliage, uncertain botanical identity. | Verified source specimen for the intended gray sarsaparilla taxon; confirm scientific name first. Neutral icon until verified. |
| Pericón / Cempasúchil / pericon | `assets/herbs/pericon.png` | Labeled narrow-leaved plant without flowers. | Verified Tagetes lucida flowering plant; same species as tagetes_lucida. Neutral icon until verified. |
| Chilcuague / heliopsis_longipes | `assets/herbs/heliopsis_longipes.png` | Generic yellow daisy-like flowers; species uncertain. | Verified Heliopsis longipes flowering plant. Neutral icon until verified. |
| Hierba Dulce / lippia_dulcis | `assets/herbs/lippia_dulcis.png` | Labeled potted green plant; label alone cannot establish identity. | Verified Lippia dulcis flowering shoot. Neutral icon until verified. |
| Menta Coreana / agastache_rugosa | `assets/herbs/agastache_rugosa.png` | Purple flower spikes and toothed leaves; plausible Agastache. | Retained; species still needs provenance. |
| Astrágalo / astragalus | `assets/herbs/astragalus.png` | Labeled illustration with pinnate leaves; no diagnostic flowers. | Verified Astragalus membranaceus plant and root. Neutral icon until verified. |
| Regaliz / liquorice | `assets/herbs/liquorice.png` | Purple flower spike with foliage; identity uncertain. | Verified Glycyrrhiza uralensis foliage, flowers and roots. Neutral icon until verified. |
| Angélica China / angelica_sinensis | `assets/herbs/angelica_sinensis.png` | White umbel and divided leaves; species not distinguishable. | Verified Angelica sinensis with diagnostic foliage and inflorescence. Neutral icon until verified. |
| Seta Lingzhi / ganoderma | `assets/herbs/ganoderma.png` | Glossy orange-brown shelf fungus; species unconfirmed. | Verified Ganoderma specimen with species and provenance. Neutral icon until verified. |
| Canela / cinnamon | `assets/herbs/cinnamon.png` | Tree bark and glossy leaves; species not verifiable. | Verified Cinnamomum cassia bark quills and foliage. Neutral icon until verified. |
| Hipérico / st_johns_wort | `assets/herbs/st_johns_wort.png` | Yellow flowers on a small shrub; diagnostic features unclear. | Verified Hypericum perforatum flowers and backlit perforated leaves. Neutral icon until verified. |
| Eucalipto / eucalyptus | `assets/herbs/eucalyptus.png` | Whole tree from a distance; leaves not visible. | Verified Eucalyptus with diagnostic foliage and fruit. Neutral icon until verified. |
| Menta Piperita / peppermint | `assets/herbs/peppermint.png` | Broad serrated mint leaves; Mentha species cannot be confirmed. | Verified Mentha x piperita flowering shoot. Neutral icon until verified. |
| Cardo Mariano / milk_thistle | `assets/herbs/milk_thistle.png` | Purple flower head and white-marbled spiny leaves. | Retained; recognizable milk thistle. |
| Lavanda / lavender | `assets/herbs/lavender.png` | Purple flower spikes on a dense low shrub. | Retained; recognizable lavender. |
| Albahaca Sagrada / holy_basil | `assets/herbs/holy_basil.png` | Purple upright spike with small leaves; species uncertain. | Verified Ocimum tenuiflorum flowering shoot. Neutral icon until verified. |
| Hibisco / hibiscus | `assets/herbs/hibiscus.png` | Orange-red ornamental flowers; not diagnostic of tea hibiscus. | Verified Hibiscus sabdariffa red calyces and flowers. Neutral icon until verified. |
| Cilantro / cilantro | `assets/herbs/cilantro.png` | Broad lobed cilantro-like foliage. | Retained; recognizable cilantro foliage. |

`assets/herbs/chamomile_backup.png` was inspected only as an additional candidate: it also shows ginger and is not used. No excluded backup_* directory was accessed.

Replacement acceptance: verified scientific name, recognizable diagnostic parts, documented owner/license, and human review before changing the static mapping. A filename or an embedded species label is not authentication.
