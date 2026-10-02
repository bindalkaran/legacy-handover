-- Legacy Handover schema. Idempotent: safe to run on every build.

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone text UNIQUE,
  email text UNIQUE,
  name text,
  role text NOT NULL DEFAULT 'owner',           -- owner | buyer | advisor
  firm text,
  city text,
  language text NOT NULL DEFAULT 'en',
  country text NOT NULL DEFAULT 'IN',
  notif_prefs jsonb NOT NULL DEFAULT '{}'::jsonb,
  marketing_consent boolean NOT NULL DEFAULT false,
  matching_consent boolean NOT NULL DEFAULT false,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS otp_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier text NOT NULL,
  code_hash text NOT NULL,
  attempts int NOT NULL DEFAULT 0,
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS otp_identifier_idx ON otp_codes (identifier, created_at DESC);

CREATE TABLE IF NOT EXISTS score_versions (
  version text PRIMARY KEY,
  weights jsonb NOT NULL,
  created_by text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS businesses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name text,
  legal_name text,
  gstin text,
  industry text,
  city text,
  state text,
  revenue_band text,
  employees_band text,
  years_band text,
  confidentiality_level int NOT NULL DEFAULT 0,
  review_status text NOT NULL DEFAULT 'New',   -- New | In review | Verified | Profile approved
  verification text NOT NULL DEFAULT 'Self-reported',
  lifecycle text NOT NULL DEFAULT 'Assessment',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS businesses_owner_idx ON businesses (owner_id);

CREATE TABLE IF NOT EXISTS assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  business_id uuid REFERENCES businesses(id) ON DELETE CASCADE,
  draft_token text UNIQUE,
  answers jsonb NOT NULL DEFAULT '{}'::jsonb,
  step int NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'draft',          -- draft | complete
  assessment_version text NOT NULL DEFAULT 'assess-v1.0',
  invite_token text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

CREATE TABLE IF NOT EXISTS scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id uuid REFERENCES assessments(id) ON DELETE CASCADE,
  business_id uuid REFERENCES businesses(id) ON DELETE CASCADE,
  transferability int NOT NULL,
  readiness int NOT NULL,
  independence int NOT NULL,
  dependency int NOT NULL,
  components jsonb NOT NULL,
  value_low numeric,
  value_high numeric,
  revenue_mid numeric,
  profit numeric,
  data_quality text,
  inputs jsonb NOT NULL,
  labels jsonb NOT NULL,
  score_version text NOT NULL,
  assessment_version text NOT NULL,
  calc_version text NOT NULL,
  narrative text,
  narrative_source text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS scores_business_idx ON scores (business_id, created_at DESC);

CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  task_key text,
  title text NOT NULL,
  category text NOT NULL,
  priority text NOT NULL,
  effort text,
  impact int NOT NULL DEFAULT 1,
  why text,
  criteria text,
  assignee text,
  assignee_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  due_date date,
  status text NOT NULL DEFAULT 'open',
  sort int NOT NULL DEFAULT 0,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS tasks_business_idx ON tasks (business_id);

CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  category text NOT NULL,
  name text NOT NULL,
  ext text,
  mime text,
  size int,
  version int NOT NULL DEFAULT 1,
  level int NOT NULL DEFAULT 3,
  permission text NOT NULL DEFAULT 'View only',  -- View only | View + download | Hidden
  data_b64 text,
  uploaded_by uuid REFERENCES users(id) ON DELETE SET NULL,
  views int NOT NULL DEFAULT 0,
  downloads int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS documents_business_idx ON documents (business_id);

CREATE TABLE IF NOT EXISTS advisor_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid REFERENCES businesses(id) ON DELETE CASCADE,
  advisor_user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  invited_contact text,
  client_name text,
  direction text NOT NULL DEFAULT 'owner_invited',   -- owner_invited | advisor_invited
  scope jsonb NOT NULL DEFAULT '["scores","tasks","documents"]'::jsonb,
  status text NOT NULL DEFAULT 'pending',            -- pending | active | revoked
  token text UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  author_id uuid REFERENCES users(id) ON DELETE SET NULL,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id bigserial PRIMARY KEY,
  actor_id uuid,
  actor_label text,
  business_id uuid,
  deal_id uuid,
  action text NOT NULL,
  kind text,
  detail jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS audit_business_idx ON audit_logs (business_id, created_at DESC);
CREATE INDEX IF NOT EXISTS audit_deal_idx ON audit_logs (deal_id, created_at DESC);

CREATE TABLE IF NOT EXISTS buyer_profiles (
  user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  buyer_type text,
  experience text,
  capital text,
  financing text,
  industries jsonb NOT NULL DEFAULT '[]'::jsonb,
  involvement text,
  timeline text,
  international boolean NOT NULL DEFAULT false,
  verification_stage int NOT NULL DEFAULT 1,   -- 1 profile complete, 2 identity, 3 financial, 4 qualified
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid UNIQUE REFERENCES businesses(id) ON DELETE CASCADE,
  industry text NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  revenue_band text,
  location text,
  years text,
  transferability_band text,
  deal_note text,
  verification text NOT NULL DEFAULT 'Self-reported',
  open_international boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'draft',     -- draft | pending | published | withdrawn
  is_sample boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS access_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  buyer_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message text,
  status text NOT NULL DEFAULT 'Owner reviewing',   -- Owner reviewing | Approved | Declined
  created_at timestamptz NOT NULL DEFAULT now(),
  decided_at timestamptz,
  UNIQUE (listing_id, buyer_id)
);

CREATE TABLE IF NOT EXISTS saved_searches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  label text NOT NULL,
  filters jsonb NOT NULL,
  frequency text NOT NULL DEFAULT 'Weekly',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS deals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ref text UNIQUE,
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  listing_id uuid REFERENCES listings(id) ON DELETE SET NULL,
  buyer_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  stage int NOT NULL DEFAULT 2,
  nda_owner_at timestamptz,
  nda_buyer_at timestamptz,
  buyer_max_level int NOT NULL DEFAULT 2,
  closing jsonb NOT NULL DEFAULT '{}'::jsonb,
  transition jsonb NOT NULL DEFAULT '{}'::jsonb,
  referrals jsonb NOT NULL DEFAULT '{}'::jsonb,
  closed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS deal_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id uuid NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  author_id uuid REFERENCES users(id) ON DELETE SET NULL,
  author_side text NOT NULL,
  question text NOT NULL,
  answer text,
  answered_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id uuid NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  from_side text NOT NULL,
  equity numeric NOT NULL DEFAULT 0,
  debt numeric NOT NULL DEFAULT 0,
  seller_financing numeric NOT NULL DEFAULT 0,
  earn_out numeric NOT NULL DEFAULT 0,
  timeline_months int,
  conditions text,
  status text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS professionals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  firm text,
  pro_type text NOT NULL,
  city text,
  languages text,
  expertise text,
  transitions int NOT NULL DEFAULT 0,
  rating text,
  fees_from text,
  contact text,
  is_sample boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'listed',   -- applied | listed | hidden
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  business_id uuid REFERENCES businesses(id) ON DELETE SET NULL,
  invoice_no text UNIQUE,
  item text NOT NULL,
  amount_paise int NOT NULL,
  gst_paise int NOT NULL,
  currency text NOT NULL DEFAULT 'INR',
  method text,
  provider text NOT NULL,           -- razorpay | test
  provider_order_id text,
  provider_payment_id text,
  status text NOT NULL,             -- created | paid | refunded | failed
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS passport_shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  token text UNIQUE NOT NULL,
  sections jsonb NOT NULL,
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz,
  views int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS callbacks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  phone text,
  status text NOT NULL DEFAULT 'new',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS crm_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  company text,
  city text,
  source text,
  stage text NOT NULL DEFAULT 'Prospect',
  note text,
  suppressed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS outreach_drafts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id uuid REFERENCES crm_contacts(id) ON DELETE CASCADE,
  channel text NOT NULL DEFAULT 'email',
  template_version text NOT NULL DEFAULT 'v3',
  body text NOT NULL,
  status text NOT NULL DEFAULT 'awaiting approval',   -- awaiting approval | approved | rejected
  approved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS professional_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  firm text,
  pro_type text,
  city text,
  contact text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS analytics_events (
  id bigserial PRIMARY KEY,
  name text NOT NULL,
  user_id uuid,
  props jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS analytics_name_idx ON analytics_events (name, created_at DESC);

CREATE TABLE IF NOT EXISTS app_config (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
