/** Public state medical board lookup pages for US manual license review. */

const STATE_BOARD_LOOKUPS: Record<string, string> = {
  AL: 'https://www.albme.gov/licensee-search',
  AK: 'https://www.commerce.alaska.gov/cbp/main/search/professional',
  AZ: 'https://azmd.gov/DoctorSearch/DoctorSearch',
  AR: 'https://www.armedicalboard.org/Public/verify/default.aspx',
  CA: 'https://search.dca.ca.gov/',
  CO: 'https://apps.colorado.gov/dora/licensing/Lookup/LicenseLookup.aspx',
  CT: 'https://www.elicense.ct.gov/Lookup/LicenseLookup.aspx',
  DE: 'https://delpros.delaware.gov/OH_HomePage',
  FL: 'https://mqa-internet.doh.state.fl.us/MQASearchServices/HealthCareProviders',
  GA: 'https://gcmb.mylicense.com/verification/',
  HI: 'https://pvl.ehawaii.gov/pvlsearch/',
  ID: 'https://edopl.idaho.gov/online-services/',
  IL: 'https://online-dfpr.micropact.com/Lookup/LicenseLookup.aspx',
  IN: 'https://mylicense.in.gov/everification/',
  IA: 'https://eservices.iowa.gov/PublicPortal/Iowa/IBM/common/index.jsp',
  KS: 'https://www.kansas.gov/ssrv-ksbhada/search.html',
  KY: 'https://web1.ky.gov/GenSearch/LicenseSearch.aspx',
  LA: 'https://www.lsbme.la.gov/licensure/physician-search',
  ME: 'https://www.pfr.maine.gov/ALMSOnline/ALMSQuery/SearchIndividual.aspx',
  MD: 'https://www.mbp.state.md.us/bpqapp/',
  MA: 'https://findmydoctor.mass.gov/',
  MI: 'https://aca-prod.accela.com/MILARA/Default.aspx',
  MN: 'https://mnbm.hlblicense.com/verification/',
  MS: 'https://gateway.msbml.ms.gov/verification/search.aspx',
  MO: 'https://pr.mo.gov/licensee-search.asp',
  MT: 'https://ebiz.mt.gov/pol/',
  NE: 'https://www.nebraska.gov/LISSearch/search.cgi',
  NV: 'https://nsbm.boardsofnursing.org/licenselookup',
  NH: 'https://forms.nh.gov/license/Search.aspx',
  NJ: 'https://newjersey.mylicense.com/verification/',
  NM: 'https://verification.rld.nm.gov/',
  NY: 'https://www.op.nysed.gov/verification-search',
  NC: 'https://portal.ncmedboard.org/verification/search.aspx',
  ND: 'https://www.ndbom.org/public/find_verify/verify.asp',
  OH: 'https://elicense.ohio.gov/oh_query_personal.asp',
  OK: 'https://www.okmedicalboard.org/search',
  OR: 'https://omb.oregon.gov/search',
  PA: 'https://www.pals.pa.gov/#/page/search',
  RI: 'https://healthri.mylicense.com/Verification/',
  SC: 'https://verify.llronline.com/LicLookup/LookupMain.aspx',
  SD: 'https://www.sdbmoe.gov/verify/',
  TN: 'https://apps.health.tn.gov/Licensure/',
  TX: 'https://profile.tmb.state.tx.us/',
  UT: 'https://secure.utah.gov/llv/search/index.html',
  VT: 'https://www.healthvermont.gov/systems/medical-practice-board',
  VA: 'https://dhp.virginiainteractive.org/Lookup/Index',
  WA: 'https://fortress.wa.gov/doh/providercredentialsearch/',
  WV: 'https://wvbom.wv.gov/public/search/',
  WI: 'https://licensesearch.wi.gov/',
  WY: 'https://wybomexams.wyo.gov/Verification/search.aspx',
  DC: 'https://doh.force.com/ver/s/',
};

export function stateBoardLookupUrl(state: string | null | undefined): string | null {
  const code = String(state || '')
    .trim()
    .toUpperCase();
  if (!code || code.length !== 2) return null;
  return STATE_BOARD_LOOKUPS[code] || null;
}
