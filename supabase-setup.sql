-- Run this in Supabase Dashboard > SQL Editor > New Query

-- 1. Purchases table (records every payment)
CREATE TABLE IF NOT EXISTS public.purchases (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  stripe_session_id TEXT UNIQUE,
  amount_cents INTEGER NOT NULL DEFAULT 500,
  access_token TEXT NOT NULL DEFAULT 'mbr_2025_full',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS purchases_email_idx ON public.purchases (email);

ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_full_access" ON public.purchases
  TO service_role USING (true) WITH CHECK (true);

-- 2. Plan sessions table (analytics)
CREATE TABLE IF NOT EXISTS public.plan_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT,
  email TEXT,
  country TEXT,
  goal TEXT,
  income NUMERIC,
  currency TEXT,
  paid BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.plan_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_full_access" ON public.plan_sessions
  TO service_role USING (true) WITH CHECK (true);

-- Done! You should see both tables in the Table Editor.
