import records from './herbReview.json';
import uiI18n from '../i18n';
const placeholder = require('../../assets/icons/herb_emoji_transparent.png');
const images = {
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
