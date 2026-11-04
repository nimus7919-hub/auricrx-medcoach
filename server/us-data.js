const NADAC_DATASET = 'fbb83258-11c7-47f5-8b18-5f8e79f7e704';
const notices = require('../src/legal/usDisclaimers.json');
const today = () => new Date().toISOString().slice(0, 10);
const encoded = value => encodeURIComponent(value);
async function upstream(url, format = 'json', allow404 = false) {
  const response = await fetch(url, { signal: AbortSignal.timeout(20000), headers: { Accept: format === 'json' ? 'application/json' : 'application/xml' } });
  if (allow404 && response.status === 404) return { results: [] };
  if (!response.ok) throw new Error('SOURCE_UNAVAILABLE');
  return format === 'json' ? response.json() : response.text();
}
const queryText = value => String(value || '').replace(/[^\p{L}\p{N}\s.-]/gu, '').trim().slice(0, 100);
const plainXML = value => value.replace(/<\/?(?:paragraph|br|tr|item)\b[^>]*>/gi, '\n').replace(/<[^>]*>/g, '').replace(/&#(x[\da-f]+|\d+);/gi, (_, n) => String.fromCodePoint(n[0].toLowerCase() === 'x' ? parseInt(n.slice(1), 16) : Number(n))).replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, '&').trim();
// SPL section codes are LOINC; return label text, never generated advice or a score.
function labelSections(xml) {
  const codes = { '48721-0': 'Drug Interactions', '34066-1': 'Boxed Warning', '34070-3': 'Contraindications', '43685-7': 'Warnings and Precautions', '34067-9': 'Indications and Usage' };
  const result = [];
  for (const [code, title] of Object.entries(codes)) {
    const marker = new RegExp('<code\\b[^>]*\\bcode=["\']' + code + '["\'][^>]*>', 'i').exec(xml);
    if (!marker) continue;
    const section = xml.slice(marker.index).split(/<\/section\s*>/i)[0];
    const text = /<text\b[^>]*>([\s\S]*?)<\/text\s*>/i.exec(section)?.[1];
    if (text) result.push({ title, text: plainXML(text) });
  }
  return result;
}
async function searchDrugs(name) {
  const url = `https://rxnav.nlm.nih.gov/REST/Prescribe/drugs.json?name=${encoded(name)}`;
  const data = await upstream(url);
  const version = await upstream('https://rxnav.nlm.nih.gov/REST/version.json');
  return { source: 'RxNorm / NLM', sourceUrl: url, retrievedAt: today(), dataDate: version.version || 'not supplied', attribution: notices.nlm,
    results: (data.drugGroup?.conceptGroup || []).flatMap(group => group.conceptProperties || []).map(item => ({ name: item.name, rxcui: item.rxcui, synonym: item.synonym })) };
}
async function labels(rxcui) {
  const url = `https://dailymed.nlm.nih.gov/dailymed/services/v2/spls.json?rxcui=${encoded(rxcui)}&pagesize=10`;
  const data = await upstream(url);
  return { source: 'DailyMed / NLM', sourceUrl: url, retrievedAt: today(), results: (data.data || []).map(item => ({ title: item.title, setid: item.setid, updatedAt: item.published_date,
    sourceUrl: `https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=${encoded(item.setid)}` })) };
}
async function label(setid) {
  const url = `https://dailymed.nlm.nih.gov/dailymed/services/v2/spls/${encoded(setid)}.xml`;
  const xml = await upstream(url, 'xml');
  const rawDate = /<effectiveTime\b[^>]*value=["'](\d{8})/.exec(xml)?.[1];
  const updatedAt = rawDate ? `${rawDate.slice(0,4)}-${rawDate.slice(4,6)}-${rawDate.slice(6,8)}` : 'not supplied by source';
  return { source: 'DailyMed / NLM', sourceUrl: `https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=${encoded(setid)}`, updatedAt, retrievedAt: today(), sections: labelSections(xml),
    attribution: notices.dailymed.replace('[date]', updatedAt), disclaimer: notices.interactions.replace('[DailyMed/NLM]', 'DailyMed/NLM').replace('[date]', updatedAt) };
}
async function fda(kind, name) {
  const endpoint = kind === 'recalls' ? 'enforcement' : 'label';
  const field = kind === 'recalls' ? 'product_description' : 'openfda.generic_name';
  const url = `https://api.fda.gov/drug/${endpoint}.json?search=${encoded(`${field}:"${name}"`)}&limit=10${kind === 'recalls' ? '&sort=report_date:desc' : ''}`;
  const data = await upstream(url, 'json', true);
  return { source: 'openFDA', sourceUrl: url, retrievedAt: today(), dataDate: data.meta?.last_updated || 'not supplied', attribution: notices.fda, disclaimer: notices.recalls,
    results: (data.results || []).map(item => kind === 'recalls' ? { title: item.product_description, text: item.reason_for_recall, date: item.report_date, status: item.status, recallNumber: item.recall_number } : { title: (item.openfda?.brand_name || item.openfda?.generic_name || ['Label']).join(', '), date: item.effective_time, sections: ['drug_interactions', 'warnings', 'contraindications', 'indications_and_usage'].filter(key => item[key]?.length).map(key => ({ title: key.replace(/_/g, ' '), text: item[key].join('\n') })) }) };
}
async function pharmacies({ zip, city, state }) {
  const url = `https://npiregistry.cms.hhs.gov/api/?version=2.1&enumeration_type=NPI-2&taxonomy_description=Community%2FRetail%20Pharmacy&address_purpose=LOCATION&limit=100${zip ? `&postal_code=${encoded(zip)}` : `&city=${encoded(city)}&state=${encoded(state)}`}`;
  const additionalUrl = url.replace('Community%2FRetail%20Pharmacy', 'Pharmacy');
  const [data, additional] = await Promise.all([upstream(url), upstream(additionalUrl)]);
  if (data.Errors || additional.Errors) throw new Error('INVALID_REGISTRY_QUERY');
  return { source: 'CMS NPPES NPI Registry', sourceUrl: url, retrievedAt: today(), attribution: notices.nppes,
    results: [...new Map([...(data.results || []), ...(additional.results || [])].map(item => [item.number, item])).values()].filter(item => item.taxonomies?.some(taxonomy => /^3336/.test(taxonomy.code))).map(item => ({ npi: item.number, name: item.basic?.organization_name, taxonomies: item.taxonomies.filter(t => /^3336/.test(t.code)).map(t => t.code), updatedAt: item.basic?.last_updated,
      addresses: item.addresses?.filter(a => a.address_purpose === 'LOCATION').map(a => ({ address: [a.address_1, a.address_2, a.city, a.state, a.postal_code].filter(Boolean).join(', '), phone: a.telephone_number })) })) };
}
async function nadac(ndc) {
  // Dataset ID stays stable; CMS refreshes the underlying resource. No retail conversion.
  const url = `https://data.medicaid.gov/api/1/datastore/query/${NADAC_DATASET}/0?conditions[0][property]=ndc&conditions[0][value]=${encoded(ndc)}&conditions[0][operator]=%3D&limit=50&sort[0][property]=effective_date&sort[0][direction]=desc`;
  const data = await upstream(url);
  const results = (data.results || []).map(item => ({ description: item.ndc_description, ndc: item.ndc, costPerUnit: item.nadac_per_unit, unit: item.pricing_unit, effectiveDate: item.effective_date, asOfDate: item.as_of_date }));
  return { source: 'CMS NADAC', sourceUrl: `https://data.medicaid.gov/dataset/${NADAC_DATASET}`, retrievedAt: today(), title: 'Typical pharmacy acquisition cost — pharmacy acquisition cost, not your price', disclaimer: notices.nadac.replace('[date]', results[0]?.asOfDate || (results[0]?.effectiveDate ? `not supplied by source; effective date ${results[0].effectiveDate}` : 'not supplied; no cost available')), priceDisclaimer: notices.prices, results };
}
function registerUSData(app) {
  app.post('/api/us/:kind', async (req, res) => {
    res.set('Cache-Control', 'no-store');
    if (req.auricRegion !== 'US') return res.status(403).json({ error: 'US_CONSENT_REQUIRED' });
    try {
      const input = req.body || {};
      const kind = req.params.kind;
      const name = queryText(input.name);
      let data;
      if (kind === 'drugs' && name.length >= 2) data = await searchDrugs(name);
      else if (kind === 'labels' && /^\d{1,12}$/.test(input.rxcui || '')) data = await labels(input.rxcui);
      else if (kind === 'label' && /^[a-f\d-]{36}$/i.test(input.setid || '')) data = await label(input.setid);
      else if (['recalls', 'fda-labels'].includes(kind) && name.length >= 2) data = await fda(kind, name);
      else if (kind === 'pharmacies' && (/^\d{5}$/.test(input.zip || '') || (queryText(input.city).length >= 2 && /^[A-Z]{2}$/.test(input.state || '')))) data = await pharmacies({ zip: input.zip, city: queryText(input.city), state: input.state });
      else if (kind === 'nadac' && /^\d{11}$/.test(input.ndc || '')) data = await nadac(input.ndc);
      else return res.status(400).json({ error: 'INVALID_REFERENCE_QUERY' });
      return res.json(data);
    } catch { return res.status(502).json({ error: 'SOURCE_UNAVAILABLE', message: 'Reference source unavailable. Please retry or open the official source. No conclusion can be drawn from an unavailable source.' }); }
  });
}
module.exports = { registerUSData, searchDrugs, labels, label, fda, pharmacies, nadac, labelSections, queryText };
