const newsItems = [
  { badge: "Traffic", badgeColor: "bg-warning/20 text-warning", headline: "Major congestion on Sam Nujoma Drive — roadworks expected until end of month", source: "MTC Road Watch · 15 min ago" },
  { badge: "Safety", badgeColor: "bg-success/20 text-success", headline: "New speed cameras installed on B1 between Windhoek and Gobabis", source: "Namibian Traffic Dept. · 1h ago" },
  { badge: "Roads", badgeColor: "bg-purple/20 text-purple", headline: "Pothole repair project launches in Klein Windhoek — 47 priority spots marked", source: "City of Windhoek · 3h ago" },
  { badge: "Traffic", badgeColor: "bg-warning/20 text-warning", headline: "Independence Avenue roadblock lifted — traffic flowing normally again", source: "DriveLink Reporters · 4h ago" },
  { badge: "Safety", badgeColor: "bg-success/20 text-success", headline: "Night driving advisory: fog expected on C28 route from 20:00", source: "NamWeather · 5h ago" },
];

export function NewsView() {
  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-10 pb-3 flex-shrink-0 bg-gradient-to-b from-background to-transparent">
        <h2 className="font-display text-[1.4rem] font-bold tracking-[0.08em] uppercase text-primary-foreground">Road News</h2>
        <p className="text-[0.72rem] text-muted-foreground mt-0.5">Latest traffic & road updates</p>
      </div>
      <div className="flex-1 overflow-y-auto px-4 pb-20 hide-scrollbar">
        {newsItems.map((item, i) => (
          <div key={i} className="p-3 bg-foreground/[0.04] border border-foreground/[0.07] rounded-[14px] mb-2.5 cursor-pointer hover:bg-foreground/[0.07] transition-colors">
            <span className={`inline-block text-[0.55rem] px-2 py-0.5 rounded-full tracking-[0.08em] uppercase font-display font-semibold mb-1.5 ${item.badgeColor}`}>
              {item.badge}
            </span>
            <div className="text-[0.8rem] text-foreground leading-snug font-medium">{item.headline}</div>
            <div className="text-[0.62rem] text-muted-foreground mt-1.5">{item.source}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
