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
  names: {
    en: 'Damiana',
    es: 'Damiana',
    zh: '达米阿纳'
  },
  details: {
    origin: {
      en: 'Mexico, Southwestern USA',
      es: 'México, suroeste de EE. UU.',
      zh: '墨西哥、美国西南部'
    },
    poisonous: false,
    summary: {
      en: 'Traditionally used as an aphrodisiac, mood tonic, diuretic, for ulcers, respiratory infections; FDA lists it as generally recognized as safe (GRAS).',
      es: 'Tradicionalmente usada como afrodisíaco, tónico del estado de ánimo, diurético, para úlceras e infecciones respiratorias; la FDA la considera generalmente reconocida como segura (GRAS).',
      zh: '传统上用作春药、情绪补剂、利尿剂，用于溃疡和呼吸道感染；FDA 列为一般公认为安全 (GRAS) 水平。'
    }
  }
},

// 2) Epazote (Dysphania ambrosioides) – Mexico
{
  id: '2',
  image: getHerbImage('epazote'),
  names: {
    en: 'Epazote',
    es: 'Epazote',
    zh: '墨西哥豉草'
  },
  details: {
    origin: {
      en: 'Mexico and Central America',
      es: 'México y Centroamérica',
      zh: '墨西哥和中美洲'
    },
    poisonous: false,
    summary: {
      en: 'Used to flavor beans and reduce gas and bloating; also used to combat intestinal parasites. (Culinary amounts recommended.)',
      es: 'Usado para dar sabor a frijoles y reducir gases e hinchazón; también para combatir parásitos intestinales. (Se recomiendan cantidades culinarias.)',
      zh: '用于调味豆类并减少胀气；也用于对抗肠道寄生虫。（建议烹饪用量）'
    }
  }
},

// 3) Dandelion (Taraxacum officinale) – Mexico / North America / China
{
  id: '3',
  image: getHerbImage('dandelion'),
  names: {
    en: 'Dandelion',
    es: 'Diente de león',
    zh: '蒲公英'
  },
  details: {
    origin: {
      en: 'Worldwide (used in Mexico, North America, China)',
      es: 'Mundial (usado en México, Norteamérica, China)',
      zh: '全球（墨西哥、北美、中国使用）'
    },
    poisonous: false,
    summary: {
      en: 'Used for appetite loss, dyspepsia, flatulence, gallstones, bile stimulation, laxative, diuretic, circulatory tonic, skin and blood tonics.',
      es: 'Usado para pérdida de apetito, dispepsia, flatulencia, cálculos biliares, estimulación de bilis, laxante, diurético, tónico circulatorio, tónico para la piel y la sangre.',
      zh: '用于食欲不振、消化不良、腹胀、胆结石、刺激胆汁、泻药、利尿、循环补剂、皮肤和血液补剂。'
    }
  }
},

// 4) Chamomile (Matricaria recutita) – Europe; widely used in US/Mexico/China
{
  id: '4',
  image: getHerbImage('chamomile'),
  names: {
    en: 'Chamomile',
    es: 'Manzanilla',
    zh: '洋甘菊'
  },
  details: {
    origin: {
      en: 'Europe, Western Asia (widely used globally)',
      es: 'Europa, Asia Occidental (ampliamente usada globalmente)',
      zh: '欧洲、西亚（全球广泛使用）'
    },
    poisonous: false,
    summary: {
      en: 'Gentle herb known for calming properties, used for sleep and relaxation.',
      es: 'Hierba suave conocida por sus propiedades calmantes, usada para el sueño y la relajación.',
      zh: '温和草本，以其镇静特性闻名，用于助眠和放松。'
    }
  }
},

// 5) Garlic (Allium sativum) – US/Mexico/China
{
  id: '5',
  image: getHerbImage('garlic'),
  names: {
    en: 'Garlic',
    es: 'Ajo',
    zh: '大蒜'
  },
  details: {
    origin: {
      en: 'Central Asia (widely cultivated worldwide)',
      es: 'Asia Central (cultivada mundialmente)',
      zh: '中亚（全球广泛种植）'
    },
    poisonous: false,
    summary: {
      en: 'Used in cooking; proven benefits include antimicrobial effects, heart protection, reducing inflammation, cholesterol, and blood pressure.',
      es: 'Usado en la cocina; beneficios comprobados incluyen efectos antimicrobianos, protección cardiovascular, reducción de inflamación, colesterol y presión arterial.',
      zh: '用于烹饪；证实的益处包括抗菌、保护心脏、减少炎症、胆固醇和血压。'
    }
  }
},

