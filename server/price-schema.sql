-- Apply explicitly to Neon before enabling PRICE_SYSTEM_ENABLED.
DO $$ BEGIN
  CREATE TYPE price_source AS ENUM ('profeco', 'ml_api', 'partner_feed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
CREATE TABLE IF NOT EXISTS price_products (
  id text PRIMARY KEY,
  active_ingredient text NOT NULL,
  strength text NOT NULL,
  form text NOT NULL,
  ean text UNIQUE,
  prescription_status text NOT NULL DEFAULT 'unknown' CHECK (prescription_status IN ('rx','otc','unknown')),
  UNIQUE(active_ingredient, strength, form, ean)
);
CREATE TABLE IF NOT EXISTS price_partners (
  id text PRIMARY KEY, chain text NOT NULL, enabled boolean NOT NULL DEFAULT false
);
CREATE TABLE IF NOT EXISTS price_stores (
  id text PRIMARY KEY, partner_id text REFERENCES price_partners(id), chain text NOT NULL,
  external_place_id text UNIQUE
);
CREATE TABLE IF NOT EXISTS prices (
  product_id text NOT NULL REFERENCES price_products(id), chain text NOT NULL,
  store_id text NOT NULL REFERENCES price_stores(id), price_mxn numeric(12,2) NOT NULL CHECK(price_mxn > 0),
  source price_source NOT NULL, observed_at timestamptz NOT NULL,
  fetched_at timestamptz NOT NULL DEFAULT now(), confidence numeric(4,3) NOT NULL CHECK(confidence BETWEEN 0 AND 1),
  purchase_url text,
  PRIMARY KEY(product_id, store_id, source, observed_at)
);
CREATE INDEX IF NOT EXISTS prices_lookup ON prices(product_id, store_id, observed_at DESC);
CREATE TABLE IF NOT EXISTS price_placements (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  partner_id text NOT NULL REFERENCES price_partners(id), product_id text NOT NULL REFERENCES price_products(id),
  title text NOT NULL CHECK(length(title) BETWEEN 1 AND 160),
  starts_at timestamptz NOT NULL, ends_at timestamptz NOT NULL CHECK(ends_at > starts_at),
  active boolean NOT NULL DEFAULT true
);
-- Defense in depth: catalog changes cannot turn an active OTC placement into an Rx ad.
CREATE OR REPLACE FUNCTION check_otc_placement() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NOT EXISTS(SELECT 1 FROM price_products WHERE id=NEW.product_id AND prescription_status='otc') THEN
    RAISE EXCEPTION 'Only explicitly classified OTC products may be sponsored';
  END IF;
  RETURN NEW;
END $$;
CREATE OR REPLACE TRIGGER price_placement_otc BEFORE INSERT OR UPDATE ON price_placements
FOR EACH ROW EXECUTE FUNCTION check_otc_placement();
CREATE TABLE IF NOT EXISTS price_import_runs (
  month text PRIMARY KEY, completed_at timestamptz NOT NULL DEFAULT now(), imported integer NOT NULL
);
CREATE TABLE IF NOT EXISTS price_oauth_tokens (
  provider text PRIMARY KEY, encrypted_refresh_token text NOT NULL, updated_at timestamptz NOT NULL DEFAULT now()
);
