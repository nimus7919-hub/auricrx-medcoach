import uiI18n from "../i18n";
export type Herb = {
  id: string;
  image: any; // require local asset or remote URL string
  names: { en: string; es: string; zh: string };
  details: {
    origin: { en: string; es: string; zh: string };
    poisonous: boolean;
    summary: { en: string; es: string; zh: string };
  };
};

// Static image mapping - React Native requires static require() calls
const herbImages = {
  'damiana': require('../../assets/herbs/damiana.png'),
  'epazote': require('../../assets/herbs/epazote.png'),
  'dandelion': require('../../assets/herbs/dandelion.png'),
  'chamomile': require('../../assets/herbs/chamomile.png'),
  'garlic': require('../../assets/herbs/garlic.png'),
  'prunella_vulgaris': require('../../assets/herbs/prunella_vulgaris.png'),
  'tagetes_lucida': require('../../assets/herbs/tagetes_lucida.png'),
  'clinopodium_mexicanum': require('../../assets/herbs/clinopodium_mexicanum.png'),
  'litsea_glaucescens': require('../../assets/herbs/litsea_glaucescens.png'),
  'artemisia_annua': require('../../assets/herbs/artemisia_annua.png'),
  'aloe_vera': require('../../assets/herbs/aloe_vera.png'),
  'ginger': require('../../assets/herbs/ginger.png'),
  'echinacea': require('../../assets/herbs/echinacea.png'),
  'ginkgo_biloba': require('../../assets/herbs/ginkgo_biloba.png'),
  'notoginseng': require('../../assets/herbs/notoginseng.png'),
  'turmeric': require('../../assets/herbs/turmeric.png'),
  'rosemary': require('../../assets/herbs/rosemary.png'),
  'parsley': require('../../assets/herbs/parsley.png'),
  'fennel': require('../../assets/herbs/fennel.png'),
  'aristolochia': require('../../assets/herbs/aristolochia.png'),
  'mexican_oregano': require('../../assets/herbs/mexican_oregano.png'),
  'yerba_mansa': require('../../assets/herbs/yerba_mansa.png'),
  'gray_sarsaparilla': require('../../assets/herbs/gray_sarsaparilla.png'),
  'pericon': require('../../assets/herbs/pericon.png'),
  'heliopsis_longipes': require('../../assets/herbs/heliopsis_longipes.png'),
  'lippia_dulcis': require('../../assets/herbs/lippia_dulcis.png'),
  'agastache_rugosa': require('../../assets/herbs/agastache_rugosa.png'),
  'astragalus': require('../../assets/herbs/astragalus.png'),
  'liquorice': require('../../assets/herbs/liquorice.png'),
  'angelica_sinensis': require('../../assets/herbs/angelica_sinensis.png'),
  'ganoderma': require('../../assets/herbs/ganoderma.png'),
  'cinnamon': require('../../assets/herbs/cinnamon.png'),
  'st_johns_wort': require('../../assets/herbs/st_johns_wort.png'),
  'eucalyptus': require('../../assets/herbs/eucalyptus.png'),
  'peppermint': require('../../assets/herbs/peppermint.png'),
  'milk_thistle': require('../../assets/herbs/milk_thistle.png'),
  'lavender': require('../../assets/herbs/lavender.png'),
  'holy_basil': require('../../assets/herbs/holy_basil.png'),
  'hibiscus': require('../../assets/herbs/hibiscus.png'),
  'cilantro': require('../../assets/herbs/cilantro.png'),
  'default': require('../../assets/icons/herb_emoji_transparent.png')
};

// Helper function to get herb image with fallback
const getHerbImage = (herbName: string) => {
  return herbImages[herbName as keyof typeof herbImages] || herbImages.default;
};

