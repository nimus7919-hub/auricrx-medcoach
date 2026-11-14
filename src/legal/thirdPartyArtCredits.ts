/**
 * Third-party artwork credits shown on the "Open-source licenses" screen.
 *
 * Single source of truth for the in-app credits. Keep in sync with THIRD_PARTY_NOTICES.md
 * (a unit test checks that every entry below appears there).
 * Titles, authors and license names are proper names and are not translated.
 */
export type ArtCreditLayer = 'skin' | 'muscles' | 'vessels' | 'bones' | 'organs';

export interface ArtCredit {
  id: string;
  /** Body map layer(s) the artwork is used for (label from bodyMap.layers.<layer>). */
  layers: ArtCreditLayer[];
  title: string;
  author: string;
  license: string;
  licenseUrl: string | null;
  sourceUrl: string;
}

export const THIRD_PARTY_ART_CREDITS: ArtCredit[] = [
  {
    id: 'silhouette',
    layers: ['skin'],
    title: 'Silhouette humain asexue anterieur posterieur.svg',
    author: 'Christophe Dang Ngoc Chan (Cdang)',
    license: 'CC0 1.0',
    licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Silhouette_humain_asexue_anterieur_posterieur.svg',
  },
  {
    id: 'muscles',
    layers: ['muscles', 'skin'],
    title: 'Muscles front and back.svg',
    author: 'OpenStax & Tomáš Kebert & umimeto.org',
    license: 'CC BY-SA 4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Muscles_front_and_back.svg',
  },
  {
    id: 'vessels',
    layers: ['vessels'],
    title: 'Circulatory System no tags.svg',
    author: 'Mariana Ruiz Villarreal (LadyofHats)',
    license: 'Public domain',
    licenseUrl: null,
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Circulatory_System_no_tags.svg',
  },
  {
    id: 'skeleton-front',
    layers: ['bones'],
    title: 'Human skeleton front no-text no-color.svg',
    author: 'Mariana Ruiz Villarreal (LadyofHats)',
    license: 'Public domain',
    licenseUrl: null,
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Human_skeleton_front_no-text_no-color.svg',
  },
  {
    id: 'skeleton-back',
    layers: ['bones'],
    title: 'Human skeleton back no-text no-color.svg',
    author: 'Mariana Ruiz Villarreal (LadyofHats)',
    license: 'Public domain',
    licenseUrl: null,
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Human_skeleton_back_no-text_no-color.svg',
  },
  {
    id: 'organs',
    layers: ['organs'],
    title: 'Organes du corps humain.svg',
    author: 'MothsART',
    license: 'CC0 1.0',
    licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Organes_du_corps_humain.svg',
  },
];
