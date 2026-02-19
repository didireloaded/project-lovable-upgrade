const forecast = [
  { time: "Now", icon: "⛅", temp: "24°" },
  { time: "15:00", icon: "🌤", temp: "23°" },
  { time: "17:00", icon: "🌧", temp: "20°", highlight: true },
  { time: "19:00", icon: "🌧", temp: "18°", highlight: true },
  { time: "21:00", icon: "🌙", temp: "16°" },
];

const conditions = [
  { label: "Road conditions", status: "Good ✓", color: "text-success" },
  { label: "Visibility", status: "Clear ✓", color: "text-success" },
  { label: "Rain risk after 17:00", status: "Moderate ⚠", color: "text-warning" },
  { label: "Night fog risk", status: "High ⚠", color: "text-destructive" },
];

export function WeatherView() {
  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-10 pb-3 flex-shrink-0 bg-gradient-to-b from-background to-transparent">
        <h2 className="font-display text-[1.4rem] font-bold tracking-[0.08em] uppercase text-primary-foreground">Weather</h2>
        <p className="text-[0.72rem] text-muted-foreground mt-0.5">Driving conditions at a glance</p>
      </div>
      <div className="flex-1 overflow-y-auto px-4 pb-20 hide-scrollbar">
        {/* Hero */}
        <div className="bg-gradient-to-br from-[hsl(216_50%_18%)] to-[hsl(216_60%_10%)] rounded-[18px] p-5 text-center mb-3.5 border border-foreground/[0.08] relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(circle at 30% 60%, hsl(219 90% 59% / 0.2), transparent 60%)" }} />
          <span className="text-[3.5rem] block">⛅</span>
          <div className="font-display text-5xl font-bold text-primary-foreground leading-none">24°C</div>
          <div className="text-[0.78rem] text-muted-foreground mt-1 capitalize">Partly Cloudy</div>
          <div className="text-[0.72rem] text-secondary mt-1.5">📍 Windhoek, Khomas Region</div>
          <div className="grid grid-cols-3 gap-2.5 mt-4">
            {[
              { val: "65%", label: "Humidity" },
              { val: "12 km/h", label: "Wind" },
              { val: "9km", label: "Visibility" },
            ].map((m, i) => (
              <div key={i} className="text-center">
                <div className="font-display text-base font-semibold text-primary-foreground">{m.val}</div>
                <div className="text-[0.58rem] text-muted-foreground uppercase tracking-wider">{m.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Alert */}
        <div className="bg-warning/[0.12] border border-warning/30 rounded-[14px] px-3.5 py-3 flex items-start gap-2.5 mb-3.5">
          <span className="text-lg">⚠️</span>
          <div className="text-[0.72rem] text-warning leading-relaxed">Light rain expected after 17:00. Road surfaces may be slippery — reduce speed on main routes.</div>
        </div>

        {/* Hourly */}
        <div className="glass-card">
          <div className="card-label">Hourly Forecast</div>
          <div className="flex gap-2.5 overflow-x-auto pb-1 hide-scrollbar">
            {forecast.map((h, i) => (
              <div key={i} className="text-center min-w-[48px]">
                <div className="text-[0.62rem] text-muted-foreground">{h.time}</div>
                <div className="text-lg my-1">{h.icon}</div>
                <div className={`font-display text-sm ${h.highlight ? "text-primary" : "text-primary-foreground"}`}>{h.temp}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Driving Impact */}
        <div className="glass-card mt-3.5">
          <div className="card-label">Driving Impact</div>
          <div className="flex flex-col gap-2">
            {conditions.map((c, i) => (
              <div key={i} className="flex justify-between items-center text-[0.72rem]">
                <span className="text-muted-foreground">{c.label}</span>
                <span className={c.color}>{c.status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
