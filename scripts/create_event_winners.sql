CREATE TABLE IF NOT EXISTS public.event_winners (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id text NOT NULL,
  position integer NOT NULL DEFAULT 1,
  winner_title text NOT NULL,
  team_or_participant_name text NOT NULL,
  college text DEFAULT 'VIT Vellore',
  prize_amount text DEFAULT '',
  project_title text DEFAULT '',
  project_link text DEFAULT '',
  announced_by text DEFAULT 'Event Organizing Committee',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.event_winners ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Public read event_winners" ON public.event_winners FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Public insert event_winners" ON public.event_winners FOR INSERT WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Public update event_winners" ON public.event_winners FOR UPDATE USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
