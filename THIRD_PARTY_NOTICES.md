# Third-party notices

## Body pain map artwork (`src/components/bodyMap/art/`)

The anatomy artwork used by the pre-visit body pain map is adapted from openly licensed
illustrations on Wikimedia Commons. All files were converted to compact path data, warped to
one shared body silhouette, simplified (svgo, precision 1) and recoloured for the app theme.
Organ shapes are drawn as visual context only; the app never labels them with organ names.

Licenses were checked on each file's Commons description page on 2026-11-14.

| Layer / file(s) | Source file | Author | License | Changes |
| --- | --- | --- | --- | --- |
| Body silhouette and surface lines: `art/skin.ts` | [Silhouette humain asexue anterieur posterieur.svg](https://commons.wikimedia.org/wiki/File:Silhouette_humain_asexue_anterieur_posterieur.svg) | Christophe Dang Ngoc Chan (Cdang), derived from his "Silhouette femme homme anterieur posterieur.svg" | [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/) | Filled outline, inset shading, recoloured |
| Muscles: `art/musclesFront.ts`, `art/musclesBack.ts` (also drawn as faint contours on the skin layer) | [Muscles front and back.svg](https://commons.wikimedia.org/wiki/File:Muscles_front_and_back.svg) | OpenStax & Tomáš Kebert & umimeto.org | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) | Split front/back, warped to the silhouette, simplified, recoloured |
| Blood vessels: `art/vesselsFront.ts`, `art/vesselsBack.ts` | [Circulatory System no tags.svg](https://commons.wikimedia.org/wiki/File:Circulatory_System_no_tags.svg) | Mariana Ruiz Villarreal (LadyofHats) | Public domain | Body outline removed, warped to the silhouette; back view is the mirrored front, simplified, recoloured |
| Bones (front): `art/bonesFront.ts` | [Human skeleton front no-text no-color.svg](https://commons.wikimedia.org/wiki/File:Human_skeleton_front_no-text_no-color.svg) | Mariana Ruiz Villarreal (LadyofHats) | Public domain | Warped to the silhouette, simplified, recoloured |
| Bones (back): `art/bonesBack.ts` | [Human skeleton back no-text no-color.svg](https://commons.wikimedia.org/wiki/File:Human_skeleton_back_no-text_no-color.svg) | Mariana Ruiz Villarreal (LadyofHats) | Public domain | Scaled to the silhouette, simplified, recoloured |
| Organs: `art/organsFront.ts`, `art/organsBack.ts` | [Organes du corps humain.svg](https://commons.wikimedia.org/wiki/File:Organes_du_corps_humain.svg) | MothsART | [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/) | Individual organs extracted and placed inside the body, fine texture removed, recoloured |

### ShareAlike notice

The muscle artwork is adapted from a CC BY-SA 4.0 work. The adapted muscle data
(`src/components/bodyMap/art/musclesFront.ts` and `musclesBack.ts`) is therefore shared under
[CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/), with credit to OpenStax,
Tomáš Kebert and umimeto.org. This applies to those artwork files only, not to the rest of the app.
