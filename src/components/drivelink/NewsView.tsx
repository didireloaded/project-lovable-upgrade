import { useRoadNews } from '@/hooks/useRoadNews'

const CAT: Record<string, { label: string; style: string }> = {
  accident: { label: 'Accident', style: 'bg-destructive/20 text-destructive' },
  traffic:  { label: 'Traffic',  style: 'bg-warning/20 text-warning'         },
  road:     { label: 'Roads',    style: 'bg-purple/20 text-purple'            },
  weather:  { label: 'Weather',  style: 'bg-primary/20 text-primary'          },
  general:  { label: 'News',     style: 'bg-success/20 text-success'          },
}

function timeAgo(dateStr: string) {
  const m = Math.round((Date.now() - new Date(dateStr).getTime()) / 60000)
  if (m < 1)    return 'just now'
  if (m < 60)   return `${m}m ago`
  if (m < 1440) return `${Math.floor(m / 60)}h ago`
  return `${Math.floor(m / 1440)}d ago`
}

export function NewsView() {
  const { articles, loading, error, refresh, lastFetch } = useRoadNews()

  return (
    <div className="flex flex-col h-full">
      {/* Sub-header */}
      <div className="flex-shrink-0 px-4 pt-4 pb-3 border-b border-foreground/[0.08]">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-base font-bold uppercase tracking-[0.08em] text-primary-foreground">
              Road News
            </h2>
            <p className="text-[0.65rem] text-muted-foreground mt-0.5">
              Live Namibia traffic &amp; road updates
              {lastFetch > 0 && (
                <span className="ml-1.5 text-foreground/30">
                  · {timeAgo(new Date(lastFetch).toISOString())}
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={refresh}
              disabled={loading}
              className="text-[0.6rem] text-muted-foreground bg-foreground/5 border border-foreground/[0.08]
                         rounded-full px-2.5 py-1.5 cursor-pointer hover:bg-foreground/10 transition-colors
                         disabled:opacity-40 font-display uppercase tracking-wider"
            >
              {loading ? '…' : '↻'}
            </button>
            <div className="flex items-center gap-1.5 text-[0.62rem] text-success">
              <span className="w-1.5 h-1.5 rounded-full bg-success"
                    style={{ animation: 'pulse-dot 2s infinite' }} />
              <span className="font-display uppercase tracking-wider">Live</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pt-3 pb-4 hide-scrollbar space-y-3">

        {/* Loading skeletons */}
        {loading && articles.length === 0 && (
          <>
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="p-4 border border-foreground/[0.08] rounded-2xl space-y-2.5">
                <div className="h-3 w-16 bg-foreground/[0.06] rounded-full animate-pulse" />
                <div className="h-4 bg-foreground/[0.06] rounded animate-pulse" />
                <div className="h-4 w-3/4 bg-foreground/[0.06] rounded animate-pulse" />
                <div className="h-3 w-28 bg-foreground/[0.04] rounded animate-pulse" />
              </div>
            ))}
          </>
        )}

        {/* Error with no fallback */}
        {!loading && error && articles.length === 0 && (
          <div className="flex flex-col items-center justify-center h-40 text-center">
            <div className="text-3xl mb-3">📡</div>
            <p className="text-muted-foreground text-sm">{error}</p>
            <button
              onClick={refresh}
              className="mt-3 text-xs text-primary underline cursor-pointer bg-transparent border-none"
            >
              Try again
            </button>
          </div>
        )}

        {/* Error banner (has fallback articles) */}
        {error && articles.length > 0 && (
          <div className="text-[0.65rem] text-warning/80 bg-warning/10 border border-warning/20
                          rounded-xl px-3 py-2">
            ⚠️ Showing cached news · {error}
          </div>
        )}

        {/* Articles */}
        {articles.map((article) => {
          const cat = CAT[article.category] ?? CAT.general
          return (
            <a
              key={article.id}
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block p-4 border border-foreground/[0.08] rounded-2xl no-underline
                         hover:bg-foreground/[0.04] hover:border-foreground/20 transition-all
                         active:scale-[0.99]"
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <span className={`flex-shrink-0 text-[0.58rem] px-2.5 py-1 rounded-full
                                 font-display font-bold uppercase tracking-wider ${cat.style}`}>
                  {cat.label}
                </span>
                <span className="text-[0.6rem] text-muted-foreground flex-shrink-0 mt-0.5">
                  {timeAgo(article.published)}
                </span>
              </div>
              <div className="text-[0.88rem] text-foreground leading-snug font-medium mb-1.5">
                {article.title}
              </div>
              {article.description && (
                <div className="text-xs text-muted-foreground leading-snug line-clamp-2">
                  {article.description}
                </div>
              )}
              <div className="text-[0.6rem] text-foreground/30 mt-2 flex items-center gap-1.5">
                <span>{article.source}</span>
                <span>·</span>
                <span className="text-primary/50">Read full story →</span>
              </div>
            </a>
          )
        })}

        {!loading && articles.length > 0 && (
          <p className="text-center text-[0.6rem] text-muted-foreground py-2">
            Auto-refreshes every 15 minutes · Tap any article to read in browser
          </p>
        )}
      </div>
    </div>
  )
}
