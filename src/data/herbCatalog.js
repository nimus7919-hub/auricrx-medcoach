import records from './herbReview.json';
import uiI18n from '../i18n';
const placeholder = require('../../assets/icons/herb_emoji_transparent.png');
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
  'aristolochia': require('../../assets/herbs/aristolochia.png'),
  'cilantro': require('../../assets/herbs/cilantro.png'),
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
  'yerba_mansa': require('../../assets/herbs/yerba_mansa.png'),
};
export const HERBS = records.map(record => ({ ...record, image: images[record.key] || placeholder }));
// Compatibility for the controller's existing educational context import.
export const herbs = HERBS.map(herb => ({
  ...herb,
  get name() { return herb.names[uiI18n.language?.split('-')[0]] || herb.names.en; },
}));
