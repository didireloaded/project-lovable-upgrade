import { useWeather } from '@/hooks/useWeather'
import { useStore } from '@/store'
import { motion } from 'framer-motion'

const RISK_STYLES = {
  low:      { bg: 'bg-success/10 border-success/25', text: 'text-success', label: '✓ Good conditions' },
  moderate: { bg: 'bg-warning/10 border-warning/25', text: 'text-warning', label: '⚠ Drive with caution' },
  high:     { bg: 'bg-destructive/10 border-destructive/25', text: 'text-destructive', label: '🔴 High risk' },
}

export function WeatherView() {
  const { weather, loading } = useWeather()
  const currentCity = useStore((s) => s.currentCity)

  if (loading) return (
    <div className="flex flex-col h-full items-center justify-center">
      <div className="w-8 h-8 border-2 border-secondary border-t-transparent rounded-full animate-spin" />
      <p className="text-muted-foreground text-xs mt-3">Getting weather data…</p>
    </div>
  )

  if (!weather) return (
    <div className="flex flex-col h-full items-center justify-center">
      <div className="text-4xl mb-3">📡</div>
      <p className="text-muted-foreground text-sm">Weather unavailable</p>
    </div>
  )

  const risk = RISK_STYLES[weather.drivingRisk]

  // Circular gauge - temp percentage (0-50°C range)
  const tempPct = Math.min(Math.max(weather.temp / 50, 0), 1)
  const circumference = 2 * Math.PI * 70
  const dashOffset = circumference * (1 - tempPct * 0.75)

  return (
    <div className="flex flex-col h-full">
      {/* Hero section with gradient */}
      <div className="flex-shrink-0 relative overflow-hidden px-5 pt-6 pb-8">
        <div className="absolute inset-0 bg-gradient-to-br from-[hsl(260_60%_30%)] via-[hsl(30_60%_25%)] to-[hsl(35_70%_20%)] opacity-60" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background" />

        <div className="relative z-10 max-w-2xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            {/* Left: icon + temp */}
            <div className="flex items-center gap-5">
              <div className="text-[4rem] drop-shadow-2xl">{weather.icon}</div>
              <div>
                <div className="font-display text-5xl font-bold text-primary-foreground leading-none">{weather.temp}°C</div>
                <div className="text-sm text-foreground/70 mt-1 capitalize">{weather.description}</div>
                <div className="text-[0.72rem] text-secondary mt-0.5">
                  Feels like {weather.feelsLike}°C · 📍 {currentCity ?? 'Namibia'}
                </div>
              </div>
            </div>

            {/* Right: circular gauge on desktop */}
            <div className="hidden md:flex flex-col items-center">
              <svg width="160" height="160" viewBox="0 0 160 160">
                <circle cx="80" cy="80" r="70" fill="none" stroke="hsl(var(--foreground) / 0.06)" strokeWidth="8"
                  strokeDasharray={circumference} strokeDashoffset={circumference * 0.25}
                  transform="rotate(135 80 80)" strokeLinecap="round" />
                <motion.circle cx="80" cy="80" r="70" fill="none" stroke="hsl(var(--secondary))" strokeWidth="8"
                  strokeDasharray={circumference} initial={{ strokeDashoffset: circumference }}
                  animate={{ strokeDashoffset: dashOffset }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                  transform="rotate(135 80 80)" strokeLinecap="round" />
                <text x="80" y="72" textAnchor="middle" className="fill-primary-foreground font-display text-2xl font-bold">{weather.temp}°C</text>
                <text x="80" y="92" textAnchor="middle" className="fill-muted-foreground text-[0.55rem]">💨 {weather.windSpeed} km/h</text>
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 md:px-6 lg:px-8 pb-20 md:pb-6 -mt-3 hide-scrollbar">
        <div className="max-w-2xl mx-auto space-y-3.5">
          {/* Quick metrics */}
          <div className="grid grid-cols-4 gap-2">
            {[
              { val: `${weather.humidity}%`, label: 'Humidity', icon: '💧' },
              { val: `${weather.windSpeed}`, label: `Wind ${weather.windDir}`, icon: '💨' },
              { val: `${weather.visibility}km`, label: 'Visibility', icon: '👁' },
              { val: `UV ${weather.uvIndex}`, label: 'UV Index', icon: '☀️' },
            ].map((m, i) => (
              <div key={i} className="glass-card text-center !p-3">
                <div className="text-lg mb-1">{m.icon}</div>
                <div className="font-display text-sm font-bold text-primary-foreground">{m.val}</div>
                <div className="text-[0.5rem] text-muted-foreground uppercase tracking-wider mt-0.5">{m.label}</div>
              </div>
            ))}
          </div>

          {/* Driving risk */}
          <div className={`border rounded-2xl px-4 py-3.5 ${risk.bg}`}>
            <div className={`font-display text-xs font-bold uppercase tracking-wider mb-1.5 ${risk.text}`}>
              {risk.label}
            </div>
            {weather.riskReasons.map((r, i) => (
              <div key={i} className={`text-[0.72rem] leading-relaxed ${risk.text}`}>{r}</div>
            ))}
          </div>

          {/* Road conditions */}
          <div className="glass-card">
            <div className="card-label">Road Conditions</div>
            <div className="flex flex-col gap-3">
              {[
                {
                  label: 'Road Surface',
                  status: weather.drivingRisk === 'high' ? 'Slippery ⚠' : weather.drivingRisk === 'moderate' ? 'Damp' : 'Dry ✓',
                  color: weather.drivingRisk === 'high' ? 'text-destructive' : weather.drivingRisk === 'moderate' ? 'text-warning' : 'text-success',
                },
                {
                  label: 'Visibility',
                  status: weather.visibility < 1 ? 'Poor ⚠' : weather.visibility < 5 ? 'Reduced' : 'Clear ✓',
                  color: weather.visibility < 1 ? 'text-destructive' : weather.visibility < 5 ? 'text-warning' : 'text-success',
                },
                {
                  label: 'Wind',
                  status: weather.windSpeed > 60 ? 'Strong ⚠' : weather.windSpeed > 30 ? 'Moderate' : 'Light ✓',
                  color: weather.windSpeed > 60 ? 'text-destructive' : weather.windSpeed > 30 ? 'text-warning' : 'text-success',
                },
              ].map((item, i) => (
                <div key={i} className="flex justify-between items-center">
                  <span className="text-[0.78rem] text-muted-foreground">{item.label}</span>
                  <span className={`text-[0.78rem] font-medium ${item.color}`}>{item.status}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Hourly forecast */}
          <div className="glass-card">
            <div className="card-label">Forecast</div>
            <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
              {weather.hourly.map((h, i) => (
                <div key={i} className={`flex-shrink-0 text-center px-3 py-2.5 rounded-2xl min-w-[56px] ${
                  i === 0 ? 'bg-primary/15 border border-primary/25' : 'bg-foreground/[0.04]'
                }`}>
                  <div className="text-[0.6rem] text-muted-foreground">{h.time}</div>
                  <div className="text-xl my-1.5">{h.icon}</div>
                  <div className="font-display text-sm font-bold text-primary-foreground">{h.temp}°</div>
                  {h.rain > 0 && (
                    <div className="text-[0.5rem] text-primary mt-0.5">{h.rain}%💧</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
