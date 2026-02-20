import { useWeather } from '@/hooks/useWeather'
import { useStore } from '@/store'

const RISK_STYLES = {
  low:      { bg: 'bg-success/10 border-success/25',     text: 'text-success',     label: '✓ Good conditions'     },
  moderate: { bg: 'bg-warning/10 border-warning/25',     text: 'text-warning',     label: '⚠ Drive with caution'  },
  high:     { bg: 'bg-destructive/10 border-destructive/25', text: 'text-destructive', label: '🔴 High risk — reduce speed' },
}

export function WeatherView() {
  const { weather, loading } = useWeather()
  const currentCity = useStore((s) => s.currentCity)

  if (loading) return (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-10 pb-3 flex-shrink-0">
        <h2 className="font-display text-[1.4rem] font-bold tracking-[0.08em] uppercase text-primary-foreground">Weather</h2>
      </div>
      <div className="flex-1 flex items-center justify-center">
        <div className="w-7 h-7 border-2 border-secondary border-t-transparent rounded-full animate-spin" />
      </div>
    </div>
  )

  if (!weather) return (
    <div className="flex flex-col h-full items-center justify-center">
      <div className="text-2xl mb-2">📡</div>
      <p className="text-muted-foreground text-xs">Weather unavailable</p>
    </div>
  )

  const risk = RISK_STYLES[weather.drivingRisk]

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-10 pb-3 flex-shrink-0 bg-gradient-to-b from-background to-transparent">
        <h2 className="font-display text-[1.4rem] font-bold tracking-[0.08em] uppercase text-primary-foreground">Weather</h2>
        <p className="text-[0.72rem] text-muted-foreground mt-0.5">Real-time driving conditions</p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-20 hide-scrollbar">
        {/* Hero card */}
        <div className="bg-gradient-to-br from-[hsl(216_50%_18%)] to-[hsl(216_60%_10%)] rounded-[18px] p-5 text-center mb-3.5 border border-foreground/[0.08] relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(circle at 30% 60%, hsl(219 90% 59% / 0.2), transparent 60%)' }} />
          <div className="text-[3.5rem] block">{weather.icon}</div>
          <div className="font-display text-5xl font-bold text-primary-foreground leading-none">{weather.temp}°C</div>
          <div className="text-[0.78rem] text-muted-foreground mt-1">{weather.description}</div>
          <div className="text-[0.7rem] text-secondary mt-1">
            Feels like {weather.feelsLike}°C · 📍 {currentCity ?? 'Namibia'}
          </div>
          <div className="grid grid-cols-4 gap-2 mt-4">
            {[
              { val: `${weather.humidity}%`,       label: 'Humidity'    },
              { val: `${weather.windSpeed} km/h`,  label: `Wind ${weather.windDir}` },
              { val: `${weather.visibility}km`,    label: 'Visibility'  },
              { val: `UV ${weather.uvIndex}`,       label: 'UV Index'    },
            ].map((m, i) => (
              <div key={i} className="text-center">
                <div className="font-display text-sm font-semibold text-primary-foreground">{m.val}</div>
                <div className="text-[0.55rem] text-muted-foreground uppercase tracking-wider mt-0.5">{m.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Driving risk alert */}
        <div className={`border rounded-[14px] px-3.5 py-3 mb-3.5 ${risk.bg}`}>
          <div className={`font-display text-xs font-bold uppercase tracking-wider mb-1.5 ${risk.text}`}>
            {risk.label}
          </div>
          {weather.riskReasons.map((r, i) => (
            <div key={i} className={`text-[0.7rem] leading-relaxed ${risk.text}`}>{r}</div>
          ))}
        </div>

        {/* Hourly forecast */}
        <div className="glass-card mb-3.5">
          <div className="card-label">Next 6 Hours</div>
          <div className="flex gap-3 overflow-x-auto pb-1 hide-scrollbar">
            {weather.hourly.map((h, i) => (
              <div key={i} className="text-center min-w-[52px] flex flex-col items-center">
                <div className="text-[0.62rem] text-muted-foreground">{h.time}</div>
                <div className="text-lg my-1">{h.icon}</div>
                <div className="font-display text-sm font-semibold text-primary-foreground">{h.temp}°</div>
                {h.rain > 0 && (
                  <div className="text-[0.55rem] text-primary mt-0.5">{h.rain}%💧</div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Road conditions */}
        <div className="glass-card">
          <div className="card-label">Road Conditions</div>
          <div className="flex flex-col gap-2.5">
            {[
              {
                label: 'Road surface',
                status: weather.drivingRisk === 'high' ? 'Slippery ⚠'
                  : weather.drivingRisk === 'moderate' ? 'Damp — caution'
                  : 'Dry ✓',
                color: weather.drivingRisk === 'high' ? 'text-destructive'
                  : weather.drivingRisk === 'moderate' ? 'text-warning'
                  : 'text-success',
              },
              {
                label: 'Visibility',
                status: weather.visibility < 1 ? 'Poor ⚠'
                  : weather.visibility < 5 ? 'Reduced ⚠'
                  : 'Clear ✓',
                color: weather.visibility < 1 ? 'text-destructive'
                  : weather.visibility < 5 ? 'text-warning'
                  : 'text-success',
              },
              {
                label: 'Wind',
                status: weather.windSpeed > 60 ? 'Strong ⚠'
                  : weather.windSpeed > 30 ? 'Moderate ⚠'
                  : 'Light ✓',
                color: weather.windSpeed > 60 ? 'text-destructive'
                  : weather.windSpeed > 30 ? 'text-warning'
                  : 'text-success',
              },
            ].map((item, i) => (
              <div key={i} className="flex justify-between items-center text-[0.72rem]">
                <span className="text-muted-foreground">{item.label}</span>
                <span className={item.color}>{item.status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