// 6) Prunella vulgaris (Selfheal) – North America / China
{
  id: '6',
  image: getHerbImage("prunella_vulgaris"),
  names: {
    en: 'Selfheal',
    es: 'Autosanadora',
    zh: '夏枯草'
  },
  details: {
    origin: {
      en: 'North America; widely used in Traditional Chinese Medicine',
      es: 'Norteamérica; ampliamente usado en la medicina china tradicional',
      zh: '北美；在中医中广泛使用'
    },
    poisonous: false,
    summary: {
      en: 'Used by indigenous North Americans for boils; in Chinese medicine for dizziness, cough, dermatitis; common in herbal teas.',
      es: 'Utilizada por indígenas norteamericanos para forúnculos; en medicina china para mareos, tos, dermatitis; común en tés herbales.',
      zh: '北美原住民用于治疗疖子；在中医中用于眩晕、咳嗽、皮炎；常见于草本茶。'
    }
  }
},

// 7) Tagetes lucida (Mexican Marigold / Yauhtli) – Mexico
{
  id: '7',
  image: getHerbImage("tagetes_lucida"),
  names: {
    en: 'Tagetes lucida',
    es: 'Yauhtli / Clavel de tierra',
    zh: '墨西哥金盏菊'
  },
  details: {
    origin: {
      en: 'Central Mexico',
      es: 'Centro de México',
      zh: '墨西哥中部'
    },
    poisonous: false,
    summary: {
      en: 'Used as tea for colds, gas, diarrhea; ritual incense by Aztecs; culinary substitute for tarragon.',
      es: 'Usada como té para resfriados, gases, diarrea; incienso ritual por aztecas; sustituto culinario del estragón.',
      zh: '用作治疗感冒、胀气、腹泻的茶；阿兹特克人用于祭祀熏香；烹饪可替代龙蒿。'
    }
  }
},

// 8) Clinopodium mexicanum (“Toronjil de monte”) – Mexico
{
  id: '8',
  image: getHerbImage("clinopodium_mexicanum"),
  names: {
    en: 'Clinopodium mexicanum',
    es: 'Toronjil de monte',
    zh: '墨西哥柠檬香草'
  },
  details: {
    origin: {
      en: 'Mexico',
      es: 'México',
      zh: '墨西哥'
    },
    poisonous: false,
    summary: {
      en: 'Used to induce sleep and for analgesic effects; contains compounds with anxiolytic and antinociceptive activity.',
      es: 'Usada para inducir el sueño y como analgésico; contiene compuestos con actividad ansiolítica y antinociceptiva.',
      zh: '用于诱导睡眠和止痛；含有具有抗焦虑和镇痛作用的化合物。'
    }
  }
},

// 9) Litsea glaucescens (Mexican Bay Leaf) – Mexico
{
  id: '9',
  image: getHerbImage("litsea_glaucescens"),
  names: {
    en: 'Mexican Bay Leaf',
    es: 'Laurel Mexicano',
    zh: '墨西哥月桂叶'
  },
  details: {
    origin: {
      en: 'Mexico',
      es: 'México',
      zh: '墨西哥'
    },
    poisonous: false,
    summary: {
      en: 'Used in Mexican traditional medicine for “nervios” (anxiety/depression); experimental data suggest antidepressant activity.',
      es: 'Usado en medicina tradicional mexicana para “nervios” (ansiedad/depresión); datos experimentales sugieren actividad antidepresiva.',
      zh: '在墨西哥传统医学中用于“神经症”（焦虑/抑郁）；实验数据显示具抗抑郁活性。'
    }
  }
},

