CREATE TABLE IF NOT EXISTS public.teammate_listings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id text NOT NULL,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_name text NOT NULL,
  user_college text DEFAULT '',
  looking_for text NOT NULL,
  message text DEFAULT '',
  contact text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  UNIQUE (event_id, user_id)
);

ALTER TABLE public.teammate_listings ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Public read teammate_listings" ON public.teammate_listings FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Owner insert teammate_listings" ON public.teammate_listings FOR INSERT WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Owner update teammate_listings" ON public.teammate_listings FOR UPDATE USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Owner delete teammate_listings" ON public.teammate_listings FOR DELETE USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