export const HERBS: Herb[] = [
  // 1) Damiana (Turnera diffusa) – Mexico / US
{
  id: '1',
  image: getHerbImage('damiana'),
  names: { get en() { return uiI18n.t("localized.herbs.HERBS.item0.names", { lng: 'en', returnObjects: true }) as any; }, get es() { return uiI18n.t("localized.herbs.HERBS.item0.names", { lng: 'es', returnObjects: true }) as any; }, get zh() { return uiI18n.t("localized.herbs.HERBS.item0.names", { lng: 'zh', returnObjects: true }) as any; } },
  details: {
    origin: { get en() { return uiI18n.t("localized.herbs.HERBS.item0.details.origin", { lng: 'en', returnObjects: true }) as any; }, get es() { return uiI18n.t("localized.herbs.HERBS.item0.details.origin", { lng: 'es', returnObjects: true }) as any; }, get zh() { return uiI18n.t("localized.herbs.HERBS.item0.details.origin", { lng: 'zh', returnObjects: true }) as any; } },
    poisonous: false,
    summary: { get en() { return uiI18n.t("localized.herbs.HERBS.item0.details.summary", { lng: 'en', returnObjects: true }) as any; }, get es() { return uiI18n.t("localized.herbs.HERBS.item0.details.summary", { lng: 'es', returnObjects: true }) as any; }, get zh() { return uiI18n.t("localized.herbs.HERBS.item0.details.summary", { lng: 'zh', returnObjects: true }) as any; } }
  }
},

// 2) Epazote (Dysphania ambrosioides) – Mexico
{
  id: '2',
  image: getHerbImage('epazote'),
  names: { get en() { return uiI18n.t("localized.herbs.HERBS.item1.names", { lng: 'en', returnObjects: true }) as any; }, get es() { return uiI18n.t("localized.herbs.HERBS.item1.names", { lng: 'es', returnObjects: true }) as any; }, get zh() { return uiI18n.t("localized.herbs.HERBS.item1.names", { lng: 'zh', returnObjects: true }) as any; } },
  details: {
    origin: { get en() { return uiI18n.t("localized.herbs.HERBS.item1.details.origin", { lng: 'en', returnObjects: true }) as any; }, get es() { return uiI18n.t("localized.herbs.HERBS.item1.details.origin", { lng: 'es', returnObjects: true }) as any; }, get zh() { return uiI18n.t("localized.herbs.HERBS.item1.details.origin", { lng: 'zh', returnObjects: true }) as any; } },
    poisonous: false,
    summary: { get en() { return uiI18n.t("localized.herbs.HERBS.item1.details.summary", { lng: 'en', returnObjects: true }) as any; }, get es() { return uiI18n.t("localized.herbs.HERBS.item1.details.summary", { lng: 'es', returnObjects: true }) as any; }, get zh() { return uiI18n.t("localized.herbs.HERBS.item1.details.summary", { lng: 'zh', returnObjects: true }) as any; } }
  }
},

// 3) Dandelion (Taraxacum officinale) – Mexico / North America / China
{
  id: '3',
  image: getHerbImage('dandelion'),
  names: { get en() { return uiI18n.t("localized.herbs.HERBS.item2.names", { lng: 'en', returnObjects: true }) as any; }, get es() { return uiI18n.t("localized.herbs.HERBS.item2.names", { lng: 'es', returnObjects: true }) as any; }, get zh() { return uiI18n.t("localized.herbs.HERBS.item2.names", { lng: 'zh', returnObjects: true }) as any; } },
  details: {
    origin: { get en() { return uiI18n.t("localized.herbs.HERBS.item2.details.origin", { lng: 'en', returnObjects: true }) as any; }, get es() { return uiI18n.t("localized.herbs.HERBS.item2.details.origin", { lng: 'es', returnObjects: true }) as any; }, get zh() { return uiI18n.t("localized.herbs.HERBS.item2.details.origin", { lng: 'zh', returnObjects: true }) as any; } },
    poisonous: false,
    summary: { get en() { return uiI18n.t("localized.herbs.HERBS.item2.details.summary", { lng: 'en', returnObjects: true }) as any; }, get es() { return uiI18n.t("localized.herbs.HERBS.item2.details.summary", { lng: 'es', returnObjects: true }) as any; }, get zh() { return uiI18n.t("localized.herbs.HERBS.item2.details.summary", { lng: 'zh', returnObjects: true }) as any; } }
  }
},

// 4) Chamomile (Matricaria recutita) – Europe; widely used in US/Mexico/China
{
  id: '4',
  image: getHerbImage('chamomile'),
  names: { get en() { return uiI18n.t("localized.herbs.HERBS.item3.names", { lng: 'en', returnObjects: true }) as any; }, get es() { return uiI18n.t("localized.herbs.HERBS.item3.names", { lng: 'es', returnObjects: true }) as any; }, get zh() { return uiI18n.t("localized.herbs.HERBS.item3.names", { lng: 'zh', returnObjects: true }) as any; } },
  details: {
    origin: { get en() { return uiI18n.t("localized.herbs.HERBS.item3.details.origin", { lng: 'en', returnObjects: true }) as any; }, get es() { return uiI18n.t("localized.herbs.HERBS.item3.details.origin", { lng: 'es', returnObjects: true }) as any; }, get zh() { return uiI18n.t("localized.herbs.HERBS.item3.details.origin", { lng: 'zh', returnObjects: true }) as any; } },
    poisonous: false,
    summary: { get en() { return uiI18n.t("localized.herbs.HERBS.item3.details.summary", { lng: 'en', returnObjects: true }) as any; }, get es() { return uiI18n.t("localized.herbs.HERBS.item3.details.summary", { lng: 'es', returnObjects: true }) as any; }, get zh() { return uiI18n.t("localized.herbs.HERBS.item3.details.summary", { lng: 'zh', returnObjects: true }) as any; } }
  }
},

// 5) Garlic (Allium sativum) – US/Mexico/China
{
  id: '5',
  image: getHerbImage('garlic'),
  names: { get en() { return uiI18n.t("localized.herbs.HERBS.item4.names", { lng: 'en', returnObjects: true }) as any; }, get es() { return uiI18n.t("localized.herbs.HERBS.item4.names", { lng: 'es', returnObjects: true }) as any; }, get zh() { return uiI18n.t("localized.herbs.HERBS.item4.names", { lng: 'zh', returnObjects: true }) as any; } },
  details: {
    origin: { get en() { return uiI18n.t("localized.herbs.HERBS.item4.details.origin", { lng: 'en', returnObjects: true }) as any; }, get es() { return uiI18n.t("localized.herbs.HERBS.item4.details.origin", { lng: 'es', returnObjects: true }) as any; }, get zh() { return uiI18n.t("localized.herbs.HERBS.item4.details.origin", { lng: 'zh', returnObjects: true }) as any; } },
    poisonous: false,
    summary: { get en() { return uiI18n.t("localized.herbs.HERBS.item4.details.summary", { lng: 'en', returnObjects: true }) as any; }, get es() { return uiI18n.t("localized.herbs.HERBS.item4.details.summary", { lng: 'es', returnObjects: true }) as any; }, get zh() { return uiI18n.t("localized.herbs.HERBS.item4.details.summary", { lng: 'zh', returnObjects: true }) as any; } }
  }
},

// 6) Prunella vulgaris (Selfheal) – North America / China
{
  id: '6',
  image: getHerbImage("prunella_vulgaris"),
  names: { get en() { return uiI18n.t("localized.herbs.HERBS.item5.names", { lng: 'en', returnObjects: true }) as any; }, get es() { return uiI18n.t("localized.herbs.HERBS.item5.names", { lng: 'es', returnObjects: true }) as any; }, get zh() { return uiI18n.t("localized.herbs.HERBS.item5.names", { lng: 'zh', returnObjects: true }) as any; } },
  details: {
    origin: { get en() { return uiI18n.t("localized.herbs.HERBS.item5.details.origin", { lng: 'en', returnObjects: true }) as any; }, get es() { return uiI18n.t("localized.herbs.HERBS.item5.details.origin", { lng: 'es', returnObjects: true }) as any; }, get zh() { return uiI18n.t("localized.herbs.HERBS.item5.details.origin", { lng: 'zh', returnObjects: true }) as any; } },
    poisonous: false,
    summary: { get en() { return uiI18n.t("localized.herbs.HERBS.item5.details.summary", { lng: 'en', returnObjects: true }) as any; }, get es() { return uiI18n.t("localized.herbs.HERBS.item5.details.summary", { lng: 'es', returnObjects: true }) as any; }, get zh() { return uiI18n.t("localized.herbs.HERBS.item5.details.summary", { lng: 'zh', returnObjects: true }) as any; } }
  }
},

// 7) Tagetes lucida (Mexican Marigold / Yauhtli) – Mexico
{
  id: '7',
  image: getHerbImage("tagetes_lucida"),
  names: { get en() { return uiI18n.t("localized.herbs.HERBS.item6.names", { lng: 'en', returnObjects: true }) as any; }, get es() { return uiI18n.t("localized.herbs.HERBS.item6.names", { lng: 'es', returnObjects: true }) as any; }, get zh() { return uiI18n.t("localized.herbs.HERBS.item6.names", { lng: 'zh', returnObjects: true }) as any; } },
  details: {
    origin: { get en() { return uiI18n.t("localized.herbs.HERBS.item6.details.origin", { lng: 'en', returnObjects: true }) as any; }, get es() { return uiI18n.t("localized.herbs.HERBS.item6.details.origin", { lng: 'es', returnObjects: true }) as any; }, get zh() { return uiI18n.t("localized.herbs.HERBS.item6.details.origin", { lng: 'zh', returnObjects: true }) as any; } },
    poisonous: false,
    summary: { get en() { return uiI18n.t("localized.herbs.HERBS.item6.details.summary", { lng: 'en', returnObjects: true }) as any; }, get es() { return uiI18n.t("localized.herbs.HERBS.item6.details.summary", { lng: 'es', returnObjects: true }) as any; }, get zh() { return uiI18n.t("localized.herbs.HERBS.item6.details.summary", { lng: 'zh', returnObjects: true }) as any; } }
  }
},

// 8) Clinopodium mexicanum (“Toronjil de monte”) – Mexico
{
  id: '8',
  image: getHerbImage("clinopodium_mexicanum"),
  names: { get en() { return uiI18n.t("localized.herbs.HERBS.item7.names", { lng: 'en', returnObjects: true }) as any; }, get es() { return uiI18n.t("localized.herbs.HERBS.item7.names", { lng: 'es', returnObjects: true }) as any; }, get zh() { return uiI18n.t("localized.herbs.HERBS.item7.names", { lng: 'zh', returnObjects: true }) as any; } },
  details: {
    origin: { get en() { return uiI18n.t("localized.herbs.HERBS.item7.details.origin", { lng: 'en', returnObjects: true }) as any; }, get es() { return uiI18n.t("localized.herbs.HERBS.item7.details.origin", { lng: 'es', returnObjects: true }) as any; }, get zh() { return uiI18n.t("localized.herbs.HERBS.item7.details.origin", { lng: 'zh', returnObjects: true }) as any; } },
    poisonous: false,
    summary: { get en() { return uiI18n.t("localized.herbs.HERBS.item7.details.summary", { lng: 'en', returnObjects: true }) as any; }, get es() { return uiI18n.t("localized.herbs.HERBS.item7.details.summary", { lng: 'es', returnObjects: true }) as any; }, get zh() { return uiI18n.t("localized.herbs.HERBS.item7.details.summary", { lng: 'zh', returnObjects: true }) as any; } }
  }
},

// 9) Litsea glaucescens (Mexican Bay Leaf) – Mexico
{
  id: '9',
  image: getHerbImage("litsea_glaucescens"),
  names: { get en() { return uiI18n.t("localized.herbs.HERBS.item8.names", { lng: 'en', returnObjects: true }) as any; }, get es() { return uiI18n.t("localized.herbs.HERBS.item8.names", { lng: 'es', returnObjects: true }) as any; }, get zh() { return uiI18n.t("localized.herbs.HERBS.item8.names", { lng: 'zh', returnObjects: true }) as any; } },
  details: {
    origin: { get en() { return uiI18n.t("localized.herbs.HERBS.item8.details.origin", { lng: 'en', returnObjects: true }) as any; }, get es() { return uiI18n.t("localized.herbs.HERBS.item8.details.origin", { lng: 'es', returnObjects: true }) as any; }, get zh() { return uiI18n.t("localized.herbs.HERBS.item8.details.origin", { lng: 'zh', returnObjects: true }) as any; } },
    poisonous: false,
    summary: { get en() { return uiI18n.t("localized.herbs.HERBS.item8.details.summary", { lng: 'en', returnObjects: true }) as any; }, get es() { return uiI18n.t("localized.herbs.HERBS.item8.details.summary", { lng: 'es', returnObjects: true }) as any; }, get zh() { return uiI18n.t("localized.herbs.HERBS.item8.details.summary", { lng: 'zh', returnObjects: true }) as any; } }
  }
},

// 10) Artemisia annua (Sweet Wormwood) – China
{
  id: '10',
  image: getHerbImage("artemisia_annua"),
  names: { get en() { return uiI18n.t("localized.herbs.HERBS.item9.names", { lng: 'en', returnObjects: true }) as any; }, get es() { return uiI18n.t("localized.herbs.HERBS.item9.names", { lng: 'es', returnObjects: true }) as any; }, get zh() { return uiI18n.t("localized.herbs.HERBS.item9.names", { lng: 'zh', returnObjects: true }) as any; } },
  details: {
    origin: { get en() { return uiI18n.t("localized.herbs.HERBS.item9.details.origin", { lng: 'en', returnObjects: true }) as any; }, get es() { return uiI18n.t("localized.herbs.HERBS.item9.details.origin", { lng: 'es', returnObjects: true }) as any; }, get zh() { return uiI18n.t("localized.herbs.HERBS.item9.details.origin", { lng: 'zh', returnObjects: true }) as any; } },
    poisonous: false,
    summary: { get en() { return uiI18n.t("localized.herbs.HERBS.item9.details.summary", { lng: 'en', returnObjects: true }) as any; }, get es() { return uiI18n.t("localized.herbs.HERBS.item9.details.summary", { lng: 'es', returnObjects: true }) as any; }, get zh() { return uiI18n.t("localized.herbs.HERBS.item9.details.summary", { lng: 'zh', returnObjects: true }) as any; } }
  }
},

// 11) Aloe Vera – Mexico / US / China
{
  id: '11',
  image: getHerbImage("aloe_vera"),
  names: { get en() { return uiI18n.t("localized.herbs.HERBS.item10.names", { lng: 'en', returnObjects: true }) as any; }, get es() { return uiI18n.t("localized.herbs.HERBS.item10.names", { lng: 'es', returnObjects: true }) as any; }, get zh() { return uiI18n.t("localized.herbs.HERBS.item10.names", { lng: 'zh', returnObjects: true }) as any; } },
  details: {
    origin: { get en() { return uiI18n.t("localized.herbs.HERBS.item10.details.origin", { lng: 'en', returnObjects: true }) as any; }, get es() { return uiI18n.t("localized.herbs.HERBS.item10.details.origin", { lng: 'es', returnObjects: true }) as any; }, get zh() { return uiI18n.t("localized.herbs.HERBS.item10.details.origin", { lng: 'zh', returnObjects: true }) as any; } },
    poisonous: false,
    summary: { get en() { return uiI18n.t("localized.herbs.HERBS.item10.details.summary", { lng: 'en', returnObjects: true }) as any; }, get es() { return uiI18n.t("localized.herbs.HERBS.item10.details.summary", { lng: 'es', returnObjects: true }) as any; }, get zh() { return uiI18n.t("localized.herbs.HERBS.item10.details.summary", { lng: 'zh', returnObjects: true }) as any; } }
  }
},

// 12) Ginger (Zingiber officinale) – US / China / Mexico
{
  id: '12',
  image: getHerbImage("ginger"),
  names: { get en() { return uiI18n.t("localized.herbs.HERBS.item11.names", { lng: 'en', returnObjects: true }) as any; }, get es() { return uiI18n.t("localized.herbs.HERBS.item11.names", { lng: 'es', returnObjects: true }) as any; }, get zh() { return uiI18n.t("localized.herbs.HERBS.item11.names", { lng: 'zh', returnObjects: true }) as any; } },
  details: {
    origin: { get en() { return uiI18n.t("localized.herbs.HERBS.item11.details.origin", { lng: 'en', returnObjects: true }) as any; }, get es() { return uiI18n.t("localized.herbs.HERBS.item11.details.origin", { lng: 'es', returnObjects: true }) as any; }, get zh() { return uiI18n.t("localized.herbs.HERBS.item11.details.origin", { lng: 'zh', returnObjects: true }) as any; } },
    poisonous: false,
    summary: { get en() { return uiI18n.t("localized.herbs.HERBS.item11.details.summary", { lng: 'en', returnObjects: true }) as any; }, get es() { return uiI18n.t("localized.herbs.HERBS.item11.details.summary", { lng: 'es', returnObjects: true }) as any; }, get zh() { return uiI18n.t("localized.herbs.HERBS.item11.details.summary", { lng: 'zh', returnObjects: true }) as any; } }
  }
},

// 13) Echinacea – US
{
  id: '13',
  image: getHerbImage("echinacea"),
  names: { get en() { return uiI18n.t("localized.herbs.HERBS.item12.names", { lng: 'en', returnObjects: true }) as any; }, get es() { return uiI18n.t("localized.herbs.HERBS.item12.names", { lng: 'es', returnObjects: true }) as any; }, get zh() { return uiI18n.t("localized.herbs.HERBS.item12.names", { lng: 'zh', returnObjects: true }) as any; } },
  details: {
    origin: { get en() { return uiI18n.t("localized.herbs.HERBS.item12.details.origin", { lng: 'en', returnObjects: true }) as any; }, get es() { return uiI18n.t("localized.herbs.HERBS.item12.details.origin", { lng: 'es', returnObjects: true }) as any; }, get zh() { return uiI18n.t("localized.herbs.HERBS.item12.details.origin", { lng: 'zh', returnObjects: true }) as any; } },
    poisonous: false,
    summary: { get en() { return uiI18n.t("localized.herbs.HERBS.item12.details.summary", { lng: 'en', returnObjects: true }) as any; }, get es() { return uiI18n.t("localized.herbs.HERBS.item12.details.summary", { lng: 'es', returnObjects: true }) as any; }, get zh() { return uiI18n.t("localized.herbs.HERBS.item12.details.summary", { lng: 'zh', returnObjects: true }) as any; } }
  }
},

// 14) Ginkgo biloba – US / China
{
  id: '14',
  image: getHerbImage("ginkgo_biloba"),
  names: { get en() { return uiI18n.t("localized.herbs.HERBS.item13.names", { lng: 'en', returnObjects: true }) as any; }, get es() { return uiI18n.t("localized.herbs.HERBS.item13.names", { lng: 'es', returnObjects: true }) as any; }, get zh() { return uiI18n.t("localized.herbs.HERBS.item13.names", { lng: 'zh', returnObjects: true }) as any; } },
  details: {
    origin: { get en() { return uiI18n.t("localized.herbs.HERBS.item13.details.origin", { lng: 'en', returnObjects: true }) as any; }, get es() { return uiI18n.t("localized.herbs.HERBS.item13.details.origin", { lng: 'es', returnObjects: true }) as any; }, get zh() { return uiI18n.t("localized.herbs.HERBS.item13.details.origin", { lng: 'zh', returnObjects: true }) as any; } },
    poisonous: false,
    summary: { get en() { return uiI18n.t("localized.herbs.HERBS.item13.details.summary", { lng: 'en', returnObjects: true }) as any; }, get es() { return uiI18n.t("localized.herbs.HERBS.item13.details.summary", { lng: 'es', returnObjects: true }) as any; }, get zh() { return uiI18n.t("localized.herbs.HERBS.item13.details.summary", { lng: 'zh', returnObjects: true }) as any; } }
  }
},

// 15) Panax notoginseng – China
{
  id: '15',
  image: getHerbImage("notoginseng"),
  names: { get en() { return uiI18n.t("localized.herbs.HERBS.item14.names", { lng: 'en', returnObjects: true }) as any; }, get es() { return uiI18n.t("localized.herbs.HERBS.item14.names", { lng: 'es', returnObjects: true }) as any; }, get zh() { return uiI18n.t("localized.herbs.HERBS.item14.names", { lng: 'zh', returnObjects: true }) as any; } },
  details: {
    origin: { get en() { return uiI18n.t("localized.herbs.HERBS.item14.details.origin", { lng: 'en', returnObjects: true }) as any; }, get es() { return uiI18n.t("localized.herbs.HERBS.item14.details.origin", { lng: 'es', returnObjects: true }) as any; }, get zh() { return uiI18n.t("localized.herbs.HERBS.item14.details.origin", { lng: 'zh', returnObjects: true }) as any; } },
    poisonous: false,
    summary: { get en() { return uiI18n.t("localized.herbs.HERBS.item14.details.summary", { lng: 'en', returnObjects: true }) as any; }, get es() { return uiI18n.t("localized.herbs.HERBS.item14.details.summary", { lng: 'es', returnObjects: true }) as any; }, get zh() { return uiI18n.t("localized.herbs.HERBS.item14.details.summary", { lng: 'zh', returnObjects: true }) as any; } }
  }
},

// 16) Turmeric (Curcuma longa) – US / China / Mexico
{
  id: '16',
  image: getHerbImage("turmeric"),
  names: { get en() { return uiI18n.t("localized.herbs.HERBS.item15.names", { lng: 'en', returnObjects: true }) as any; }, get es() { return uiI18n.t("localized.herbs.HERBS.item15.names", { lng: 'es', returnObjects: true }) as any; }, get zh() { return uiI18n.t("localized.herbs.HERBS.item15.names", { lng: 'zh', returnObjects: true }) as any; } },
  details: {
    origin: { get en() { return uiI18n.t("localized.herbs.HERBS.item15.details.origin", { lng: 'en', returnObjects: true }) as any; }, get es() { return uiI18n.t("localized.herbs.HERBS.item15.details.origin", { lng: 'es', returnObjects: true }) as any; }, get zh() { return uiI18n.t("localized.herbs.HERBS.item15.details.origin", { lng: 'zh', returnObjects: true }) as any; } },
    poisonous: false,
    summary: { get en() { return uiI18n.t("localized.herbs.HERBS.item15.details.summary", { lng: 'en', returnObjects: true }) as any; }, get es() { return uiI18n.t("localized.herbs.HERBS.item15.details.summary", { lng: 'es', returnObjects: true }) as any; }, get zh() { return uiI18n.t("localized.herbs.HERBS.item15.details.summary", { lng: 'zh', returnObjects: true }) as any; } }
  }
},

// 17) Rosemary – US / Mexico
{
  id: '17',
  image: getHerbImage("rosemary"),
  names: { get en() { return uiI18n.t("localized.herbs.HERBS.item16.names", { lng: 'en', returnObjects: true }) as any; }, get es() { return uiI18n.t("localized.herbs.HERBS.item16.names", { lng: 'es', returnObjects: true }) as any; }, get zh() { return uiI18n.t("localized.herbs.HERBS.item16.names", { lng: 'zh', returnObjects: true }) as any; } },
  details: {
    origin: { get en() { return uiI18n.t("localized.herbs.HERBS.item16.details.origin", { lng: 'en', returnObjects: true }) as any; }, get es() { return uiI18n.t("localized.herbs.HERBS.item16.details.origin", { lng: 'es', returnObjects: true }) as any; }, get zh() { return uiI18n.t("localized.herbs.HERBS.item16.details.origin", { lng: 'zh', returnObjects: true }) as any; } },
    poisonous: false,
    summary: { get en() { return uiI18n.t("localized.herbs.HERBS.item16.details.summary", { lng: 'en', returnObjects: true }) as any; }, get es() { return uiI18n.t("localized.herbs.HERBS.item16.details.summary", { lng: 'es', returnObjects: true }) as any; }, get zh() { return uiI18n.t("localized.herbs.HERBS.item16.details.summary", { lng: 'zh', returnObjects: true }) as any; } }
  }
},

// 18) Parsley (Petroselinum crispum) – US / Mexico
{
  id: '18',
  image: getHerbImage("parsley"),
  names: { get en() { return uiI18n.t("localized.herbs.HERBS.item17.names", { lng: 'en', returnObjects: true }) as any; }, get es() { return uiI18n.t("localized.herbs.HERBS.item17.names", { lng: 'es', returnObjects: true }) as any; }, get zh() { return uiI18n.t("localized.herbs.HERBS.item17.names", { lng: 'zh', returnObjects: true }) as any; } },
  details: {
    origin: { get en() { return uiI18n.t("localized.herbs.HERBS.item17.details.origin", { lng: 'en', returnObjects: true }) as any; }, get es() { return uiI18n.t("localized.herbs.HERBS.item17.details.origin", { lng: 'es', returnObjects: true }) as any; }, get zh() { return uiI18n.t("localized.herbs.HERBS.item17.details.origin", { lng: 'zh', returnObjects: true }) as any; } },
    poisonous: false,
    summary: { get en() { return uiI18n.t("localized.herbs.HERBS.item17.details.summary", { lng: 'en', returnObjects: true }) as any; }, get es() { return uiI18n.t("localized.herbs.HERBS.item17.details.summary", { lng: 'es', returnObjects: true }) as any; }, get zh() { return uiI18n.t("localized.herbs.HERBS.item17.details.summary", { lng: 'zh', returnObjects: true }) as any; } }
  }
},

// 19) Fennel – US / Mexico / China
{
  id: '19',
  image: getHerbImage("fennel"),
  names: { get en() { return uiI18n.t("localized.herbs.HERBS.item18.names", { lng: 'en', returnObjects: true }) as any; }, get es() { return uiI18n.t("localized.herbs.HERBS.item18.names", { lng: 'es', returnObjects: true }) as any; }, get zh() { return uiI18n.t("localized.herbs.HERBS.item18.names", { lng: 'zh', returnObjects: true }) as any; } },
  details: {
    origin: { get en() { return uiI18n.t("localized.herbs.HERBS.item18.details.origin", { lng: 'en', returnObjects: true }) as any; }, get es() { return uiI18n.t("localized.herbs.HERBS.item18.details.origin", { lng: 'es', returnObjects: true }) as any; }, get zh() { return uiI18n.t("localized.herbs.HERBS.item18.details.origin", { lng: 'zh', returnObjects: true }) as any; } },
    poisonous: false,
    summary: { get en() { return uiI18n.t("localized.herbs.HERBS.item18.details.summary", { lng: 'en', returnObjects: true }) as any; }, get es() { return uiI18n.t("localized.herbs.HERBS.item18.details.summary", { lng: 'es', returnObjects: true }) as any; }, get zh() { return uiI18n.t("localized.herbs.HERBS.item18.details.summary", { lng: 'zh', returnObjects: true }) as any; } }
  }
},

// 20) Aristolochia odoratissima (Pipe vine) – Mexico (caution)
{
  id: '20',
  image: getHerbImage("aristolochia"),
  names: { get en() { return uiI18n.t("localized.herbs.HERBS.item19.names", { lng: 'en', returnObjects: true }) as any; }, get es() { return uiI18n.t("localized.herbs.HERBS.item19.names", { lng: 'es', returnObjects: true }) as any; }, get zh() { return uiI18n.t("localized.herbs.HERBS.item19.names", { lng: 'zh', returnObjects: true }) as any; } },
  details: {
    origin: { get en() { return uiI18n.t("localized.herbs.HERBS.item19.details.origin", { lng: 'en', returnObjects: true }) as any; }, get es() { return uiI18n.t("localized.herbs.HERBS.item19.details.origin", { lng: 'es', returnObjects: true }) as any; }, get zh() { return uiI18n.t("localized.herbs.HERBS.item19.details.origin", { lng: 'zh', returnObjects: true }) as any; } },
    poisonous: true,
    summary: { get en() { return uiI18n.t("localized.herbs.HERBS.item19.details.summary", { lng: 'en', returnObjects: true }) as any; }, get es() { return uiI18n.t("localized.herbs.HERBS.item19.details.summary", { lng: 'es', returnObjects: true }) as any; }, get zh() { return uiI18n.t("localized.herbs.HERBS.item19.details.summary", { lng: 'zh', returnObjects: true }) as any; } }
  }
},

// 21) Mexican Oregano (Lippia graveolens) – Mexico / US
{
  id: '21',
  image: getHerbImage("mexican_oregano"),
  names: { get en() { return uiI18n.t("localized.herbs.HERBS.item20.names", { lng: 'en', returnObjects: true }) as any; }, get es() { return uiI18n.t("localized.herbs.HERBS.item20.names", { lng: 'es', returnObjects: true }) as any; }, get zh() { return uiI18n.t("localized.herbs.HERBS.item20.names", { lng: 'zh', returnObjects: true }) as any; } },
  details: {
    origin: { get en() { return uiI18n.t("localized.herbs.HERBS.item20.details.origin", { lng: 'en', returnObjects: true }) as any; }, get es() { return uiI18n.t("localized.herbs.HERBS.item20.details.origin", { lng: 'es', returnObjects: true }) as any; }, get zh() { return uiI18n.t("localized.herbs.HERBS.item20.details.origin", { lng: 'zh', returnObjects: true }) as any; } },
    poisonous: false,
    summary: { get en() { return uiI18n.t("localized.herbs.HERBS.item20.details.summary", { lng: 'en', returnObjects: true }) as any; }, get es() { return uiI18n.t("localized.herbs.HERBS.item20.details.summary", { lng: 'es', returnObjects: true }) as any; }, get zh() { return uiI18n.t("localized.herbs.HERBS.item20.details.summary", { lng: 'zh', returnObjects: true }) as any; } }
  }
},

// 22) Yerba Mansa (Anemopsis californica) – US / Mexico
{
  id: '22',
  image: getHerbImage("yerba_mansa"),
  names: { get en() { return uiI18n.t("localized.herbs.HERBS.item21.names", { lng: 'en', returnObjects: true }) as any; }, get es() { return uiI18n.t("localized.herbs.HERBS.item21.names", { lng: 'es', returnObjects: true }) as any; }, get zh() { return uiI18n.t("localized.herbs.HERBS.item21.names", { lng: 'zh', returnObjects: true }) as any; } },
  details: {
    origin: { get en() { return uiI18n.t("localized.herbs.HERBS.item21.details.origin", { lng: 'en', returnObjects: true }) as any; }, get es() { return uiI18n.t("localized.herbs.HERBS.item21.details.origin", { lng: 'es', returnObjects: true }) as any; }, get zh() { return uiI18n.t("localized.herbs.HERBS.item21.details.origin", { lng: 'zh', returnObjects: true }) as any; } },
    poisonous: false,
    summary: { get en() { return uiI18n.t("localized.herbs.HERBS.item21.details.summary", { lng: 'en', returnObjects: true }) as any; }, get es() { return uiI18n.t("localized.herbs.HERBS.item21.details.summary", { lng: 'es', returnObjects: true }) as any; }, get zh() { return uiI18n.t("localized.herbs.HERBS.item21.details.summary", { lng: 'zh', returnObjects: true }) as any; } }
  }
},

// 23) Gray Sarsaparilla (Smilax aristolochiifolia) – Mexico
{
  id: '23',
  image: getHerbImage("gray_sarsaparilla"),
  names: { get en() { return uiI18n.t("localized.herbs.HERBS.item22.names", { lng: 'en', returnObjects: true }) as any; }, get es() { return uiI18n.t("localized.herbs.HERBS.item22.names", { lng: 'es', returnObjects: true }) as any; }, get zh() { return uiI18n.t("localized.herbs.HERBS.item22.names", { lng: 'zh', returnObjects: true }) as any; } },
  details: {
    origin: { get en() { return uiI18n.t("localized.herbs.HERBS.item22.details.origin", { lng: 'en', returnObjects: true }) as any; }, get es() { return uiI18n.t("localized.herbs.HERBS.item22.details.origin", { lng: 'es', returnObjects: true }) as any; }, get zh() { return uiI18n.t("localized.herbs.HERBS.item22.details.origin", { lng: 'zh', returnObjects: true }) as any; } },
    poisonous: false,
    summary: { get en() { return uiI18n.t("localized.herbs.HERBS.item22.details.summary", { lng: 'en', returnObjects: true }) as any; }, get es() { return uiI18n.t("localized.herbs.HERBS.item22.details.summary", { lng: 'es', returnObjects: true }) as any; }, get zh() { return uiI18n.t("localized.herbs.HERBS.item22.details.summary", { lng: 'zh', returnObjects: true }) as any; } }
  }
},

// 24) Pericón (Tagetes erecta) – Mexico
{
  id: '24',
  image: getHerbImage("pericon"),
  names: { get en() { return uiI18n.t("localized.herbs.HERBS.item23.names", { lng: 'en', returnObjects: true }) as any; }, get es() { return uiI18n.t("localized.herbs.HERBS.item23.names", { lng: 'es', returnObjects: true }) as any; }, get zh() { return uiI18n.t("localized.herbs.HERBS.item23.names", { lng: 'zh', returnObjects: true }) as any; } },
  details: {
    origin: { get en() { return uiI18n.t("localized.herbs.HERBS.item23.details.origin", { lng: 'en', returnObjects: true }) as any; }, get es() { return uiI18n.t("localized.herbs.HERBS.item23.details.origin", { lng: 'es', returnObjects: true }) as any; }, get zh() { return uiI18n.t("localized.herbs.HERBS.item23.details.origin", { lng: 'zh', returnObjects: true }) as any; } },
    poisonous: false,
    summary: { get en() { return uiI18n.t("localized.herbs.HERBS.item23.details.summary", { lng: 'en', returnObjects: true }) as any; }, get es() { return uiI18n.t("localized.herbs.HERBS.item23.details.summary", { lng: 'es', returnObjects: true }) as any; }, get zh() { return uiI18n.t("localized.herbs.HERBS.item23.details.summary", { lng: 'zh', returnObjects: true }) as any; } }
  }
},

// 25) Heliopsis longipes (Chilcuague) – Mexico
{
  id: '25',
  image: getHerbImage("heliopsis_longipes"),
  names: { get en() { return uiI18n.t("localized.herbs.HERBS.item24.names", { lng: 'en', returnObjects: true }) as any; }, get es() { return uiI18n.t("localized.herbs.HERBS.item24.names", { lng: 'es', returnObjects: true }) as any; }, get zh() { return uiI18n.t("localized.herbs.HERBS.item24.names", { lng: 'zh', returnObjects: true }) as any; } },
  details: {
    origin: { get en() { return uiI18n.t("localized.herbs.HERBS.item24.details.origin", { lng: 'en', returnObjects: true }) as any; }, get es() { return uiI18n.t("localized.herbs.HERBS.item24.details.origin", { lng: 'es', returnObjects: true }) as any; }, get zh() { return uiI18n.t("localized.herbs.HERBS.item24.details.origin", { lng: 'zh', returnObjects: true }) as any; } },
    poisonous: false,
    summary: { get en() { return uiI18n.t("localized.herbs.HERBS.item24.details.summary", { lng: 'en', returnObjects: true }) as any; }, get es() { return uiI18n.t("localized.herbs.HERBS.item24.details.summary", { lng: 'es', returnObjects: true }) as any; }, get zh() { return uiI18n.t("localized.herbs.HERBS.item24.details.summary", { lng: 'zh', returnObjects: true }) as any; } }
  }
},

// 26) Lippia dulcis (Aztec Sweet Herb) – Mexico
{
  id: '26',
  image: getHerbImage("lippia_dulcis"),
  names: { get en() { return uiI18n.t("localized.herbs.HERBS.item25.names", { lng: 'en', returnObjects: true }) as any; }, get es() { return uiI18n.t("localized.herbs.HERBS.item25.names", { lng: 'es', returnObjects: true }) as any; }, get zh() { return uiI18n.t("localized.herbs.HERBS.item25.names", { lng: 'zh', returnObjects: true }) as any; } },
  details: {
    origin: { get en() { return uiI18n.t("localized.herbs.HERBS.item25.details.origin", { lng: 'en', returnObjects: true }) as any; }, get es() { return uiI18n.t("localized.herbs.HERBS.item25.details.origin", { lng: 'es', returnObjects: true }) as any; }, get zh() { return uiI18n.t("localized.herbs.HERBS.item25.details.origin", { lng: 'zh', returnObjects: true }) as any; } },
    poisonous: false,
    summary: { get en() { return uiI18n.t("localized.herbs.HERBS.item25.details.summary", { lng: 'en', returnObjects: true }) as any; }, get es() { return uiI18n.t("localized.herbs.HERBS.item25.details.summary", { lng: 'es', returnObjects: true }) as any; }, get zh() { return uiI18n.t("localized.herbs.HERBS.item25.details.summary", { lng: 'zh', returnObjects: true }) as any; } }
  }
},

// 27) Agastache rugosa (Korean Mint) – China / US
{
  id: '27',
  image: getHerbImage("agastache_rugosa"),
  names: { get en() { return uiI18n.t("localized.herbs.HERBS.item26.names", { lng: 'en', returnObjects: true }) as any; }, get es() { return uiI18n.t("localized.herbs.HERBS.item26.names", { lng: 'es', returnObjects: true }) as any; }, get zh() { return uiI18n.t("localized.herbs.HERBS.item26.names", { lng: 'zh', returnObjects: true }) as any; } },
  details: {
    origin: { get en() { return uiI18n.t("localized.herbs.HERBS.item26.details.origin", { lng: 'en', returnObjects: true }) as any; }, get es() { return uiI18n.t("localized.herbs.HERBS.item26.details.origin", { lng: 'es', returnObjects: true }) as any; }, get zh() { return uiI18n.t("localized.herbs.HERBS.item26.details.origin", { lng: 'zh', returnObjects: true }) as any; } },
    poisonous: false,
    summary: { get en() { return uiI18n.t("localized.herbs.HERBS.item26.details.summary", { lng: 'en', returnObjects: true }) as any; }, get es() { return uiI18n.t("localized.herbs.HERBS.item26.details.summary", { lng: 'es', returnObjects: true }) as any; }, get zh() { return uiI18n.t("localized.herbs.HERBS.item26.details.summary", { lng: 'zh', returnObjects: true }) as any; } }
  }
},

// 28) Astragalus (Astragalus membranaceus) – China
{
  id: '28',
  image: getHerbImage("astragalus"),
  names: { get en() { return uiI18n.t("localized.herbs.HERBS.item27.names", { lng: 'en', returnObjects: true }) as any; }, get es() { return uiI18n.t("localized.herbs.HERBS.item27.names", { lng: 'es', returnObjects: true }) as any; }, get zh() { return uiI18n.t("localized.herbs.HERBS.item27.names", { lng: 'zh', returnObjects: true }) as any; } },
  details: {
    origin: { get en() { return uiI18n.t("localized.herbs.HERBS.item27.details.origin", { lng: 'en', returnObjects: true }) as any; }, get es() { return uiI18n.t("localized.herbs.HERBS.item27.details.origin", { lng: 'es', returnObjects: true }) as any; }, get zh() { return uiI18n.t("localized.herbs.HERBS.item27.details.origin", { lng: 'zh', returnObjects: true }) as any; } },
    poisonous: false,
    summary: { get en() { return uiI18n.t("localized.herbs.HERBS.item27.details.summary", { lng: 'en', returnObjects: true }) as any; }, get es() { return uiI18n.t("localized.herbs.HERBS.item27.details.summary", { lng: 'es', returnObjects: true }) as any; }, get zh() { return uiI18n.t("localized.herbs.HERBS.item27.details.summary", { lng: 'zh', returnObjects: true }) as any; } }
  }
},

// 29) Liquorice (Glycyrrhiza uralensis) – China
{
  id: '29',
  image: getHerbImage("liquorice"),
  names: { get en() { return uiI18n.t("localized.herbs.HERBS.item28.names", { lng: 'en', returnObjects: true }) as any; }, get es() { return uiI18n.t("localized.herbs.HERBS.item28.names", { lng: 'es', returnObjects: true }) as any; }, get zh() { return uiI18n.t("localized.herbs.HERBS.item28.names", { lng: 'zh', returnObjects: true }) as any; } },
  details: {
    origin: { get en() { return uiI18n.t("localized.herbs.HERBS.item28.details.origin", { lng: 'en', returnObjects: true }) as any; }, get es() { return uiI18n.t("localized.herbs.HERBS.item28.details.origin", { lng: 'es', returnObjects: true }) as any; }, get zh() { return uiI18n.t("localized.herbs.HERBS.item28.details.origin", { lng: 'zh', returnObjects: true }) as any; } },
    poisonous: false,
    summary: { get en() { return uiI18n.t("localized.herbs.HERBS.item28.details.summary", { lng: 'en', returnObjects: true }) as any; }, get es() { return uiI18n.t("localized.herbs.HERBS.item28.details.summary", { lng: 'es', returnObjects: true }) as any; }, get zh() { return uiI18n.t("localized.herbs.HERBS.item28.details.summary", { lng: 'zh', returnObjects: true }) as any; } }
  }
},

// 30) Angelica sinensis (Dong Quai) – China
{
  id: '30',
  image: getHerbImage("angelica_sinensis"),
  names: { get en() { return uiI18n.t("localized.herbs.HERBS.item29.names", { lng: 'en', returnObjects: true }) as any; }, get es() { return uiI18n.t("localized.herbs.HERBS.item29.names", { lng: 'es', returnObjects: true }) as any; }, get zh() { return uiI18n.t("localized.herbs.HERBS.item29.names", { lng: 'zh', returnObjects: true }) as any; } },
  details: {
    origin: { get en() { return uiI18n.t("localized.herbs.HERBS.item29.details.origin", { lng: 'en', returnObjects: true }) as any; }, get es() { return uiI18n.t("localized.herbs.HERBS.item29.details.origin", { lng: 'es', returnObjects: true }) as any; }, get zh() { return uiI18n.t("localized.herbs.HERBS.item29.details.origin", { lng: 'zh', returnObjects: true }) as any; } },
    poisonous: false,
    summary: { get en() { return uiI18n.t("localized.herbs.HERBS.item29.details.summary", { lng: 'en', returnObjects: true }) as any; }, get es() { return uiI18n.t("localized.herbs.HERBS.item29.details.summary", { lng: 'es', returnObjects: true }) as any; }, get zh() { return uiI18n.t("localized.herbs.HERBS.item29.details.summary", { lng: 'zh', returnObjects: true }) as any; } }
  }
},

// 31) Ganoderma (Lingzhi) – China / US
{
  id: '31',
  image: getHerbImage("ganoderma"),
  names: { get en() { return uiI18n.t("localized.herbs.HERBS.item30.names", { lng: 'en', returnObjects: true }) as any; }, get es() { return uiI18n.t("localized.herbs.HERBS.item30.names", { lng: 'es', returnObjects: true }) as any; }, get zh() { return uiI18n.t("localized.herbs.HERBS.item30.names", { lng: 'zh', returnObjects: true }) as any; } },
  details: {
    origin: { get en() { return uiI18n.t("localized.herbs.HERBS.item30.details.origin", { lng: 'en', returnObjects: true }) as any; }, get es() { return uiI18n.t("localized.herbs.HERBS.item30.details.origin", { lng: 'es', returnObjects: true }) as any; }, get zh() { return uiI18n.t("localized.herbs.HERBS.item30.details.origin", { lng: 'zh', returnObjects: true }) as any; } },
    poisonous: false,
    summary: { get en() { return uiI18n.t("localized.herbs.HERBS.item30.details.summary", { lng: 'en', returnObjects: true }) as any; }, get es() { return uiI18n.t("localized.herbs.HERBS.item30.details.summary", { lng: 'es', returnObjects: true }) as any; }, get zh() { return uiI18n.t("localized.herbs.HERBS.item30.details.summary", { lng: 'zh', returnObjects: true }) as any; } }
  }
},

// 32) Cinnamon (Cinnamomum cassia) – China / Mexico / US
{
  id: '32',
  image: getHerbImage("cinnamon"),
  names: { get en() { return uiI18n.t("localized.herbs.HERBS.item31.names", { lng: 'en', returnObjects: true }) as any; }, get es() { return uiI18n.t("localized.herbs.HERBS.item31.names", { lng: 'es', returnObjects: true }) as any; }, get zh() { return uiI18n.t("localized.herbs.HERBS.item31.names", { lng: 'zh', returnObjects: true }) as any; } },
  details: {
    origin: { get en() { return uiI18n.t("localized.herbs.HERBS.item31.details.origin", { lng: 'en', returnObjects: true }) as any; }, get es() { return uiI18n.t("localized.herbs.HERBS.item31.details.origin", { lng: 'es', returnObjects: true }) as any; }, get zh() { return uiI18n.t("localized.herbs.HERBS.item31.details.origin", { lng: 'zh', returnObjects: true }) as any; } },
    poisonous: false,
    summary: { get en() { return uiI18n.t("localized.herbs.HERBS.item31.details.summary", { lng: 'en', returnObjects: true }) as any; }, get es() { return uiI18n.t("localized.herbs.HERBS.item31.details.summary", { lng: 'es', returnObjects: true }) as any; }, get zh() { return uiI18n.t("localized.herbs.HERBS.item31.details.summary", { lng: 'zh', returnObjects: true }) as any; } }
  }
},

// 33) St. John’s Wort (Hypericum perforatum) – US / Europe
{
  id: '33',
  image: getHerbImage("st_johns_wort"),
  names: { get en() { return uiI18n.t("localized.herbs.HERBS.item32.names", { lng: 'en', returnObjects: true }) as any; }, get es() { return uiI18n.t("localized.herbs.HERBS.item32.names", { lng: 'es', returnObjects: true }) as any; }, get zh() { return uiI18n.t("localized.herbs.HERBS.item32.names", { lng: 'zh', returnObjects: true }) as any; } },
  details: {
    origin: { get en() { return uiI18n.t("localized.herbs.HERBS.item32.details.origin", { lng: 'en', returnObjects: true }) as any; }, get es() { return uiI18n.t("localized.herbs.HERBS.item32.details.origin", { lng: 'es', returnObjects: true }) as any; }, get zh() { return uiI18n.t("localized.herbs.HERBS.item32.details.origin", { lng: 'zh', returnObjects: true }) as any; } },
    poisonous: false,
    summary: { get en() { return uiI18n.t("localized.herbs.HERBS.item32.details.summary", { lng: 'en', returnObjects: true }) as any; }, get es() { return uiI18n.t("localized.herbs.HERBS.item32.details.summary", { lng: 'es', returnObjects: true }) as any; }, get zh() { return uiI18n.t("localized.herbs.HERBS.item32.details.summary", { lng: 'zh', returnObjects: true }) as any; } }
  }
},

// 34) Eucalyptus – US / Global
{
  id: '34',
  image: getHerbImage("eucalyptus"),
  names: { get en() { return uiI18n.t("localized.herbs.HERBS.item33.names", { lng: 'en', returnObjects: true }) as any; }, get es() { return uiI18n.t("localized.herbs.HERBS.item33.names", { lng: 'es', returnObjects: true }) as any; }, get zh() { return uiI18n.t("localized.herbs.HERBS.item33.names", { lng: 'zh', returnObjects: true }) as any; } },
  details: {
    origin: { get en() { return uiI18n.t("localized.herbs.HERBS.item33.details.origin", { lng: 'en', returnObjects: true }) as any; }, get es() { return uiI18n.t("localized.herbs.HERBS.item33.details.origin", { lng: 'es', returnObjects: true }) as any; }, get zh() { return uiI18n.t("localized.herbs.HERBS.item33.details.origin", { lng: 'zh', returnObjects: true }) as any; } },
    poisonous: false,
    summary: { get en() { return uiI18n.t("localized.herbs.HERBS.item33.details.summary", { lng: 'en', returnObjects: true }) as any; }, get es() { return uiI18n.t("localized.herbs.HERBS.item33.details.summary", { lng: 'es', returnObjects: true }) as any; }, get zh() { return uiI18n.t("localized.herbs.HERBS.item33.details.summary", { lng: 'zh', returnObjects: true }) as any; } }
  }
},

// 35) Peppermint – US / Global
{
  id: '35',
  image: getHerbImage("peppermint"),
  names: { get en() { return uiI18n.t("localized.herbs.HERBS.item34.names", { lng: 'en', returnObjects: true }) as any; }, get es() { return uiI18n.t("localized.herbs.HERBS.item34.names", { lng: 'es', returnObjects: true }) as any; }, get zh() { return uiI18n.t("localized.herbs.HERBS.item34.names", { lng: 'zh', returnObjects: true }) as any; } },
  details: {
    origin: { get en() { return uiI18n.t("localized.herbs.HERBS.item34.details.origin", { lng: 'en', returnObjects: true }) as any; }, get es() { return uiI18n.t("localized.herbs.HERBS.item34.details.origin", { lng: 'es', returnObjects: true }) as any; }, get zh() { return uiI18n.t("localized.herbs.HERBS.item34.details.origin", { lng: 'zh', returnObjects: true }) as any; } },
    poisonous: false,
    summary: { get en() { return uiI18n.t("localized.herbs.HERBS.item34.details.summary", { lng: 'en', returnObjects: true }) as any; }, get es() { return uiI18n.t("localized.herbs.HERBS.item34.details.summary", { lng: 'es', returnObjects: true }) as any; }, get zh() { return uiI18n.t("localized.herbs.HERBS.item34.details.summary", { lng: 'zh', returnObjects: true }) as any; } }
  }
},

// 36) Milk Thistle (Silybum marianum) – US / Europe
{
  id: '36',
  image: getHerbImage("milk_thistle"),
  names: { get en() { return uiI18n.t("localized.herbs.HERBS.item35.names", { lng: 'en', returnObjects: true }) as any; }, get es() { return uiI18n.t("localized.herbs.HERBS.item35.names", { lng: 'es', returnObjects: true }) as any; }, get zh() { return uiI18n.t("localized.herbs.HERBS.item35.names", { lng: 'zh', returnObjects: true }) as any; } },
  details: {
    origin: { get en() { return uiI18n.t("localized.herbs.HERBS.item35.details.origin", { lng: 'en', returnObjects: true }) as any; }, get es() { return uiI18n.t("localized.herbs.HERBS.item35.details.origin", { lng: 'es', returnObjects: true }) as any; }, get zh() { return uiI18n.t("localized.herbs.HERBS.item35.details.origin", { lng: 'zh', returnObjects: true }) as any; } },
    poisonous: false,
    summary: { get en() { return uiI18n.t("localized.herbs.HERBS.item35.details.summary", { lng: 'en', returnObjects: true }) as any; }, get es() { return uiI18n.t("localized.herbs.HERBS.item35.details.summary", { lng: 'es', returnObjects: true }) as any; }, get zh() { return uiI18n.t("localized.herbs.HERBS.item35.details.summary", { lng: 'zh', returnObjects: true }) as any; } }
  }
},

// 37) Lavender – US / Global
{
  id: '37',
  image: getHerbImage("lavender"),
  names: { get en() { return uiI18n.t("localized.herbs.HERBS.item36.names", { lng: 'en', returnObjects: true }) as any; }, get es() { return uiI18n.t("localized.herbs.HERBS.item36.names", { lng: 'es', returnObjects: true }) as any; }, get zh() { return uiI18n.t("localized.herbs.HERBS.item36.names", { lng: 'zh', returnObjects: true }) as any; } },
  details: {
    origin: { get en() { return uiI18n.t("localized.herbs.HERBS.item36.details.origin", { lng: 'en', returnObjects: true }) as any; }, get es() { return uiI18n.t("localized.herbs.HERBS.item36.details.origin", { lng: 'es', returnObjects: true }) as any; }, get zh() { return uiI18n.t("localized.herbs.HERBS.item36.details.origin", { lng: 'zh', returnObjects: true }) as any; } },
    poisonous: false,
    summary: { get en() { return uiI18n.t("localized.herbs.HERBS.item36.details.summary", { lng: 'en', returnObjects: true }) as any; }, get es() { return uiI18n.t("localized.herbs.HERBS.item36.details.summary", { lng: 'es', returnObjects: true }) as any; }, get zh() { return uiI18n.t("localized.herbs.HERBS.item36.details.summary", { lng: 'zh', returnObjects: true }) as any; } }
  }
},

// 38) Holy Basil (Tulsi) – Global
{
  id: '38',
  image: getHerbImage("holy_basil"),
  names: { get en() { return uiI18n.t("localized.herbs.HERBS.item37.names", { lng: 'en', returnObjects: true }) as any; }, get es() { return uiI18n.t("localized.herbs.HERBS.item37.names", { lng: 'es', returnObjects: true }) as any; }, get zh() { return uiI18n.t("localized.herbs.HERBS.item37.names", { lng: 'zh', returnObjects: true }) as any; } },
  details: {
    origin: { get en() { return uiI18n.t("localized.herbs.HERBS.item37.details.origin", { lng: 'en', returnObjects: true }) as any; }, get es() { return uiI18n.t("localized.herbs.HERBS.item37.details.origin", { lng: 'es', returnObjects: true }) as any; }, get zh() { return uiI18n.t("localized.herbs.HERBS.item37.details.origin", { lng: 'zh', returnObjects: true }) as any; } },
    poisonous: false,
    summary: { get en() { return uiI18n.t("localized.herbs.HERBS.item37.details.summary", { lng: 'en', returnObjects: true }) as any; }, get es() { return uiI18n.t("localized.herbs.HERBS.item37.details.summary", { lng: 'es', returnObjects: true }) as any; }, get zh() { return uiI18n.t("localized.herbs.HERBS.item37.details.summary", { lng: 'zh', returnObjects: true }) as any; } }
  }
},

// 39) Hibiscus – US / Mexico / Global
{
  id: '39',
  image: getHerbImage("hibiscus"),
  names: { get en() { return uiI18n.t("localized.herbs.HERBS.item38.names", { lng: 'en', returnObjects: true }) as any; }, get es() { return uiI18n.t("localized.herbs.HERBS.item38.names", { lng: 'es', returnObjects: true }) as any; }, get zh() { return uiI18n.t("localized.herbs.HERBS.item38.names", { lng: 'zh', returnObjects: true }) as any; } },
  details: {
    origin: { get en() { return uiI18n.t("localized.herbs.HERBS.item38.details.origin", { lng: 'en', returnObjects: true }) as any; }, get es() { return uiI18n.t("localized.herbs.HERBS.item38.details.origin", { lng: 'es', returnObjects: true }) as any; }, get zh() { return uiI18n.t("localized.herbs.HERBS.item38.details.origin", { lng: 'zh', returnObjects: true }) as any; } },
    poisonous: false,
    summary: { get en() { return uiI18n.t("localized.herbs.HERBS.item38.details.summary", { lng: 'en', returnObjects: true }) as any; }, get es() { return uiI18n.t("localized.herbs.HERBS.item38.details.summary", { lng: 'es', returnObjects: true }) as any; }, get zh() { return uiI18n.t("localized.herbs.HERBS.item38.details.summary", { lng: 'zh', returnObjects: true }) as any; } }
  }
},

// 40) Cilantro (Coriandrum sativum) – Mexico / US / China
{
  id: '40',
  image: getHerbImage("cilantro"),
  names: { get en() { return uiI18n.t("localized.herbs.HERBS.item39.names", { lng: 'en', returnObjects: true }) as any; }, get es() { return uiI18n.t("localized.herbs.HERBS.item39.names", { lng: 'es', returnObjects: true }) as any; }, get zh() { return uiI18n.t("localized.herbs.HERBS.item39.names", { lng: 'zh', returnObjects: true }) as any; } },
  details: {
    origin: { get en() { return uiI18n.t("localized.herbs.HERBS.item39.details.origin", { lng: 'en', returnObjects: true }) as any; }, get es() { return uiI18n.t("localized.herbs.HERBS.item39.details.origin", { lng: 'es', returnObjects: true }) as any; }, get zh() { return uiI18n.t("localized.herbs.HERBS.item39.details.origin", { lng: 'zh', returnObjects: true }) as any; } },
    poisonous: false,
    summary: { get en() { return uiI18n.t("localized.herbs.HERBS.item39.details.summary", { lng: 'en', returnObjects: true }) as any; }, get es() { return uiI18n.t("localized.herbs.HERBS.item39.details.summary", { lng: 'es', returnObjects: true }) as any; }, get zh() { return uiI18n.t("localized.herbs.HERBS.item39.details.summary", { lng: 'zh', returnObjects: true }) as any; } }
  }
}
];

// TODO: Add more herbs by following the same pattern
// Each herb should have:
// - Unique ID
// - Image asset (add to assets/herbs/ folder)
// - Localized names (en, es, zh)
// - Origin information
// - Poisonous status
// - Summary description