// 10) Artemisia annua (Sweet Wormwood) – China
{
  id: '10',
  image: getHerbImage("artemisia_annua"),
  names: {
    en: 'Sweet Wormwood',
    es: 'Artemisa dulce',
    zh: '青蒿'
  },
  details: {
    origin: {
      en: 'China (Traditional Chinese Medicine)',
      es: 'China (medicina tradicional)',
      zh: '中国（传统中医）'
    },
    poisonous: false,
    summary: {
      en: 'Source of artemisinin, a first-line treatment for malaria; artemisinin derivatives are used in many approved medicines.',
      es: 'Fuente de artemisinina, tratamiento de primera línea contra la malaria; los derivados se usan en muchos medicamentos aprobados.',
      zh: '青蒿素的来源，是疟疾一线疗法；其衍生物用于多种获批药物。'
    }
  }
},

// 11) Aloe Vera – Mexico / US / China
{
  id: '11',
  image: getHerbImage("aloe_vera"),
  names: { en: 'Aloe Vera', es: 'Aloe vera', zh: '芦荟' },
  details: {
    origin: { en: 'North Africa; naturalized in Mexico, US, and China', es: 'África del Norte; naturalizada en México, EE. UU. y China', zh: '北非；在墨西哥、美国和中国广泛分布' },
    poisonous: false,
    summary: {
      en: 'Topical use for burns and skin irritation; oral use for digestive support and wound healing.',
      es: 'Uso tópico para quemaduras e irritación de la piel; uso oral para apoyo digestivo y cicatrización.',
      zh: '外用于烧伤与皮肤刺激；口服用于消化支持与伤口愈合。'
    }
  }
},

// 12) Ginger (Zingiber officinale) – US / China / Mexico
{
  id: '12',
  image: getHerbImage("ginger"),
  names: { en: 'Ginger', es: 'Jengibre', zh: '姜' },
  details: {
    origin: { en: 'Southeast Asia; widely used globally', es: 'Sudeste Asiático; ampliamente usado globalmente', zh: '东南亚；全球广泛使用' },
    poisonous: false,
    summary: {
      en: 'Used for nausea, digestive upset, and inflammation.',
      es: 'Usado para náuseas, malestar digestivo e inflamación。',
      zh: '用于缓解恶心、消化不良与炎症。'
    }
  }
},

// 13) Echinacea – US
{
  id: '13',
  image: getHerbImage("echinacea"),
  names: { en: 'Echinacea', es: 'Equinácea', zh: '紫锥花' },
  details: {
    origin: { en: 'North America', es: 'Norteamérica', zh: '北美' },
    poisonous: false,
    summary: {
      en: 'Commonly used for prevention/treatment of colds and upper respiratory infections.',
      es: 'Usada comúnmente para prevenir/tratar resfriados e infecciones respiratorias altas.',
      zh: '常用于预防/治疗感冒与上呼吸道感染。'
    }
  }
},

// 14) Ginkgo biloba – US / China
{
  id: '14',
  image: getHerbImage("ginkgo_biloba"),
  names: { en: 'Ginkgo', es: 'Ginkgo', zh: '银杏' },
  details: {
    origin: { en: 'China; introduced to US', es: 'China; introducido en EE. UU.', zh: '中国；引入美国' },
    poisonous: false,
    summary: {
      en: 'Used for cognitive support and blood flow in traditional and modern contexts.',
      es: 'Usado para apoyo cognitivo y flujo sanguíneo en contextos tradicionales y modernos.',
      zh: '用于认知支持与促进血流。'
    }
  }
},

// 15) Panax notoginseng – China
{
  id: '15',
  image: getHerbImage("notoginseng"),
  names: { en: 'Notoginseng', es: 'Notoginseng', zh: '三七' },
  details: {
    origin: { en: 'China', es: 'China', zh: '中国' },
    poisonous: false,
    summary: {
      en: 'Traditionally used for bleeding control and circulation; key component in Yunnan Baiyao.',
      es: 'Tradicionalmente usado para controlar el sangrado y la circulación; componente clave de Yunnan Baiyao.',
      zh: '传统用于止血与活血；云南白药关键成分。'
    }
  }
},

// 16) Turmeric (Curcuma longa) – US / China / Mexico
{
  id: '16',
  image: getHerbImage("turmeric"),
  names: { en: 'Turmeric', es: 'Cúrcuma', zh: '姜黄' },
  details: {
    origin: { en: 'Southeast Asia; used globally', es: 'Sudeste Asiático; uso global', zh: '东南亚；全球使用' },
    poisonous: false,
    summary: {
      en: 'Contains curcumin; studied for anti-inflammatory and antioxidant benefits.',
      es: 'Contiene curcumina; estudiada por beneficios antiinflamatorios y antioxidantes.',
      zh: '含姜黄素；研究表明具抗炎与抗氧化益处。'
    }
  }
},

