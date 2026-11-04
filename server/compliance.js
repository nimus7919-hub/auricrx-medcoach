// Account and consent operations must remain accessible to expired subscribers.
// Authenticate without verifyUser's subscription gate or implicit profile creation.
const path = require('path');
const admin = require('./firebase-admin');
const NOTICE_VERSION = '2026-11-02';
const US_VERSION = 'US-2026-11-03';

module.exports = function registerCompliance(app, sql, getStripe) {
  // Ensure the consents table exists (idempotent; mirrors migrate-consents.sql).
  (async () => { try {
    await sql`CREATE TABLE IF NOT EXISTS consents (id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY, user_id TEXT NOT NULL, recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), notice_version TEXT NOT NULL, method TEXT NOT NULL CHECK (method IN ('email', 'google')), terms BOOLEAN NOT NULL, privacy BOOLEAN NOT NULL, health BOOLEAN NOT NULL)`;
    await sql`CREATE INDEX IF NOT EXISTS consents_user_latest ON consents(user_id, id DESC)`;
    console.log('[compliance] consents table ready');
  } catch (e) { console.error('[compliance] consents migration failed:', e?.message); } })();
  let usTableReady;
  function ensureUSConsents() {
    if (!usTableReady) usTableReady = sql`CREATE TABLE IF NOT EXISTS us_consents (
      id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY, user_id TEXT NOT NULL,
      recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), notice_version TEXT NOT NULL,
      terms BOOLEAN NOT NULL, privacy BOOLEAN NOT NULL, health BOOLEAN NOT NULL, share BOOLEAN NOT NULL,
      terms_version TEXT NOT NULL, collection_version TEXT NOT NULL, sharing_version TEXT NOT NULL
    )`.catch(error => { usTableReady = null; throw error; });
    return usTableReady;
  }
  async function identity(req, res, next) {
    try {
      const token = /^Bearer (.+)$/i.exec(req.headers.authorization || '')?.[1];
      let decoded;
      try { decoded = await admin.auth().verifyIdToken(token, true); }
      catch (e) { if (e?.code !== 'app/invalid-credential') throw e; console.warn('[identity] revocation check unavailable, verifying signature only'); decoded = await admin.auth().verifyIdToken(token); }
      if ([req.body?.userId, req.body?.user_id, req.body?.uid, req.query?.userId, req.query?.user_id, req.query?.uid].some(id => id && id !== decoded.uid)) {
        return res.status(403).json({ error: 'USER_MISMATCH' });
      }
      req.complianceUser = decoded;
      return next();
    } catch (e) { console.warn('[identity] token verify failed:', e?.code, e?.message); return res.status(401).json({ error: 'INVALID_TOKEN' }); }
  }
  app.get('/account-deletion', (_req, res) => {
    res.set('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
    res.sendFile(path.join(__dirname, '../docs/account-deletion.html'));
  });
  app.get('/account-deletion.js', (_req, res) => res.sendFile(path.join(__dirname, '../docs/account-deletion.js')));
  app.get('/account-deletion-config', (_req, res) => {
    // Public Firebase browser configuration already distributed in the app; no admin credentials.
    res.json({ apiKey: "AIzaSyB0SzS0Q7FpKienp-7Y8SnLHRmvrNq4PXE", authDomain: 'auricrx-medcoach.firebaseapp.com', projectId: 'auricrx-medcoach' });
  });
  app.get('/api/consents', identity, async (req, res) => {
    try {
      if (req.get('X-Auric-Region') === 'US') {
        await ensureUSConsents();
        const rows = await sql`SELECT terms, privacy, health, share, notice_version FROM us_consents WHERE user_id = ${req.complianceUser.uid} ORDER BY id DESC LIMIT 1`;
        return res.json(rows[0]?.notice_version === US_VERSION ? rows[0] : { terms: false, privacy: false, health: false, share: false });
      }
      const rows = await sql`SELECT terms, privacy, health, notice_version FROM consents
        WHERE user_id = ${req.complianceUser.uid} ORDER BY id DESC LIMIT 1`;
      const current = rows[0];
      res.json(current?.notice_version === NOTICE_VERSION ? current : { terms: false, privacy: false, health: false });
    } catch (e) { console.error('[consents] read failed:', e?.message); res.status(503).json({ error: 'CONSENTS_UNAVAILABLE' }); }
  });
  app.post('/api/consents', identity, async (req, res) => {
    const { terms, privacy, health, noticeVersion, share } = req.body;
    if (req.get('X-Auric-Region') === 'US') {
      if ([terms, privacy, health, share].some(value => typeof value !== 'boolean') || noticeVersion !== US_VERSION) return res.status(400).json({ error: 'INVALID_US_CONSENT' });
      try {
        await ensureUSConsents();
        await sql`INSERT INTO us_consents (user_id, notice_version, terms, privacy, health, share, terms_version, collection_version, sharing_version)
          VALUES (${req.complianceUser.uid}, ${US_VERSION}, ${terms}, ${privacy}, ${health}, ${share}, ${US_VERSION}, ${US_VERSION}, ${US_VERSION})`;
        return res.json({ ok: true });
      } catch { return res.status(503).json({ error: 'CONSENT_NOT_SAVED' }); }
    }
    const method = req.complianceUser.firebase?.sign_in_provider === 'google.com' ? 'google' : 'email';
    if (typeof terms !== 'boolean' || typeof privacy !== 'boolean' || typeof health !== 'boolean' ||
        noticeVersion !== NOTICE_VERSION) {
      return res.status(400).json({ error: 'INVALID_CONSENT' });
    }
    try {
      await sql`INSERT INTO consents (user_id, notice_version, method, terms, privacy, health)
        VALUES (${req.complianceUser.uid}, ${noticeVersion}, ${method}, ${terms}, ${privacy}, ${health})`;
      res.json({ ok: true });
    } catch (e) { console.error('[consents] save failed:', e?.message); res.status(503).json({ error: 'CONSENT_NOT_SAVED' }); }
  });
  app.delete('/api/account', identity, async (req, res) => {
    const uid = req.complianceUser.uid;
    try {
      // Cancel billing first. Failure leaves the identity intact so the user can retry.
      const profiles = await sql`SELECT stripe_customer_id FROM user_profiles WHERE user_id = ${uid}`;
      const customer = profiles[0]?.stripe_customer_id;
      if (customer) {
        const stripe = getStripe();
        for await (const subscription of stripe.subscriptions.list({ customer, status: 'all', limit: 100 })) {
          if (!['canceled', 'incomplete_expired'].includes(subscription.status)) await stripe.subscriptions.cancel(subscription.id);
        }
      }
      // No StoreKit/Play Billing purchase integration exists in this app yet.
      // TODO(OWNER-DECISION): Implement verified store cancellation before enabling store purchases.
      // Discover all per-user tables, including sync/chat/contribution/subscription tables.
      // Identifiers come only from PostgreSQL metadata; values are bound parameters.
      const columns = await sql`SELECT c.table_name, c.column_name FROM information_schema.columns c
        JOIN information_schema.tables t ON t.table_schema = c.table_schema AND t.table_name = c.table_name
        WHERE c.table_schema = 'public' AND t.table_type = 'BASE TABLE'
        AND c.column_name IN ('user_id', 'firebase_uid')`;
      const quote = value => '"' + value.replace(/"/g, '""') + '"';
      const grouped = new Map();
      for (const row of columns) {
        if (!grouped.has(row.table_name)) grouped.set(row.table_name, []);
        grouped.get(row.table_name).push(row.column_name);
      }
      const edges = await sql`SELECT child.relname AS child, parent.relname AS parent
        FROM pg_constraint fk JOIN pg_class child ON child.oid = fk.conrelid
        JOIN pg_class parent ON parent.oid = fk.confrelid
        JOIN pg_namespace ns ON ns.oid = child.relnamespace
        WHERE fk.contype = 'f' AND ns.nspname = 'public'`;
      const tables = [];
      const pending = new Set(grouped.keys());
      while (pending.size) {
        const leaves = [...pending].filter(table => !edges.some(edge => edge.parent === table && edge.child !== table && pending.has(edge.child)));
        if (!leaves.length) throw new Error('CYCLIC_ACCOUNT_TABLE_DEPENDENCIES');
        tables.push(...leaves);
        leaves.forEach(table => pending.delete(table));
      }
      await sql.transaction(tables.map(table => sql.query(
        `DELETE FROM public.${quote(table)} WHERE ${grouped.get(table).map(column => `${quote(column)}::text = $1`).join(' OR ')}`, [uid]
      )));
      try { await admin.auth().deleteUser(uid); }
      catch (error) { if (error.code !== 'auth/user-not-found') throw error; }
      res.json({ ok: true });
    } catch (error) {
      console.error('Account deletion did not complete:', error.code || 'OPERATION_FAILED');
      res.status(503).json({ error: 'DELETION_INCOMPLETE', message: 'Deletion did not complete. Please retry; no success has been recorded.' });
    }
  });

  // Health processing requires an explicit, current, unwithdrawn consent.
  app.use(async (req, res, next) => {
    if (!/^\/(?:ask(?:-stream)?$|(?:medication|supplement)-contributions(?:\/|$)|api\/(?:us(?:\/|$)|ai(?:\/|$)|medications(?:\/|$)|symptoms(?:\/|$)|supplements(?:\/|$)|fasting-profile(?:\/|$)|health-profiles?(?:\/|$)|generate-health-report$|sync(?:\/|$)))/.test(req.path)) return next();
    await identity(req, res, async () => {
      try {
        await ensureUSConsents();
        const usRows = await sql`SELECT terms, privacy, health, share, notice_version FROM us_consents WHERE user_id = ${req.complianceUser.uid} ORDER BY id DESC LIMIT 1`;
        if (req.get('X-Auric-Region') === 'US' || (usRows.length && req.get('X-Auric-Region') !== 'MX')) {
          const current = usRows[0];
          if (!current?.terms || !current?.privacy || !current?.health || !current?.share || current?.notice_version !== US_VERSION) return res.status(403).json({ error: 'US_HEALTH_CONSENT_REQUIRED' });
          req.auricRegion = 'US';
          if (req.path === '/api/generate-health-report') return res.status(409).json({ error: 'US_WELLNESS_DISPLAY_ONLY' });
          return next();
        }
        const rows = await sql`SELECT health, notice_version FROM consents WHERE user_id = ${req.complianceUser.uid} ORDER BY id DESC LIMIT 1`;
        if (!rows[0]?.health || rows[0].notice_version !== NOTICE_VERSION) return res.status(403).json({ error: 'HEALTH_CONSENT_REQUIRED' });
        return next();
      } catch (e) { console.error('[consents] read failed:', e?.message); res.status(503).json({ error: 'CONSENTS_UNAVAILABLE' }); }
    });
  });
};
