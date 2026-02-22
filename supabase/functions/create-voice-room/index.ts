import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  try {
    const { name } = await req.json()
    if (!name?.trim()) {
      return new Response(JSON.stringify({ error: 'Room name required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const DAILY_API_KEY = Deno.env.get('DAILY_API_KEY')
    if (!DAILY_API_KEY) {
      throw new Error('DAILY_API_KEY not configured')
    }

    // Sanitise slug
    const slug = name.trim()
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 35)
      + '-' + Date.now().toString(36)

    // Create room via Daily.co API
    const res = await fetch('https://api.daily.co/v1/rooms', {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${DAILY_API_KEY}`,
      },
      body: JSON.stringify({
        name: slug,
        properties: {
          exp:               Math.round(Date.now() / 1000) + 8 * 60 * 60,
          max_participants:  25,
          start_video_off:   true,
          start_audio_off:   false,
          enable_chat:       false,
          enable_knocking:   false,
          autojoin:          true,
          eject_at_room_exp: true,
        },
      }),
    })

    const room = await res.json()

    if (!res.ok) {
      throw new Error(room.info ?? room.error ?? `Daily.co error ${res.status}`)
    }

    const url = room.url ?? `https://drivelink.daily.co/${slug}`

    return new Response(JSON.stringify({ url, name: room.name ?? slug }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err: any) {
    console.error('create-voice-room:', err.message)
    return new Response(JSON.stringify({ error: err.message, url: null }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