// 17) Rosemary – US / Mexico
{
  id: '17',
  image: getHerbImage("rosemary"),
  names: { en: 'Rosemary', es: 'Romero', zh: '迷迭香' },
  details: {
    origin: { en: 'Mediterranean; widely used in Mexico and US', es: 'Mediterráneo; ampliamente usado en México y EE. UU.', zh: '地中海；在墨西哥和美国广泛使用' },
    poisonous: false,
    summary: {
      en: 'Used for culinary flavor and antioxidant/anti-inflammatory support.',
      es: 'Usada para sabor culinario y apoyo antioxidante/antiinflamatorio.',
      zh: '用于烹饪调味与抗氧化/抗炎支持。'
    }
  }
},

// 18) Parsley (Petroselinum crispum) – US / Mexico
{
  id: '18',
  image: getHerbImage("parsley"),
  names: { en: 'Parsley', es: 'Perejil', zh: '欧芹' },
  details: {
    origin: { en: 'Mediterranean; used globally', es: 'Mediterráneo; uso global', zh: '地中海；全球使用' },
    poisonous: false,
    summary: {
      en: 'High in antioxidants; supports general wellness in culinary and herbal use.',
      es: 'Alta en antioxidantes; apoya el bienestar general en uso culinario y herbolario.',
      zh: '富含抗氧化物；在烹饪与草药使用中支持健康。'
    }
  }
},

// 19) Fennel – US / Mexico / China
{
  id: '19',
  image: getHerbImage("fennel"),
  names: { en: 'Fennel', es: 'Hinojo', zh: '茴香' },
  details: {
    origin: { en: 'Mediterranean; adopted globally', es: 'Mediterráneo; adoptado globalmente', zh: '地中海；全球采用' },
    poisonous: false,
    summary: {
      en: 'Used for digestive health, bloating, and women’s health support.',
      es: 'Usado para salud digestiva, hinchazón y apoyo a la salud femenina.',
      zh: '用于消化健康、缓解腹胀与女性健康支持。'
    }
  }
},

// 20) Aristolochia odoratissima (Pipe vine) – Mexico (caution)
{
  id: '20',
  image: getHerbImage("aristolochia"),
  names: { en: 'Aristolochia odoratissima', es: 'Aristolochia odoratissima', zh: '马兜铃属' },
  details: {
    origin: { en: 'Mexico', es: 'México', zh: '墨西哥' },
    poisonous: true,
    summary: {
      en: 'Traditional use reported, but known to be nephrotoxic and carcinogenic; not recommended.',
      es: 'Uso tradicional reportado, pero se sabe que es nefrotóxica y carcinógena; no recomendada.',
      zh: '虽有传统使用，但已知具肾毒性与致癌性；不建议使用。'
    }
  }
},

// 21) Mexican Oregano (Lippia graveolens) – Mexico / US
{
  id: '21',
  image: getHerbImage("mexican_oregano"),
  names: { en: 'Mexican Oregano', es: 'Orégano Mexicano', zh: '墨西哥牛至' },
  details: {
    origin: { en: 'Mexico', es: 'México', zh: '墨西哥' },
    poisonous: false,
    summary: {
      en: 'Traditionally used for respiratory and digestive issues; antioxidant and antimicrobial properties.',
      es: 'Tradicionalmente usado para afecciones respiratorias y digestivas; propiedades antioxidantes y antimicrobianas.',
      zh: '传统用于呼吸与消化问题；具抗氧化与抗菌特性。'
    }
  }
},

// 22) Yerba Mansa (Anemopsis californica) – US / Mexico
{
  id: '22',
  image: getHerbImage("yerba_mansa"),
  names: { en: 'Yerba Mansa', es: 'Yerba Mansa', zh: '美洲草锰' },
  details: {
    origin: { en: 'Southwestern USA; Mexico', es: 'Suroeste de EE. UU.; México', zh: '美国西南；墨西哥' },
    poisonous: false,
    summary: {
      en: 'Antimicrobial, diuretic; used for mucous membrane inflammation, gout, kidney stones, and wound care.',
      es: 'Antimicrobiana, diurética; usada para inflamación de mucosas, gota, cálculos renales y cuidado de heridas.',
      zh: '具抗菌与利尿作用；用于黏膜炎症、痛风、肾结石与创面护理。'
    }
  }
},

