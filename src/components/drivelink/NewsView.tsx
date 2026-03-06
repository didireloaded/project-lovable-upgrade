import { useState } from 'react'
import { useRoadNews, type NewsArticle } from '@/hooks/useRoadNews'
import { motion } from 'framer-motion'
import { Search, Bell, RefreshCw } from 'lucide-react'

const CATEGORIES: { key: NewsArticle['category'] | 'all'; label: string; style: string }[] = [
  { key: 'all',      label: 'All',      style: 'bg-foreground/10 text-foreground' },
  { key: 'accident', label: 'Accident',  style: 'bg-destructive/20 text-destructive' },
  { key: 'traffic',  label: 'Traffic',   style: 'bg-warning/20 text-warning' },
  { key: 'road',     label: 'Roads',     style: 'bg-purple/20 text-purple' },
  { key: 'weather',  label: 'Weather',   style: 'bg-primary/20 text-primary' },
  { key: 'general',  label: 'General',   style: 'bg-success/20 text-success' },
]

const CAT_STYLE: Record<string, { label: string; style: string }> = {
  accident: { label: 'Accident', style: 'bg-destructive/20 text-destructive' },
  traffic:  { label: 'Traffic',  style: 'bg-warning/20 text-warning' },
  road:     { label: 'Roads',    style: 'bg-purple/20 text-purple' },
  weather:  { label: 'Weather',  style: 'bg-primary/20 text-primary' },
  general:  { label: 'General',  style: 'bg-success/20 text-success' },
}

