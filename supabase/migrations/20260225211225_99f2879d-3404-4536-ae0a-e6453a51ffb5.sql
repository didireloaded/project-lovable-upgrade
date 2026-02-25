
-- Add reports_today and last_report_date to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS reports_today integer NOT NULL DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_report_date text;

-- Add heading to driver_presence
ALTER TABLE public.driver_presence ADD COLUMN IF NOT EXISTS heading integer;

-- confirm_report RPC: increments confirmed_by on a report
CREATE OR REPLACE FUNCTION public.confirm_report(p_report_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE reports
  SET confirmed_by = confirmed_by + 1
  WHERE id = p_report_id
    AND expires_at > now();
END;
$$;

-- add_report_score RPC: atomically bumps score, reports_today, weekly_reports
CREATE OR REPLACE FUNCTION public.add_report_score(p_points integer, p_report_type text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_today text := to_char(now(), 'YYYY-MM-DD');
  v_row profiles%ROWTYPE;
BEGIN
  UPDATE profiles
  SET
    score = score + p_points,
    weekly_reports = weekly_reports + 1,
    reports_today = CASE WHEN last_report_date = v_today THEN reports_today + 1 ELSE 1 END,
    last_report_date = v_today,
    rank = CASE
      WHEN score + p_points >= 500 THEN 'Platinum'
      WHEN score + p_points >= 200 THEN 'Gold'
      WHEN score + p_points >= 100 THEN 'Silver'
      ELSE 'Bronze'
    END,
    updated_at = now()
  WHERE user_id = v_user_id
  RETURNING * INTO v_row;

  RETURN json_build_object(
    'score', v_row.score,
    'rank', v_row.rank,
    'reports_today', v_row.reports_today,
    'weekly_reports', v_row.weekly_reports
  );
END;
$$;

-- nearby_drivers RPC: returns drivers within radius with profile data
CREATE OR REPLACE FUNCTION public.nearby_drivers(
  user_lat double precision,
  user_lng double precision,
  radius_km double precision DEFAULT 10
)
RETURNS TABLE(
  user_id uuid,
  lat double precision,
  lng double precision,
  speed integer,
  heading integer,
  last_seen timestamptz,
  display_name text,
  avatar_url text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    dp.user_id,
    dp.lat,
    dp.lng,
    dp.speed,
    dp.heading,
    dp.last_seen,
    p.display_name,
    p.avatar_url
  FROM driver_presence dp
  LEFT JOIN profiles p ON p.user_id = dp.user_id
  WHERE dp.user_id != auth.uid()
    AND dp.last_seen > now() - interval '30 seconds'
    AND earth_distance(ll_to_earth(dp.lat, dp.lng), ll_to_earth(user_lat, user_lng)) <= radius_km * 1000
  ORDER BY dp.last_seen DESC
  LIMIT 50;
$$;
