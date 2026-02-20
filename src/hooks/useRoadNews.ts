import { useEffect, useState } from 'react'

export interface NewsArticle {
  id:          string
  title:       string
  description: string | null
  url:         string
  source:      string
  published:   string
  category:    'accident' | 'traffic' | 'weather' | 'road' | 'general'
}

const CACHE_KEY  = 'drivelink-news-cache'
const CACHE_MINS = 15

function categorise(title: string): NewsArticle['category'] {
  const t = title.toLowerCase()
  if (/accident|crash|collision|fatal/.test(t))     return 'accident'
  if (/traffic|congestion|roadblock|jam/.test(t))   return 'traffic'
  if (/rain|flood|fog|wind|storm/.test(t))           return 'weather'
  if (/road|highway|pothole|repair|construction/.test(t)) return 'road'
  return 'general'
}

// Fallback static news when no API key is configured
const FALLBACK_NEWS: NewsArticle[] = [
  { id: '1', title: 'Major congestion on Sam Nujoma Drive — roadworks expected until end of month', description: 'Drivers should expect delays during peak hours as road resurfacing continues.', url: '#', source: 'MTC Road Watch', published: new Date(Date.now() - 15 * 60000).toISOString(), category: 'traffic' },
  { id: '2', title: 'New speed cameras installed on B1 between Windhoek and Gobabis', description: 'Traffic department has installed 12 new speed detection cameras along the B1 highway.', url: '#', source: 'Namibian Traffic Dept', published: new Date(Date.now() - 60 * 60000).toISOString(), category: 'road' },
  { id: '3', title: 'Pothole repair project launches in Klein Windhoek — 47 priority spots marked', description: null, url: '#', source: 'City of Windhoek', published: new Date(Date.now() - 3 * 3600000).toISOString(), category: 'road' },
  { id: '4', title: 'Night driving advisory: fog expected on C28 route from 20:00', description: 'NamWeather advises reducing speed and using fog lights.', url: '#', source: 'NamWeather', published: new Date(Date.now() - 5 * 3600000).toISOString(), category: 'weather' },
  { id: '5', title: 'Independence Avenue roadblock lifted — traffic flowing normally', description: null, url: '#', source: 'DriveLink Reporters', published: new Date(Date.now() - 4 * 3600000).toISOString(), category: 'traffic' },
]

export function useRoadNews() {
  const [articles, setArticles] = useState<NewsArticle[]>([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      // Check cache
      try {
        const cached = sessionStorage.getItem(CACHE_KEY)
        if (cached) {
          const { data, ts } = JSON.parse(cached)
          if (Date.now() - ts < CACHE_MINS * 60 * 1000) {
            setArticles(data)
            setLoading(false)
            return
          }
        }
      } catch {}

      const key = import.meta.env.VITE_NEWSDATA_API_KEY
      if (!key) {
        // Use fallback news
        setArticles(FALLBACK_NEWS)
        setLoading(false)
        return
      }

      try {
        const url = `https://newsdata.io/api/1/news?apikey=${key}` +
          `&q=namibia+road+OR+traffic+OR+accident&language=en&size=10`
        const res  = await fetch(url)
        const data = await res.json()

        if (data.status !== 'success') throw new Error(data.message)

        const parsed: NewsArticle[] = (data.results ?? []).map((a: any) => ({
          id:          a.article_id,
          title:       a.title,
          description: a.description,
          url:         a.link,
          source:      a.source_id,
          published:   a.pubDate,
          category:    categorise(a.title),
        }))

        setArticles(parsed)
        sessionStorage.setItem(CACHE_KEY, JSON.stringify({ data: parsed, ts: Date.now() }))
      } catch {
        setError('Could not load news.')
        setArticles(FALLBACK_NEWS)
      } finally {
        setLoading(false)
      }
    }

    load()
    const interval = setInterval(load, CACHE_MINS * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  return { articles, loading, error }
}
