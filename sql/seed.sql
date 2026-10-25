-- Hamdan Commission Shop Portal — seed (PostgreSQL)
-- The application also seeds itself on first server start (src/db/seed.ts), so this
-- script is only needed for manual installs. Run schema.sql first.

-- Fixed (system) accounts: cannot be renamed or deleted.
INSERT INTO stores (store_name, status) VALUES
  ('PIC CORN', 'Fixed'),
  ('Commission', 'Fixed'),
  ('Labour', 'Fixed'),
  ('Bardana', 'Fixed'),
  ('Thread', 'Fixed'),
  ('Market Fee', 'Fixed'),
  ('Expenses', 'Fixed'),
  ('Plastic Bag', 'Fixed'),
  ('Brokery', 'Fixed');

-- One active trading store.
INSERT INTO stores (store_name, status) VALUES ('Hamdan Afzal Ch', 'Active');

-- Settings (charge rates are per bori, commission is a percentage of gross).
INSERT INTO settings (setting_key, setting_value) VALUES
  ('shop_name', 'HAMDAN COMMISSION SHOP'),
  ('shop_address', '29/B Grain Market, Arifwala'),
  ('shop_phone', '0300-0070010'),
  ('agent_code', '160018'),
  ('commission_percent', '0.72'),
  ('labour_per_bori', '22'),
  ('thread_per_bori', '1'),
  ('plastic_per_bori', '34.5'),
  ('market_fee_per_bori', '1.4'),
  ('balance_wording', 'Net credit balance / Net debit balance'),
  ('timezone', 'Asia/Karachi');

-- Owner login. Generate the hash in Node:
--   node -e "const c=require('crypto'),s=c.randomBytes(16).toString('hex');console.log('scrypt$'+s+'$'+c.scryptSync(process.argv[1],s,32).toString('hex'))" 'YOUR_PASSWORD'
-- The account must change its password on first login.
INSERT INTO users (username, password_hash, must_change_password)
VALUES ('hamdan', 'scrypt$REPLACE_SALT$REPLACE_HASH', TRUE);