function timeAgo(dateStr: string) {
  const m = Math.round((Date.now() - new Date(dateStr).getTime()) / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  if (m < 1440) return `${Math.floor(m / 60)}h ago`
  return `${Math.floor(m / 1440)}d ago`
}

export function NewsView() {
  const { articles, loading, error, refresh, lastFetch } = useRoadNews()
  const [activeFilter, setActiveFilter] = useState<NewsArticle['category'] | 'all'>('all')

  const filtered = activeFilter === 'all' ? articles : articles.filter((a) => a.category === activeFilter)
  const heroArticle = filtered[0]
  const restArticles = filtered.slice(1)

  const counts: Record<string, number> = {}
  articles.forEach((a) => { counts[a.category] = (counts[a.category] || 0) + 1 })

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex-shrink-0 px-5 pt-6 pb-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-2xl font-bold text-foreground">Headlines</h2>
            <p className="text-[0.65rem] text-muted-foreground mt-0.5">{articles.length} articles · Namibia</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={refresh}
              disabled={loading}
              className="w-9 h-9 rounded-full bg-foreground/[0.06] border border-foreground/[0.08] flex items-center justify-center cursor-pointer hover:bg-foreground/10 transition-colors"
            >
              <RefreshCw size={14} className={`text-muted-foreground ${loading ? 'animate-spin' : ''}`} />
            </button>
            <div className="w-9 h-9 rounded-full bg-foreground/[0.06] border border-foreground/[0.08] flex items-center justify-center">
              <Bell size={14} className="text-muted-foreground" />
            </div>
          </div>
        </div>

        {/* Category pills */}
        <div className="flex gap-1.5 mt-4 overflow-x-auto hide-scrollbar">
          {CATEGORIES.map((cat) => {
            const isActive = activeFilter === cat.key
            const count = cat.key === 'all' ? articles.length : (counts[cat.key] || 0)
            return (
              <button
                key={cat.key}
                onClick={() => setActiveFilter(cat.key)}
                className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-[0.65rem] font-display font-semibold uppercase tracking-wider border transition-all cursor-pointer ${
                  isActive
                    ? `${cat.style} border-current/30`
                    : 'bg-foreground/[0.04] border-foreground/[0.08] text-muted-foreground hover:text-foreground'
                }`}
              >
                {cat.label} {count > 0 && <span className="ml-0.5 opacity-60">{count}</span>}
              </button>
            )
          })}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 md:px-6 lg:px-8 pt-2 pb-20 md:pb-6 hide-scrollbar">
        {/* Loading */}
        {loading && articles.length === 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-w-5xl">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="glass-card space-y-3">
                <div className="h-3 w-20 bg-foreground/[0.06] rounded-full animate-pulse" />
                <div className="h-4 bg-foreground/[0.06] rounded animate-pulse" />
                <div className="h-4 w-3/4 bg-foreground/[0.06] rounded animate-pulse" />
              </div>
            ))}
          </div>
        )}

        {/* Error */}
        {!loading && error && articles.length === 0 && (
          <div className="flex flex-col items-center justify-center h-40 text-center">
            <div className="text-4xl mb-3">📡</div>
            <p className="text-muted-foreground text-sm">{error}</p>
            <button onClick={refresh} className="mt-3 text-xs text-primary underline cursor-pointer bg-transparent border-none">Try again</button>
          </div>
        )}

        {error && articles.length > 0 && (
          <div className="text-[0.65rem] text-warning/80 bg-warning/10 border border-warning/20 rounded-xl px-3 py-2 mb-3 max-w-5xl">
            ⚠️ Showing cached · {error}
          </div>
        )}

        <div className="max-w-5xl space-y-3">
          {/* Hero article */}
          {heroArticle && (
            <a
              href={heroArticle.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block no-underline"
            >
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[hsl(220_50%_15%)] to-[hsl(220_60%_8%)] border border-foreground/[0.08] p-5 md:p-6"
              >
                <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-primary/10 to-transparent rounded-bl-full" />
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-[0.6rem] text-destructive font-display font-bold uppercase tracking-wider bg-destructive/15 px-2.5 py-1 rounded-full">
                      Breaking News Now
                    </span>
                    <span className="text-[0.6rem] text-muted-foreground">{timeAgo(heroArticle.published)}</span>
                  </div>
                  <div className="text-[0.62rem] text-muted-foreground uppercase tracking-wider mb-1 font-display">Your daily</div>
                  <h3 className="font-display text-xl md:text-2xl font-bold text-foreground leading-tight mb-2">
                    {heroArticle.title}
                  </h3>
                  {heroArticle.description && (
                    <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2 mb-3">{heroArticle.description}</p>
                  )}
                  <div className="text-[0.62rem] text-foreground/40">{heroArticle.source} · <span className="text-primary/60">Read full story →</span></div>
                </div>
              </motion.div>
            </a>
          )}

          {/* Categorized sections */}
          {activeFilter === 'all' && restArticles.length > 0 && (() => {
            const byCategory: Record<string, typeof articles> = {}
            restArticles.forEach((a) => {
              if (!byCategory[a.category]) byCategory[a.category] = []
              byCategory[a.category].push(a)
            })
            return Object.entries(byCategory).map(([cat, catArticles]) => {
              const catInfo = CAT_STYLE[cat] ?? CAT_STYLE.general
              return (
                <div key={cat}>
                  <div className="flex items-center justify-between mb-2 mt-4">
                    <h3 className="font-display text-sm font-bold uppercase tracking-wider text-foreground">{catInfo.label}</h3>
                    <span className="text-[0.6rem] text-muted-foreground">{catArticles.length} articles</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
                    {catArticles.slice(0, 6).map((article) => (
                      <ArticleCard key={article.id} article={article} />
                    ))}
                  </div>
                </div>
              )
            })
          })()}

          {/* Filtered view - grid */}
          {activeFilter !== 'all' && restArticles.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {restArticles.map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>
          )}

          {!loading && filtered.length === 0 && articles.length > 0 && (
            <p className="text-center text-sm text-muted-foreground py-8">No articles in this category</p>
          )}
        </div>
      </div>
    </div>
  )
}

function ArticleCard({ article }: { article: NewsArticle }) {
  const cat = CAT_STYLE[article.category] ?? CAT_STYLE.general
  return (
    <a
      href={article.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block glass-card no-underline hover:bg-foreground/[0.07] transition-all active:scale-[0.99]"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <span className={`text-[0.55rem] px-2 py-0.5 rounded-full font-display font-bold uppercase tracking-wider ${cat.style}`}>
          {cat.label}
        </span>
        <span className="text-[0.58rem] text-muted-foreground flex-shrink-0">{timeAgo(article.published)}</span>
      </div>
      <h4 className="text-[0.82rem] text-foreground leading-snug font-medium mb-1.5 line-clamp-2">{article.title}</h4>
      {article.description && (
        <p className="text-[0.7rem] text-muted-foreground leading-snug line-clamp-2 mb-2">{article.description}</p>
      )}
      <div className="text-[0.58rem] text-foreground/30 flex items-center gap-1.5">
        <span>{article.source}</span>
        <span>·</span>
        <span className="text-primary/50">Read →</span>
      </div>
    </a>
  )
}
