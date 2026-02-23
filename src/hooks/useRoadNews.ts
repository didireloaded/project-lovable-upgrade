import { useEffect, useState } from 'react'
import { supabase } from '@/integrations/supabase/client'

export interface NewsArticle {
  id:          string
  title:       string
  description: string | null
  url:         string
  source:      string
  published:   string
  category:    'accident' | 'traffic' | 'weather' | 'road' | 'general'
}

const CACHE_KEY  = 'dl-news-v1'
const CACHE_MINS = 15

function categorise(title: string): NewsArticle['category'] {
  const t = title.toLowerCase()
  if (/accident|crash|collision|fatal|injur/.test(t))      return 'accident'
  if (/traffic|congestion|jam|roadblock|delay/.test(t))    return 'traffic'
  if (/rain|flood|fog|storm|wind|drought/.test(t))          return 'weather'
  if (/road|highway|pothole|repair|b1|b2|gravel/.test(t))  return 'road'
  return 'general'
}

// Fallback static news when API is unavailable
const FALLBACK_NEWS: NewsArticle[] = [
  { id: '1', title: 'Major congestion on Sam Nujoma Drive — roadworks expected until end of month', description: 'Drivers should expect delays during peak hours as road resurfacing continues.', url: '#', source: 'MTC Road Watch', published: new Date(Date.now() - 15 * 60000).toISOString(), category: 'traffic' },
  { id: '2', title: 'New speed cameras installed on B1 between Windhoek and Gobabis', description: 'Traffic department has installed 12 new speed detection cameras along the B1 highway.', url: '#', source: 'Namibian Traffic Dept', published: new Date(Date.now() - 60 * 60000).toISOString(), category: 'road' },
  { id: '3', title: 'Pothole repair project launches in Klein Windhoek — 47 priority spots marked', description: null, url: '#', source: 'City of Windhoek', published: new Date(Date.now() - 3 * 3600000).toISOString(), category: 'road' },
  { id: '4', title: 'Night driving advisory: fog expected on C28 route from 20:00', description: 'NamWeather advises reducing speed and using fog lights.', url: '#', source: 'NamWeather', published: new Date(Date.now() - 5 * 3600000).toISOString(), category: 'weather' },
  { id: '5', title: 'Independence Avenue roadblock lifted — traffic flowing normally', description: null, url: '#', source: 'DriveLink Reporters', published: new Date(Date.now() - 4 * 3600000).toISOString(), category: 'traffic' },
]

export function useRoadNews() {
  const [articles, setArticles]   = useState<NewsArticle[]>([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState<string | null>(null)
  const [lastFetch, setLastFetch] = useState<number>(0)

  const load = async (force = false) => {
    // Return cached if fresh
    try {
      const cached = sessionStorage.getItem(CACHE_KEY)
      if (cached && !force) {
        const { data, ts } = JSON.parse(cached)
        if (Date.now() - ts < CACHE_MINS * 60 * 1000) {
          setArticles(data)
          setLoading(false)
          setLastFetch(ts)
          return
        }
      }
    } catch {}

    try {
      const { data, error: fnError } = await supabase.functions.invoke('fetch-news')

      if (fnError) throw new Error(fnError.message ?? 'Failed to fetch news')

      const results = data?.results ?? []

      if (results.length === 0 && data?.error) {
        // API key not configured — use fallback
        setArticles(FALLBACK_NEWS)
        setLoading(false)
        return
      }

      const parsed: NewsArticle[] = results.map((a: any) => ({
        ...a,
        category: categorise(a.title),
      }))

      const now = Date.now()
      setArticles(parsed)
      setLastFetch(now)
      setError(null)
      sessionStorage.setItem(CACHE_KEY, JSON.stringify({ data: parsed, ts: now }))
    } catch (e: any) {
      setError(e.message ?? 'Could not load news — check your connection')
      // Fall back to stale cache or fallback
      try {
        const cached = sessionStorage.getItem(CACHE_KEY)
        if (cached) setArticles(JSON.parse(cached).data)
        else setArticles(FALLBACK_NEWS)
      } catch {
        setArticles(FALLBACK_NEWS)
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    const timer = setInterval(() => load(true), CACHE_MINS * 60 * 1000)
    return () => clearInterval(timer)
  }, [])

  return { articles, loading, error, refresh: () => load(true), lastFetch }
}
