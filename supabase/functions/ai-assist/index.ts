import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

const SYSTEM_PROMPT = `You are DriveLink AI — a smart, concise driving assistant for Namibian drivers.

You know:
- Namibian Highway Code and NamPol traffic regulations
- Speed limits: B1 = 120 km/h (open road), 60 km/h (urban); B2 = 100 km/h; urban default = 60 km/h
- Namibian roads: B1 (Windhoek–Oshakati), B2 (Windhoek–Swakopmund), C-roads (gravel), D-roads (sand)
- Windhoek streets, roundabouts, common traffic hotspots
- Vehicle breakdowns, flat tyres, overheating, engine issues
- Road safety: gravel road driving, game crossing, dust storm protocol
- Emergency services: 10111 (police), 211111 (ambulance), *120 (roadside assist)
- Left-hand drive traffic (Namibia drives on the left)
- Fine amounts, licence demerit system, alcohol limit (0.05 g/100ml blood)

Rules:
- Answers must be SHORT — 2 to 4 sentences maximum. Drivers are on the move.
- Be direct, practical and specific
- For medical emergencies always say: call 10111 immediately
- Never give advice that could endanger the driver
- If you genuinely don't know a Namibia-specific answer, say so honestly

Current driver context will be provided.`

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { message, context } = await req.json()

    if (!message?.trim()) {
      return new Response(JSON.stringify({ error: 'No message provided' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY')
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY is not configured')

    const contextStr = context
      ? `[Driver: speed=${context.speed ?? 0} km/h, location=${context.location ?? 'Namibia'}]`
      : ''
    const fullMessage = contextStr ? `${contextStr}\n\nUser question: ${message}` : message

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: fullMessage },
        ],
        max_tokens: 350,
        temperature: 0.65,
      }),
    })

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded, please try again later.' }), {
          status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'AI credits exhausted. Please add funds.' }), {
          status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
      const t = await response.text()
      console.error('AI gateway error:', response.status, t)
      throw new Error('AI gateway error')
    }

    const data = await response.json()
    const reply = data.choices?.[0]?.message?.content

    return new Response(JSON.stringify({ reply: reply?.trim() ?? 'Sorry, I could not generate a response.' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err: any) {
    console.error('ai-assist error:', err)
    return new Response(JSON.stringify({ error: err.message ?? 'Unknown error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
