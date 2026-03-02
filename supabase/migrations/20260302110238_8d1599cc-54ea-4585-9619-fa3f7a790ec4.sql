
ALTER TABLE public.voice_rooms ADD CONSTRAINT voice_rooms_created_by_key UNIQUE (created_by);
