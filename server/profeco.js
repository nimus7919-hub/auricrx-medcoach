const { createHash, timingSafeEqual } = require('crypto');
const normalize = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const hash = value => createHash('sha256').update(value).digest('hex');
const distance = (a, b) => {
  const rad = n => n * Math.PI / 180;
  const x = Math.sin(rad(b.lat-a.lat)/2)**2 + Math.cos(rad(a.lat))*Math.cos(rad(b.lat))*Math.sin(rad(b.lng-a.lng)/2)**2;
  return 6371000 * 2 * Math.asin(Math.sqrt(Math.min(1, x)));
};
function coordinates(query, required = false) {
  if (query.lat == null && query.lng == null && !required) return null;
  const lat = Number(query.lat), lng = Number(query.lng);
  if (query.lat === '' || query.lng === '' || query.lat == null || query.lng == null || !Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat)>90 || Math.abs(lng)>180) throw new Error('invalid_coordinates');
  return { lat, lng };
}
function signature(value) {
  const text = String(value || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const strengths = [...text.matchAll(/(\d+(?:[.,]\d+)?)\s*(mcg|mg|g|ui|ml)(?:\s*\/\s*(\d+(?:[.,]\d+)?)?\s*(ml|g))?/g)].map(m => {
    const unit = m[2] === 'g' ? 'mg' : m[2];
    return `${Number(m[1].replace(',','.')) * (m[2] === 'g' ? 1000 : 1)}${unit}${m[4] ? '/'+(m[3] || '1')+m[4] : ''}`;
  }).sort();
  const ingredients = normalize(text.replace(/\d+(?:[.,]\d+)?\s*(mcg|mg|g|ui|ml)/g, ' ')).split(' ').filter(w => !/^(caja|con|de|tabletas?|capsulas?|comprimidos?|solucion|suspension|inyectable|oral|y|\d+)$/.test(w)).sort();
  return { strengths: strengths.join('|'), ingredients: [...new Set(ingredients)].join('|') };
}
// Keep unknown presentation details null rather than guessing a package size.
function parsePresentation(value) {
  const text = String(value || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const strengthPattern = /\d+(?:[.,]\d+)?\s*(?:mcg|mg|g|ui|iu|%)(?:\s*\/\s*(?:\d+(?:[.,]\d+)?\s*)?(?:mcg|mg|ml|g|ui|iu))?/gi;
  const strengths = text.match(strengthPattern) || [];
  const packText = text.replace(strengthPattern, ' ');
  const pack = packText.match(/(\d+(?:[.,]\d+)?)\s*(tabletas?|tabs?\b|comprimidos?|capsulas?|caps?\b|grageas?|ampolletas?|ampollas?|sobres?|ml|mililitros?|g|gramos?)\b/i);
  const raw = pack?.[2] || '';
  const unit = /^(tab|comprim)/.test(raw) ? 'tablets' : /^cap/.test(raw) ? 'capsules' : /^grage/.test(raw) ? 'dragees' : /^amp/.test(raw) ? 'ampoules' : /^sobre/.test(raw) ? 'sachets' : /^(ml|mililitro)/.test(raw) ? 'ml' : /^(g|gramo)/.test(raw) ? 'g' : null;
  return { count: pack ? Number(pack[1].replace(',', '.')) : null, unit, strength: strengths.length ? strengths.join(' / ').replace(/\s+/g, ' ').trim() : null };
}
async function jsonFetch(url) {
  const response = await fetch(url, { signal: AbortSignal.timeout(60000), headers: { Accept: 'application/json' } });
  if (!response.ok) throw new Error(`upstream_http_${response.status}`);
  return response.json();
}
const attribution = 'Fuente: PROFECO, Quién es Quién en los Precios (CC-BY 4.0)';
function install(app, sql) {
  let trigrams = false, running = false;
  const ready = (async () => {
    try { await sql`CREATE EXTENSION IF NOT EXISTS pg_trgm`; trigrams = true; } catch { console.warn('PROFECO: pg_trgm unavailable; exact and ingredient matching remain enabled'); }
    const ddl = [
      `CREATE TABLE IF NOT EXISTS qqp_sources(resource_id text PRIMARY KEY, loaded_at timestamptz DEFAULT now(), row_count integer NOT NULL DEFAULT 0)`,
      `CREATE TABLE IF NOT EXISTS qqp_stores(id text PRIMARY KEY, chain text, branch text NOT NULL, address text, state text, municipio text, lat double precision, lng double precision, UNIQUE(branch,lat,lng))`,
      `CREATE TABLE IF NOT EXISTS qqp_prices(id bigserial PRIMARY KEY, producto text NOT NULL, presentacion text NOT NULL, marca text, precio numeric NOT NULL, fecha date NOT NULL, store_id text REFERENCES qqp_stores(id), resource_id text NOT NULL, _id text NOT NULL, UNIQUE(resource_id,_id))`,
      `CREATE INDEX IF NOT EXISTS qqp_product_idx ON qqp_prices(lower(producto))`,
      `CREATE INDEX IF NOT EXISTS qqp_date_store_idx ON qqp_prices(fecha,store_id)`,
      `CREATE TABLE IF NOT EXISTS med_qqp_map(med_id text, producto text, presentacion text, score double precision, method text, PRIMARY KEY(med_id,producto,presentacion))`,
      `CREATE TABLE IF NOT EXISTS qqp_match_review(producto text, presentacion text, reviewed boolean DEFAULT false, PRIMARY KEY(producto,presentacion))`,
      `CREATE TABLE IF NOT EXISTS denue_pharmacies(id text PRIMARY KEY, name text, razon_social text, chain text, address text, state text, municipio text, lat double precision, lng double precision, phone text, scian text, updated_at timestamptz DEFAULT now(), qqp_store_id text REFERENCES qqp_stores(id))`,
      `CREATE INDEX IF NOT EXISTS denue_location_idx ON denue_pharmacies(lat,lng)`,
      `CREATE TABLE IF NOT EXISTS pharmacy_jobs(name text PRIMARY KEY, completed_at timestamptz)`
    ];
    for (const statement of ddl) await sql.query(statement);
  })();
  ready.catch(() => console.error('PROFECO schema initialization failed'));
  // Catalog IDs are explicit IDs where present, otherwise stable normalized names.
  const catalog = [...new Map(require('../assets/medicationData.json').map(row => {
    const name = row.name || row.Medicinas || row.medicinas || row.brand || '';
    const components = (row.components || []).map(c => typeof c === 'string' ? c : [c.name || c.ingredient, c.strength].filter(Boolean).join(' ')).join(' + ');
    const med = { id: String(row.id || normalize(name)), name: normalize(name), signature: signature(components || name) };
    return [med.id + '|' + med.signature.ingredients + '|' + med.signature.strengths, med];
  }).filter(([,med]) => med.name)).values()];
  async function matchCatalog() {
    const products = await sql`SELECT DISTINCT producto,presentacion FROM qqp_prices`;
    let matched = 0;
    for (const product of products) {
      const name = normalize(product.producto), sig = signature(product.producto+' '+product.presentacion);
      let candidates = catalog.filter(m => m.name === name), method = 'name', score = 1;
      if (!candidates.length && sig.strengths && sig.ingredients) {
        candidates = catalog.filter(m => m.signature.strengths === sig.strengths && m.signature.ingredients === sig.ingredients);
        method = 'ingredient_strength';
      }
      if (!candidates.length && trigrams) {
        const hits = await sql`SELECT med_id, similarity(name,${name}) AS score FROM jsonb_to_recordset(${JSON.stringify(catalog.map(m => ({med_id:m.id,name:m.name}))) }::jsonb) AS c(med_id text,name text) WHERE similarity(name,${name})>=0.6 ORDER BY score DESC LIMIT 1`;
        if (hits.length) { candidates = [{id:hits[0].med_id}]; score = Number(hits[0].score); method = 'trigram'; }
      }
      for (const med of candidates) await sql`INSERT INTO med_qqp_map VALUES(${med.id},${product.producto},${product.presentacion},${score},${method}) ON CONFLICT(med_id,producto,presentacion) DO UPDATE SET score=excluded.score,method=excluded.method`;
      if (!candidates.length) await sql`INSERT INTO qqp_match_review(producto,presentacion) VALUES(${product.producto},${product.presentacion}) ON CONFLICT DO NOTHING`;
      else matched++;
    }
    console.log(`PROFECO matching: ${matched}/${products.length} products; ${products.length-matched} for review`);
  }
  async function pruneQQP() {
    const stat = async () => (await sql`SELECT (SELECT count(*) FROM qqp_prices)::bigint AS rows, pg_total_relation_size('qqp_prices') AS tbl, pg_database_size(current_database()) AS db`)[0];
    const before = await stat();
    await sql`DELETE FROM qqp_prices WHERE fecha < (SELECT max(fecha) FROM qqp_prices) - INTERVAL '90 days'`;
    try { await sql`VACUUM ANALYZE qqp_prices`; } catch (err) { console.log('PROFECO vacuum skipped: '+err.message); }
    const after = await stat();
    console.log('PROFECO retention (90d from newest): '+JSON.stringify({before,after}));
  }
  async function ingestQQP() {
    let total = 0;
    const [mx] = await sql`SELECT max(fecha) AS m FROM qqp_prices`;
    const cutoff = mx && mx.m ? new Date(new Date(mx.m).getTime()-90*86400000) : null;
    for (const year of [new Date().getUTCFullYear()-1, new Date().getUTCFullYear()]) {
      let pkg;
      try { pkg = await jsonFetch('https://www.datos.gob.mx/api/3/action/package_show?id=programa_quien_es_quien_precios_'+year); } catch(e) { if (year < new Date().getUTCFullYear() && e.message === 'upstream_http_404') continue; throw e; }
      if (!pkg.success) { if (year < new Date().getUTCFullYear()) continue; throw new Error('ckan_package_failed'); }
      for (const resource of pkg.result.resources || []) {
        if ((await sql`SELECT resource_id FROM qqp_sources WHERE resource_id=${resource.id} AND row_count > 0`).length) continue;
        const per = /b(\d{2})_(\d{4})_q(\d)/i.exec(String(resource.name||'')+' '+String(resource.url||''));
        if (cutoff && per && new Date(Date.UTC(+per[2], +per[1]-1, per[3]==='1'?16:32)) < cutoff) { console.log(`PROFECO skip old resource ${resource.id}`); continue; }
        let offset = 0, count = 0, csvRows = null;
        while (true) {
          const url = new URL('https://www.datos.gob.mx/api/3/action/datastore_search');
          url.search = new URLSearchParams({resource_id:resource.id,filters:JSON.stringify({categoria:'Medicamentos'}),limit:'10000',offset:String(offset),sort:'_id asc'}).toString();
          let page;
          try {
            if (csvRows) page = {success:true,result:{records:csvRows.slice(offset,offset+10000),total:csvRows.length}};
            else {
              page = await jsonFetch(url);
              if (!page.success) throw new Error('ckan_page_failed');
            }
          } catch (error) {
            if (offset || !resource.url || !String(resource.url).startsWith('https://')) throw error;
            const response = await fetch(resource.url,{signal:AbortSignal.timeout(120000),headers:{Accept:'text/csv'}});
            if (!response.ok) throw new Error('ckan_and_csv_unavailable');
            const csvText = await response.text();
            if (!csvText.split(/\r?\n/,1)[0].toLowerCase().includes('categoria')) throw new Error('csv_invalid_header');
            csvRows = require('./price-core').parseCsv(csvText).map((r,i)=>({...r,_id:String(i+1)})).filter(r=>normalize(r.categoria)==='medicamentos');
            page = {success:true,result:{records:csvRows.slice(0,10000),total:csvRows.length}};
          }
          if (!page.success || !Array.isArray(page.result?.records)) throw new Error('ckan_page_failed');
          const records = page.result.records;
          const rows = records.map(r => {
            const lat = Number(r.latitud), lng = Number(r.longitud), price = Number(String(r.precio).replace(/[$,]/g,''));
            const date = String(r.fecha_registro || '').slice(0,10).replace(/\//g,'-');
            return { ...r, lat: Number.isFinite(lat) && r.latitud !== '' ? lat : null, lng: Number.isFinite(lng) && r.longitud !== '' ? lng : null, price, date, sid:hash(JSON.stringify([r.nombre_comercial || '',Number.isFinite(lat) && r.latitud !== '' ? lat : null,Number.isFinite(lng) && r.longitud !== '' ? lng : null])) };
          }).filter(r => Number.isFinite(r.price) && r.price>0 && /^\d{4}-\d{2}-\d{2}$/.test(r.date) && r._id != null);
          // One roundtrip per page, with SQL conflict handling for restart-safe ingest.
          await sql`WITH input AS (SELECT * FROM jsonb_to_recordset(${JSON.stringify(rows)}::jsonb) AS r(sid text,nombre_comercial text,cadena_comercial text,direccion text,estado text,municipio text,lat float8,lng float8,producto text,presentacion text,marca text,price numeric,date date,_id text)), stores AS (INSERT INTO qqp_stores(id,chain,branch,address,state,municipio,lat,lng) SELECT DISTINCT ON (sid) sid,cadena_comercial,coalesce(nombre_comercial,''),direccion,estado,municipio,lat,lng FROM input ON CONFLICT DO NOTHING RETURNING id) INSERT INTO qqp_prices(producto,presentacion,marca,precio,fecha,store_id,resource_id,_id) SELECT coalesce(producto,''),coalesce(presentacion,''),marca,price,date,sid,${resource.id},_id FROM input WHERE date >= COALESCE((SELECT max(fecha) FROM qqp_prices),'1900-01-01'::date)-INTERVAL '90 days' ON CONFLICT(resource_id,_id) DO NOTHING`;
          count += rows.length; offset += records.length;
          if (!records.length || offset >= Number(page.result.total)) break;
        }
        await sql`INSERT INTO qqp_sources(resource_id,row_count) VALUES(${resource.id},${count}) ON CONFLICT (resource_id) DO UPDATE SET row_count=excluded.row_count`;
        total += count; console.log(`PROFECO resource ${resource.id}: ${count} valid rows`);
      }
    }
    await pruneQQP();
    await matchCatalog();
    console.log(`PROFECO ingest: ${total} valid rows processed`);
    return total;
  }
  async function linkStores() {
    const stores = await sql`SELECT * FROM qqp_stores WHERE lat IS NOT NULL AND lng IS NOT NULL`;
    for (const store of stores) {
      const nearby = await sql`SELECT id,name,chain,lat,lng FROM denue_pharmacies WHERE abs(lat-${store.lat})<0.002 AND abs(lng-${store.lng})<0.003`;
      const chain = normalize(store.chain).replace(/\bfarmacias?\b/g,'').trim();
      if (!chain) continue;
      const match = nearby.filter(p => distance(store,p)<=150 && (normalize(p.name).includes(chain) || normalize(p.chain).includes(chain))).sort((a,b)=>distance(store,a)-distance(store,b))[0];
      if (match) await sql`UPDATE denue_pharmacies SET qqp_store_id=${store.id} WHERE id=${match.id}`;
    }
  }
  async function ingestDENUE() {
    const token = (process.env.INEGI_DENUE_TOKEN || process.env.INEGI_TOKEN);
    if (!token) { console.log('DENUE skipped: INEGI_DENUE_TOKEN not set'); return; }
    const [job] = await sql`SELECT completed_at FROM pharmacy_jobs WHERE name='denue'`;
    if (job && Date.now()-new Date(job.completed_at).getTime()<30*86400000) return;
    let count = 0;
    for (let state=1;state<=32;state++) for (const scian of ['464111','464112']) {
      for (let start=1;;start+=1000) {
        const url = `https://www.inegi.org.mx/app/api/denue/v1/consulta/BuscarAreaActEstr/${String(state).padStart(2,'0')}/0/0/0/0/0/0/0/${scian}/0/${start}/${start+999}/0/0/${encodeURIComponent(token)}`;
        let page; try { page = await jsonFetch(url); } catch (e) { if (e.message === 'upstream_http_404') page = []; else throw e; }
        if (!Array.isArray(page)) throw new Error('denue_invalid_response');
        const rows = page.filter(r=>r.Id && Number.isFinite(Number(r.Latitud)) && Number.isFinite(Number(r.Longitud))).map(r=>({id:String(r.Id),name:r.Nombre,razon_social:r.Razon_social,chain:r.Razon_social || r.Nombre,address:[r.Calle,r.Num_Exterior,r.Colonia,r.CP].filter(Boolean).join(' '),state:r.Entidad || String(r.Ubicacion || '').split(',').pop()?.trim(),municipio:r.Municipio || String(r.Ubicacion || '').split(',')[1]?.trim(),lat:Number(r.Latitud),lng:Number(r.Longitud),phone:r.Telefono,scian}));
        await sql`INSERT INTO denue_pharmacies(id,name,razon_social,chain,address,state,municipio,lat,lng,phone,scian) SELECT id,name,razon_social,chain,address,state,municipio,lat,lng,phone,scian FROM jsonb_to_recordset(${JSON.stringify(rows)}::jsonb) AS r(id text,name text,razon_social text,chain text,address text,state text,municipio text,lat float8,lng float8,phone text,scian text) ON CONFLICT(id) DO UPDATE SET name=excluded.name,razon_social=excluded.razon_social,chain=excluded.chain,address=excluded.address,state=excluded.state,municipio=excluded.municipio,lat=excluded.lat,lng=excluded.lng,phone=excluded.phone,scian=excluded.scian,updated_at=now()`;
        count += rows.length;
        if (page.length<1000) break;
      }
    }
    await sql`INSERT INTO pharmacy_jobs(name,completed_at) VALUES('denue',now()) ON CONFLICT(name) DO UPDATE SET completed_at=now()`;
    console.log(`DENUE refreshed: ${count} pharmacies`);
  }
  async function run() {
    if (running) return { running:true };
    running = true;
    try {
      await ready;
      const results = await Promise.allSettled([ingestQQP(),ingestDENUE()]);
      await linkStores();
      for (let i=0;i<results.length;i++) if(results[i].status==='rejected') console.error(`${i ? 'DENUE' : 'PROFECO'} ingest failed: ${results[i].reason.message}`);
      return { ok:results.every(r=>r.status==='fulfilled'), rows:results[0].value || 0 };
    } finally { running = false; }
  }
  async function driving(origin, stores) {
    const key = process.env.GOOGLE_PLACES_API_KEY;
    if (!key || !origin || !stores.length) return;
    try {
      const url = new URL('https://maps.googleapis.com/maps/api/distancematrix/json');
      url.search = new URLSearchParams({origins:`${origin.lat},${origin.lng}`,destinations:stores.slice(0,5).map(s=>`${s.lat},${s.lng}`).join('|'),mode:'driving',key}).toString();
      const data = await jsonFetch(url);
      (data.rows?.[0]?.elements || []).forEach((e,i)=>{ if(e.status==='OK') { stores[i].driving_distance_m=e.distance.value; stores[i].driving_duration_s=e.duration.value; } });
    } catch { /* Optional enrichment. */ }
  }
  const handler = fn => async (req,res) => { try { await ready; await fn(req,res); } catch(e) { const bad = /^invalid_|^med_required/.test(e.message); res.status(bad?400:503).json({ok:false,error:bad?e.message:'pharmacy_data_unavailable'}); } };
  app.post('/api/admin/ingest/profeco', (req,res,next)=>{
    const expected = process.env.ADMIN_TOKEN;
    if (!expected) return res.status(404).end();
    const supplied = String(req.get('x-admin-token') || req.get('admin-token') || (req.get('authorization') || '').replace(/^Bearer /,''));
    const a=Buffer.from(expected), b=Buffer.from(supplied);
    if(a.length!==b.length || !timingSafeEqual(a,b)) return res.status(401).end();
    next();
  },handler(async (_req,res)=>{ const result = await run(); res.status(result.ok === false?502:200).json(result); }));
  app.get('/api/pharmacies/nearby',handler(async (req,res)=>{
    const origin = coordinates(req.query,true), radius = req.query.radius == null ? 3000 : Number(req.query.radius);
    if (!Number.isFinite(radius) || radius<=0) throw new Error('invalid_radius');
    const [exists] = await sql`SELECT EXISTS(SELECT 1 FROM denue_pharmacies) AS populated`;
    const fallback = !exists.populated, max = Math.min(radius,20000), delta = max/111000;
    const stores = fallback
      ? await sql`SELECT id,branch AS name,chain,address,state,municipio,lat,lng FROM qqp_stores WHERE lat BETWEEN ${origin.lat-delta} AND ${origin.lat+delta}`
      : await sql`SELECT * FROM denue_pharmacies WHERE lat BETWEEN ${origin.lat-delta} AND ${origin.lat+delta}`;
    const nearby = stores.filter(s=>s.lat!=null && s.lng!=null).map(s=>({...s,lon:s.lng,distance_m:distance(origin,s),distanceMiles:distance(origin,s)/1609.344})).filter(s=>s.distance_m<=max).sort((a,b)=>a.distance_m-b.distance_m).slice(0,30);
    await driving(origin,nearby);
    res.json({ok:true,pharmacies:nearby,source:fallback?'PROFECO QQP':'INEGI DENUE',fallback});
  }));
  app.get('/api/prices',handler(async (req,res)=>{
    const med = String(req.query.med || '').trim();
    if (!med || med.length>300) throw new Error('med_required');
    const origin = coordinates(req.query), state = normalize(req.query.state);
    const requestedRadius = req.query.radius_km == null ? null : Number(req.query.radius_km);
    if (requestedRadius != null && (!Number.isFinite(requestedRadius) || requestedRadius <= 0 || requestedRadius > 250)) throw new Error('invalid_radius');
    let ids = [...new Set(catalog.filter(m=>m.id===med || m.name===normalize(med)).map(m=>m.id))];
    if (!ids.length) { const q = normalize(med); ids = [...new Set(catalog.filter(m=>m.name.startsWith(q)).slice(0,200).map(m=>m.id))]; }
    const rows = await sql`WITH matched AS (SELECT p.* FROM qqp_prices p WHERE EXISTS(SELECT 1 FROM med_qqp_map m WHERE m.producto=p.producto AND m.presentacion=p.presentacion AND m.med_id=ANY(${ids}::text[]))) SELECT p.*,s.chain,s.branch,s.address,s.state,s.lat,s.lng FROM matched p JOIN qqp_stores s ON s.id=p.store_id WHERE p.fecha>=(SELECT max(fecha) FROM matched)-INTERVAL '90 days' ORDER BY p.fecha DESC,p.id DESC`;
    const summary = list => { const values=list.map(r=>Number(r.precio)); return {min:values.length?values.reduce((a,b)=>Math.min(a,b),Infinity):null,avg:values.length?values.reduce((a,b)=>a+b,0)/values.length:null,max:values.length?values.reduce((a,b)=>Math.max(a,b),-Infinity):null,count:values.length}; };
    const local = state ? rows.filter(r=>normalize(r.state)===state) : [], fallback = !local.length;
    const chains = new Map(), stores = new Map();
    for (const r of rows) { if(!chains.has(r.chain)) chains.set(r.chain,[]); chains.get(r.chain).push(r); if(!stores.has(r.store_id)) stores.set(r.store_id,r); }
    const candidates = origin ? [...stores.values()].filter(s=>s.lat!=null && s.lng!=null).map(s=>({id:s.store_id,name:s.branch,chain:s.chain,branch:s.branch,address:s.address,state:s.state,lat:s.lat,lng:s.lng,lon:s.lng,presentacion:s.presentacion,parsed:parsePresentation(s.presentacion),price:Number(s.precio),last_price:Number(s.precio),as_of:s.fecha,observed_at:s.fecha,distance_m:distance(origin,s),distanceMiles:distance(origin,s)/1609.344})).sort((a,b)=>a.distance_m-b.distance_m) : [];
    const radiusKm = requestedRadius ?? (candidates.filter(s=>s.distance_m<=15000).length < 3 ? 50 : 15);
    const nearest = candidates.filter(s=>s.distance_m<=radiusKm*1000);
    await driving(origin,nearest);
    res.json({ok:true,med,radius_km:radiusKm,presentations:[...new Set(rows.map(r=>r.presentacion))].map(presentacion=>({presentacion,parsed:parsePresentation(presentacion)})),state:summary(local),national:summary(rows),summary:summary(fallback?rows:local),per_chain:[...chains].map(([chain,list])=>({chain,...summary(list),as_of:list[0].fecha})),nearest,source:'PROFECO QQP',attribution,as_of:rows[0]?.fecha || null,fallback,window_days:90,window_anchor:'latest_observation',currency:'MXN'});
  }));
  const safeRun = () => run().catch(()=>console.error('Pharmacy refresh failed'));
  const first = setTimeout(safeRun,120000); first.unref?.();
  const weekly = setInterval(safeRun,7*86400000); weekly.unref?.();
  // DENUE freshness is checked daily; a completed refresh is reused for 30 days.
  const monthly = setInterval(()=>ready.then(()=>ingestDENUE()).then(()=>linkStores()).catch(()=>console.error('DENUE refresh failed')),86400000); monthly.unref?.();
  if (!(process.env.INEGI_DENUE_TOKEN || process.env.INEGI_TOKEN)) console.log('DENUE skipped: INEGI_DENUE_TOKEN not set');
  return {ready,run};
}
module.exports = {install,normalize,signature,distance,coordinates,parsePresentation};
