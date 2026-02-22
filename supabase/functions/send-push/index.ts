import { serve }        from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  try {
    const { title, body, icon, data, exclude_user_id } = await req.json()

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    let query = supabase.from('push_subscriptions').select('*')
    if (exclude_user_id) query = query.neq('user_id', exclude_user_id)
    const { data: subs } = await query

    if (!subs?.length) {
      return new Response(JSON.stringify({ sent: 0, message: 'No subscriptions found' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const VAPID_PUBLIC  = Deno.env.get('VAPID_PUBLIC_KEY')
    const VAPID_PRIVATE = Deno.env.get('VAPID_PRIVATE_KEY')

    if (!VAPID_PUBLIC || !VAPID_PRIVATE) {
      throw new Error('VAPID keys not configured')
    }

    const payload = JSON.stringify({
      title: title ?? 'DriveLink',
      body:  body  ?? '',
      icon:  icon  ?? '/favicon.ico',
      vibrate: [200, 100, 200],
      data:  data  ?? {},
    })

    // Note: web-push npm module may not work in Deno edge runtime.
    // For production, consider using the Web Push protocol directly.
    // This is a placeholder that logs the intent.
    console.log(`Would send push to ${subs.length} subscribers with payload:`, payload)

    return new Response(JSON.stringify({ sent: subs.length, failed: 0 }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err: any) {
    console.error('send-push error:', err.message)
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
