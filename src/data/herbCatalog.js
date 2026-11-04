import records from './herbReview.json';
import uiI18n from '../i18n';
import { HERB_DETAILS_ES } from './herbDetailsEs';
const placeholder = require('../../assets/icons/herb_emoji_transparent.png');
export const HERB_IMAGE_PLACEHOLDER = placeholder;
const images = {
  'damiana': require('../../assets/herbs/damiana.jpg'),
  'chamomile': require('../../assets/herbs/chamomile.jpg'),
  'garlic': require('../../assets/herbs/garlic.jpg'),
  'litsea_glaucescens': require('../../assets/herbs/litsea_glaucescens.jpg'),
  'artemisia_annua': require('../../assets/herbs/artemisia_annua.jpg'),
  'mexican_oregano': require('../../assets/herbs/mexican_oregano.jpg'),
  'heliopsis_longipes': require('../../assets/herbs/heliopsis_longipes.jpg'),
  'lippia_dulcis': require('../../assets/herbs/lippia_dulcis.jpg'),
  'astragalus': require('../../assets/herbs/astragalus.jpg'),
  'ganoderma': require('../../assets/herbs/ganoderma.jpg'),
  'cinnamon': require('../../assets/herbs/cinnamon.jpg'),
  'st_johns_wort': require('../../assets/herbs/st_johns_wort.jpg'),
  'eucalyptus': require('../../assets/herbs/eucalyptus.jpg'),
  'peppermint': require('../../assets/herbs/peppermint.jpg'),
  'holy_basil': require('../../assets/herbs/holy_basil.jpg'),
  'hibiscus': require('../../assets/herbs/hibiscus.jpg'),
  'agastache_rugosa': require('../../assets/herbs/agastache_rugosa.png'),
  'aloe_vera': require('../../assets/herbs/aloe_vera.png'),
  'cilantro': { uri: 'https://upload.wikimedia.org/wikipedia/commons/7/7c/Coriandrum_sativum_003.JPG' },
  'dandelion': require('../../assets/herbs/dandelion.png'),
  'echinacea': require('../../assets/herbs/echinacea.png'),
  'fennel': require('../../assets/herbs/fennel.png'),
  'ginger': require('../../assets/herbs/ginger.png'),
  'ginkgo_biloba': require('../../assets/herbs/ginkgo_biloba.png'),
  'lavender': require('../../assets/herbs/lavender.png'),
  'milk_thistle': require('../../assets/herbs/milk_thistle.png'),
  'parsley': require('../../assets/herbs/parsley.png'),
  'prunella_vulgaris': require('../../assets/herbs/prunella_vulgaris.png'),
  'rosemary': require('../../assets/herbs/rosemary.png'),
  'turmeric': require('../../assets/herbs/turmeric.png'),
};
export const HERBS = records.map(record => ({
  ...record, detailsEs: HERB_DETAILS_ES[record.key], image: images[record.key] || placeholder,
  imageVerified: !!images[record.key],
  ...(record.key === 'cilantro' ? { imageAttribution: {
    species: 'Coriandrum sativum', author: 'H. Zell; recorte de Epipelagic',
    license: 'CC BY-SA 3.0', url: 'https://commons.wikimedia.org/wiki/File:Coriandrum_sativum_003.JPG',
  } } : {}),
}));
// Compatibility for the controller's existing educational context import.
export const herbs = HERBS.map(herb => ({
  ...herb,
  get name() { return herb.names[uiI18n.language?.split('-')[0]] || herb.names.en; },
}));
