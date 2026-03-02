import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  try {
    const apiKey = Deno.env.get('NEWSDATA_API_KEY')
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'NEWSDATA_API_KEY not configured', results: [] }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const url =
      `https://newsdata.io/api/1/news` +
      `?apikey=${apiKey}` +
      `&country=na` +
      `&language=en` +
      `&size=50`

    const res = await fetch(url)
    const data = await res.json()

    if (data.status !== 'success') {
      console.error('NewsData response:', JSON.stringify(data))
      throw new Error(data.results?.message ?? data.message ?? 'NewsData API error')
    }

    const articles = (data.results ?? [])
      .filter((a: any) => a.title && a.link)
      .map((a: any) => ({
        id: a.article_id ?? a.link,
        title: a.title,
        description: a.description ?? null,
        url: a.link,
        source: a.source_id ?? a.source_name ?? 'Unknown',
        published: a.pubDate ?? new Date().toISOString(),
      }))

    return new Response(JSON.stringify({ results: articles }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err: any) {
    console.error('fetch-news error:', err.message)
    return new Response(JSON.stringify({ error: err.message, results: [] }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
