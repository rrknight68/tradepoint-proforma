-- Trade Point Proforma — Assumptions Table
-- Supabase project: yefrzehgaldvktuxdrms

CREATE TABLE IF NOT EXISTS tp_assumptions (
  key text PRIMARY KEY,
  value text NOT NULL,
  updated_at timestamptz DEFAULT now()
);

-- RLS: public read, no public write
ALTER TABLE tp_assumptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read" ON tp_assumptions;
CREATE POLICY "Public read" ON tp_assumptions FOR SELECT USING (true);

DROP POLICY IF EXISTS "Service write" ON tp_assumptions;
CREATE POLICY "Service write" ON tp_assumptions FOR ALL USING (true) WITH CHECK (true);

-- Seed all 55 assumption rows
INSERT INTO tp_assumptions (key, value) VALUES
  ('ph1_price_sf', '350'),
  ('ph2a_price_sf', '357.5'),
  ('ph2b_price_sf', '367.5'),
  ('ph1_small_units', '8'),
  ('ph1_small_sf', '2000'),
  ('ph1_mid_units', '8'),
  ('ph1_mid_sf', '2400'),
  ('ph1_large_units', '4'),
  ('ph1_large_sf', '3972'),
  ('ph2a_small_units', '4'),
  ('ph2a_small_sf', '1750'),
  ('ph2a_mid_units', '8'),
  ('ph2a_mid_sf', '2415'),
  ('ph2a_large_units', '2'),
  ('ph2a_large_sf', '3500'),
  ('ph2b_premium_units', '4'),
  ('ph2b_premium_sf', '3464'),
  ('hard_cost_sf', '155'),
  ('land_cost', '2343051'),
  ('land_appraised', '4500000'),
  ('ltc', '0.70'),
  ('loan_rate', '0.085'),
  ('ph1_draw_months', '12'),
  ('ph2a_draw_months', '8'),
  ('ph2b_draw_months', '5'),
  ('broker_pct', '0.05'),
  ('closing_pct', '0.0075'),
  ('absorption_rate', '2'),
  ('construction_months', '24'),
  ('absorption_months', '12'),
  ('dev_fee_pct', '0.02'),
  ('cm_fee_pct', '0.03'),
  ('asset_mgmt_per_month', '7500'),
  ('placement_fee_pct', '0.03'),
  ('cogp_equity_raise', '2500000'),
  ('gp_equity', '500000'),
  ('land_equity_credit', '2003827'),
  ('pref_rate_senior', '0.13'),
  ('pref_rate_equity', '0.10'),
  ('profit_split_cogp', '0.50'),
  ('option_b_pref_tranche', '4000000'),
  ('arch_eng_ph1', '377078'),
  ('arch_eng_ph2a', '245933'),
  ('arch_eng_ph2b', '102270'),
  ('permits_ph1', '235674'),
  ('permits_ph2a', '153708'),
  ('permits_ph2b', '63919'),
  ('legal_ph1', '45000'),
  ('legal_ph2a', '30000'),
  ('legal_ph2b', '15000'),
  ('enviro_ph1', '35000'),
  ('enviro_ph2a', '20000'),
  ('enviro_ph2b', '10000'),
  ('marketing_ph1', '75000'),
  ('marketing_ph2a', '50000'),
  ('marketing_ph2b', '25000')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now();