// 23) Gray Sarsaparilla (Smilax aristolochiifolia) – Mexico
{
  id: '23',
  image: getHerbImage("gray_sarsaparilla"),
  names: { en: 'Gray Sarsaparilla', es: 'Zarzaparrilla Gris', zh: '灰人参藤' },
  details: {
    origin: { en: 'Mexico, Central America', es: 'México, Centroamérica', zh: '墨西哥、中美洲' },
    poisonous: false,
    summary: {
      en: 'Traditional uses include skin diseases, rheumatism, anemia; also considered a digestive tonic.',
      es: 'Usos tradicionales incluyen enfermedades de la piel, reumatismo, anemia; también tónico digestivo.',
      zh: '传统用于皮肤病、风湿、贫血；亦作消化补剂。'
    }
  }
},

// 24) Pericón (Tagetes erecta) – Mexico
{
  id: '24',
  image: getHerbImage("pericon"),
  names: { en: 'Mexican Marigold', es: 'Pericón / Cempasúchil', zh: '墨西哥万寿菊' },
  details: {
    origin: { en: 'Mexico, Guatemala', es: 'México, Guatemala', zh: '墨西哥、危地马拉' },
    poisonous: false,
    summary: {
      en: 'Traditional uses for digestive and respiratory issues; antioxidant support.',
      es: 'Usos tradicionales para problemas digestivos y respiratorios; apoyo antioxidante.',
      zh: '传统用于消化与呼吸问题；具抗氧化支持。'
    }
  }
},

// 25) Heliopsis longipes (Chilcuague) – Mexico
{
  id: '25',
  image: getHerbImage("heliopsis_longipes"),
  names: { en: 'Heliopsis longipes', es: 'Chilcuague', zh: '长管花' },
  details: {
    origin: { en: 'Mexico', es: 'México', zh: '墨西哥' },
    poisonous: false,
    summary: {
      en: 'Antibiotic, antifungal, analgesic; used for throat infections, fungal issues, oral pain, acid reflux.',
      es: 'Antibiótico, antifúngico, analgésico; usado para infecciones de garganta, problemas fúngicos, dolor oral, reflujo ácido.',
      zh: '具抗菌、抗真菌与镇痛作用；用于咽喉感染、真菌问题、口腔疼痛与胃酸反流。'
    }
  }
},

// 26) Lippia dulcis (Aztec Sweet Herb) – Mexico
{
  id: '26',
  image: getHerbImage("lippia_dulcis"),
  names: { en: 'Aztec Sweet Herb', es: 'Hierba Dulce', zh: '阿兹特克甜草' },
  details: {
    origin: { en: 'Southern Mexico', es: 'Sur de México', zh: '墨西哥南部' },
    poisonous: false,
    summary: {
      en: 'Used as a natural sweetener and medicinal herb; contains hernandulcin.',
      es: 'Usada como endulzante natural y hierba medicinal; contiene hernandulcina.',
      zh: '作为天然甜味剂与药草；含有her nandulcin（甜味成分）。'
    }
  }
},

// 27) Agastache rugosa (Korean Mint) – China / US
{
  id: '27',
  image: getHerbImage("agastache_rugosa"),
  names: { en: 'Korean Mint', es: 'Menta Coreana', zh: '藿香' },
  details: {
    origin: { en: 'China, Korea', es: 'China, Corea', zh: '中国、韩国' },
    poisonous: false,
    summary: {
      en: 'Common TCM herb for digestive and respiratory support.',
      es: 'Hierba común en MTC para apoyo digestivo y respiratorio.',
      zh: '中医常用草药，用于消化与呼吸系统支持。'
    }
  }
},

// 28) Astragalus (Astragalus membranaceus) – China
{
  id: '28',
  image: getHerbImage("astragalus"),
  names: { en: 'Astragalus', es: 'Astrágalo', zh: '黄芪' },
  details: {
    origin: { en: 'China', es: 'China', zh: '中国' },
    poisonous: false,
    summary: {
      en: 'Widely used in TCM for immune support and qi enhancement.',
      es: 'Ampliamente usado en MTC para apoyar el sistema inmunológico y mejorar el qi.',
      zh: '在中医中广泛用于免疫支持与益气。'
    }
  }
},

