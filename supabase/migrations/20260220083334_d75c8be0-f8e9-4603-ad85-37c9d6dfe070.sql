
-- Fix driver_presence RLS policies
DROP POLICY IF EXISTS "Users can upsert own presence" ON public.driver_presence;
DROP POLICY IF EXISTS "Users can update own presence" ON public.driver_presence;
CREATE POLICY "Users manage own presence"
  ON public.driver_presence
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Add delete policy for driver_presence (needed for ghost mode cleanup)
CREATE POLICY "Users can delete own presence"
  ON public.driver_presence
  FOR DELETE
  USING (auth.uid() = user_id);

-- Add ghost_mode to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS ghost_mode BOOLEAN NOT NULL DEFAULT false;

-- Enable earthdistance extensions
CREATE EXTENSION IF NOT EXISTS cube;
CREATE EXTENSION IF NOT EXISTS earthdistance;

-- Proximity search function
CREATE OR REPLACE FUNCTION reports_within_radius(
  user_lat double precision,
  user_lng double precision,
  radius_km double precision DEFAULT 10
)
RETURNS SETOF reports
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM reports
  WHERE earth_distance(ll_to_earth(lat, lng), ll_to_earth(user_lat, user_lng)) <= radius_km * 1000
    AND expires_at > now()
  ORDER BY created_at DESC
  LIMIT 50;
$$;

-- Push notification subscriptions
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth_key TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own subscriptions" ON public.push_subscriptions
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- SOS events additions
ALTER TABLE public.sos_events ADD COLUMN IF NOT EXISTS message TEXT;

-- Enable realtime on sos_events
ALTER PUBLICATION supabase_realtime ADD TABLE public.sos_events;

-- Chat channels
CREATE TABLE IF NOT EXISTS public.channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  type TEXT NOT NULL DEFAULT 'public',
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.channels ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read channels" ON public.channels FOR SELECT USING (true);
CREATE POLICY "Auth users can create channels" ON public.channels
  FOR INSERT WITH CHECK (auth.uid() = created_by);

-- Seed default channels
INSERT INTO public.channels (name, description) VALUES
  ('windhoek-drivers', 'General chat for Windhoek drivers'),
  ('swakopmund-drivers', 'Swakopmund & Coastal drivers'),
  ('traffic-board', 'Auto-updates from traffic reports')
ON CONFLICT (name) DO NOTHING;

-- Messages table
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID NOT NULL REFERENCES public.channels(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read messages" ON public.messages FOR SELECT USING (true);
CREATE POLICY "Auth users can send messages" ON public.messages
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS messages_channel ON public.messages (channel_id, created_at DESC);

-- Enable realtime on messages and channels
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.channels;

-- Voice rooms
CREATE TABLE IF NOT EXISTS public.voice_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  daily_room_url TEXT,
  created_by UUID NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.voice_rooms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read voice rooms" ON public.voice_rooms FOR SELECT USING (true);
CREATE POLICY "Auth users can create rooms" ON public.voice_rooms
  FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Creator can update room" ON public.voice_rooms
  FOR UPDATE USING (auth.uid() = created_by);
ALTER PUBLICATION supabase_realtime ADD TABLE public.voice_rooms;
