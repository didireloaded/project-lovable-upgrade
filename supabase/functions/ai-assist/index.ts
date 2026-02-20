import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const SYSTEM_PROMPT = `You are DriveLink AI — a helpful assistant built into a driving app for Namibian drivers. You help with:
- Namibian traffic laws and road rules (Highway Code)
- Vehicle breakdowns, flat tyres, engine issues
- Route suggestions and road conditions
- Safety advice for Namibian roads (B1, B2, C28, etc.)
- Emergency guidance

Keep answers SHORT (2-4 sentences max). Be practical and direct.
If you don't know something specific to Namibia, say so honestly.
Never give medical advice beyond "call emergency services".
Current context will be provided as part of the user message.`

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

    const contextStr = context ? `[Current conditions: Speed: ${context.speed ?? 0} km/h, Location: ${context.location ?? 'Namibia'}]` : ''
    const fullMessage = contextStr ? `${contextStr}\n\nUser question: ${message}` : message

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: fullMessage },
        ],
        max_tokens: 300,
        temperature: 0.7,
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

    return new Response(JSON.stringify({ reply: reply ?? 'Sorry, I could not generate a response.' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err: any) {
    console.error('ai-assist error:', err)
    return new Response(JSON.stringify({ error: err.message ?? 'Unknown error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