// 29) Liquorice (Glycyrrhiza uralensis) – China
{
  id: '29',
  image: getHerbImage("liquorice"),
  names: { en: 'Licorice', es: 'Regaliz', zh: '甘草' },
  details: {
    origin: { en: 'China', es: 'China', zh: '中国' },
    poisonous: false,
    summary: {
      en: 'Harmonizes formulas; soothes throat and digestive tract in TCM.',
      es: 'Armoniza fórmulas; calma garganta y tracto digestivo en MTC.',
      zh: '用于调和方剂；舒缓咽喉与消化道。'
    }
  }
},

// 30) Angelica sinensis (Dong Quai) – China
{
  id: '30',
  image: getHerbImage("angelica_sinensis"),
  names: { en: 'Dong Quai', es: 'Angélica China', zh: '当归' },
  details: {
    origin: { en: 'China', es: 'China', zh: '中国' },
    poisonous: false,
    summary: {
      en: 'Used for women’s health; considered a blood tonic and used for menstrual disorders.',
      es: 'Usado para la salud de la mujer; considerado tónico sanguíneo y para desórdenes menstruales.',
      zh: '用于女性健康；被视为补血药并用于月经失调。'
    }
  }
},

// 31) Ganoderma (Lingzhi) – China / US
{
  id: '31',
  image: getHerbImage("ganoderma"),
  names: { en: 'Lingzhi Mushroom', es: 'Seta Lingzhi', zh: '灵芝' },
  details: {
    origin: { en: 'China', es: 'China', zh: '中国' },
    poisonous: false,
    summary: {
      en: 'Revered in TCM for longevity and immune modulation.',
      es: 'Venerado en MTC por la longevidad y la modulación inmunológica.',
      zh: '在中医中因助长寿与免疫调节而受推崇。'
    }
  }
},

// 32) Cinnamon (Cinnamomum cassia) – China / Mexico / US
{
  id: '32',
  image: getHerbImage("cinnamon"),
  names: { en: 'Cinnamon', es: 'Canela', zh: '肉桂' },
  details: {
    origin: { en: 'China, Southeast Asia; used globally', es: 'China, Sudeste Asiático; uso global', zh: '中国、东南亚；全球使用' },
    poisonous: false,
    summary: {
      en: 'Used for blood sugar regulation and digestion; warming spice in culinary and traditional practices.',
      es: 'Usada para regular el azúcar en sangre y la digestión; especia reconfortante en prácticas tradicionales y culinarias.',
      zh: '用于调节血糖与助消化；在传统与烹饪中作为温热香料。'
    }
  }
},

// 33) St. John’s Wort (Hypericum perforatum) – US / Europe
{
  id: '33',
  image: getHerbImage("st_johns_wort"),
  names: { en: 'St. John’s Wort', es: 'Hipérico', zh: '贯叶连翘' },
  details: {
    origin: { en: 'Europe; used in US herbalism', es: 'Europa; usado en herbolaria de EE. UU.', zh: '欧洲；也用于美国草药学' },
    poisonous: false,
    summary: {
      en: 'Used for mild to moderate depression; caution for drug interactions.',
      es: 'Usado para depresión leve a moderada; precaución por interacciones medicamentosas.',
      zh: '用于轻中度抑郁；注意与药物相互作用。'
    }
  }
},

// 34) Eucalyptus – US / Global
{
  id: '34',
  image: getHerbImage("eucalyptus"),
  names: { en: 'Eucalyptus', es: 'Eucalipto', zh: '桉树' },
  details: {
    origin: { en: 'Australia; used in US and globally', es: 'Australia; usado en EE. UU. y globalmente', zh: '澳大利亚；在美国和全球使用' },
    poisonous: false,
    summary: {
      en: 'Used for respiratory congestion; decongestant with antimicrobial properties.',
      es: 'Usado para congestión respiratoria; descongestionante con propiedades antimicrobianas.',
      zh: '用于缓解呼吸道充血；具通气与抗菌特性。'
    }
  }
},

