import { useRoadNews } from '@/hooks/useRoadNews'

const CATEGORY_STYLES: Record<string, { badge: string; label: string }> = {
  accident: { badge: 'bg-destructive/20 text-destructive', label: 'Accident' },
  traffic:  { badge: 'bg-warning/20 text-warning',         label: 'Traffic'  },
  weather:  { badge: 'bg-primary/20 text-primary',         label: 'Weather'  },
  road:     { badge: 'bg-purple/20 text-purple',           label: 'Roads'    },
  general:  { badge: 'bg-success/20 text-success',         label: 'News'     },
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.round(diff / 60000)
  if (m < 60)  return `${m}m ago`
  if (m < 1440) return `${Math.round(m / 60)}h ago`
  return `${Math.round(m / 1440)}d ago`
}

export function NewsView() {
  const { articles, loading, error } = useRoadNews()

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-10 pb-3 flex-shrink-0 bg-gradient-to-b from-background to-transparent">
        <h2 className="font-display text-[1.4rem] font-bold tracking-[0.08em] uppercase text-primary-foreground">
          Road News
        </h2>
        <p className="text-[0.72rem] text-muted-foreground mt-0.5">
          Live traffic & road updates from across Namibia
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-20 hide-scrollbar">
        {loading && (
          <div className="flex flex-col gap-2.5">
            {[1,2,3,4].map((i) => (
              <div key={i} className="h-20 rounded-[14px] bg-foreground/5 animate-pulse" />
            ))}
          </div>
        )}

        {error && !loading && articles.length === 0 && (
          <div className="text-center py-8">
            <div className="text-2xl mb-2">📡</div>
            <p className="text-muted-foreground text-xs">{error}</p>
          </div>
        )}

        {!loading && articles.map((article) => {
          const style = CATEGORY_STYLES[article.category] ?? CATEGORY_STYLES.general
          return (
            <a
              key={article.id}
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block p-3.5 bg-foreground/[0.04] border border-foreground/[0.07] rounded-[14px] mb-2.5 cursor-pointer hover:bg-foreground/[0.07] transition-colors no-underline"
            >
              <span className={`inline-block text-[0.55rem] px-2 py-0.5 rounded-full tracking-[0.08em] uppercase font-display font-semibold mb-1.5 ${style.badge}`}>
                {style.label}
              </span>
              <div className="text-[0.8rem] text-foreground leading-snug font-medium">
                {article.title}
              </div>
              {article.description && (
                <div className="text-[0.68rem] text-muted-foreground mt-1 line-clamp-2">
                  {article.description}
                </div>
              )}
              <div className="text-[0.62rem] text-muted-foreground mt-1.5 flex items-center gap-2">
                <span>{article.source}</span>
                <span>·</span>
                <span>{timeAgo(article.published)}</span>
              </div>
            </a>
          )
        })}

        {!loading && articles.length > 0 && (
          <p className="text-center text-[0.6rem] text-muted-foreground py-2">
            Updated every 15 minutes · Tap article to read full story
          </p>
        )}
      </div>
    </div>
  )
}