// 35) Peppermint – US / Global
{
  id: '35',
  image: getHerbImage("peppermint"),
  names: { en: 'Peppermint', es: 'Menta Piperita', zh: '薄荷' },
  details: {
    origin: { en: 'Europe; used globally including US', es: 'Europa; usado globalmente incluido EE. UU.', zh: '欧洲；全球使用包括美国' },
    poisonous: false,
    summary: {
      en: 'Used for digestive relief, nausea, and tension headaches; menthol provides cooling.',
      es: 'Usada para alivio digestivo, náuseas y cefaleas tensionales; el mentol proporciona frescor.',
      zh: '用于缓解消化不适、恶心与紧张性头痛；薄荷醇带来清凉感。'
    }
  }
},

// 36) Milk Thistle (Silybum marianum) – US / Europe
{
  id: '36',
  image: getHerbImage("milk_thistle"),
  names: { en: 'Milk Thistle', es: 'Cardo Mariano', zh: '乳蓟' },
  details: {
    origin: { en: 'Mediterranean; used in US', es: 'Mediterráneo; usado en EE. UU.', zh: '地中海；美国亦用' },
    poisonous: false,
    summary: {
      en: 'Used for liver support; silymarin is a key antioxidant complex.',
      es: 'Usado para apoyo hepático; la silimarina es un complejo antioxidante clave.',
      zh: '用于肝脏支持；水飞蓟素是关键抗氧化复合物。'
    }
  }
},

// 37) Lavender – US / Global
{
  id: '37',
  image: getHerbImage("lavender"),
  names: { en: 'Lavender', es: 'Lavanda', zh: '薰衣草' },
  details: {
    origin: { en: 'Mediterranean; used globally', es: 'Mediterráneo; uso global', zh: '地中海；全球使用' },
    poisonous: false,
    summary: {
      en: 'Known for calming effects; used for sleep and anxiety relief; common in aromatherapy.',
      es: 'Conocida por efectos calmantes; usada para el sueño y alivio de ansiedad; común en aromaterapia.',
      zh: '以镇静著称；用于助眠与缓解焦虑；芳香疗法中常见。'
    }
  }
},

// 38) Holy Basil (Tulsi) – Global
{
  id: '38',
  image: getHerbImage("holy_basil"),
  names: { en: 'Holy Basil', es: 'Albahaca Sagrada', zh: '圣罗勒' },
  details: {
    origin: { en: 'India; used globally in herbalism', es: 'India; uso global en herbolaria', zh: '印度；全球草本应用' },
    poisonous: false,
    summary: {
      en: 'Adaptogen used to reduce stress, support immunity, and regulate blood sugar.',
      es: 'Adaptógeno usado para reducir estrés, apoyar inmunidad y regular glucosa.',
      zh: '适应原；用于减压、免疫支持与调节血糖。'
    }
  }
},

// 39) Hibiscus – US / Mexico / Global
{
  id: '39',
  image: getHerbImage("hibiscus"),
  names: { en: 'Hibiscus', es: 'Hibisco', zh: '木槿' },
  details: {
    origin: { en: 'Tropical regions; used globally including Mexico and US', es: 'Regiones tropicales; uso global incluso México y EE. UU.', zh: '热带地区；全球使用包括墨西哥和美国' },
    poisonous: false,
    summary: {
      en: 'Consumed as tea; studied for blood pressure-lowering and antioxidant properties.',
      es: 'Consumido como té; estudiado por reducción de presión arterial y propiedades antioxidantes.',
      zh: '常作花茶；研究显示可降血压并具抗氧化特性。'
    }
  }
},

// 40) Cilantro (Coriandrum sativum) – Mexico / US / China
{
  id: '40',
  image: getHerbImage("cilantro"),
  names: { en: 'Cilantro', es: 'Cilantro', zh: '香菜' },
  details: {
    origin: { en: 'Mediterranean; used globally', es: 'Mediterráneo; uso global', zh: '地中海；全球使用' },
    poisonous: false,
    summary: {
      en: 'Used for digestive aid and as an antioxidant-rich culinary herb.',
      es: 'Usado como ayuda digestiva y hierba culinaria rica en antioxidantes.',
      zh: '用于助消化；也是富含抗氧化物的烹饪香草。'
    }
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


