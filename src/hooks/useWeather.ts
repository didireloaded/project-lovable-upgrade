import { useEffect, useState } from 'react'
import { useGeolocation } from './useGeolocation'

export interface WeatherData {
  temp:         number
  feelsLike:    number
  description:  string
  icon:         string
  humidity:     number
  windSpeed:    number
  windDir:      string
  visibility:   number
  uvIndex:      number
  isDay:        boolean
  hourly: Array<{ time: string; icon: string; temp: number; rain: number }>
  drivingRisk:  'low' | 'moderate' | 'high'
  riskReasons:  string[]
}

const WMO: Record<number, { icon: string; label: string }> = {
  0:  { icon: '☀️',  label: 'Clear sky' },
  1:  { icon: '🌤',  label: 'Mainly clear' },
  2:  { icon: '⛅',  label: 'Partly cloudy' },
  3:  { icon: '☁️',  label: 'Overcast' },
  45: { icon: '🌫',  label: 'Fog' },
  48: { icon: '🌫',  label: 'Freezing fog' },
  51: { icon: '🌦',  label: 'Light drizzle' },
  53: { icon: '🌧',  label: 'Drizzle' },
  61: { icon: '🌧',  label: 'Light rain' },
  63: { icon: '🌧',  label: 'Moderate rain' },
  65: { icon: '🌧',  label: 'Heavy rain' },
  71: { icon: '🌨',  label: 'Light snow' },
  80: { icon: '🌦',  label: 'Rain showers' },
  95: { icon: '⛈',  label: 'Thunderstorm' },
}

function windDirection(deg: number): string {
  const dirs = ['N','NE','E','SE','S','SW','W','NW']
  return dirs[Math.round(deg / 45) % 8]
}

function assessDrivingRisk(data: any): { risk: WeatherData['drivingRisk']; reasons: string[] } {
  const reasons: string[] = []
  let score = 0
  const code = data.current.weather_code
  if ([61,63,65,80].includes(code)) { score += 2; reasons.push('Rain — slippery roads') }
  if ([45,48].includes(code))        { score += 3; reasons.push('Fog — reduced visibility') }
  if ([95].includes(code))           { score += 4; reasons.push('Thunderstorm — dangerous conditions') }
  if (data.current.wind_speed_10m > 60)  { score += 2; reasons.push('Strong winds') }
  if ((data.current.visibility ?? 10000) < 1000) { score += 3; reasons.push('Very low visibility') }

  return {
    risk:    score >= 4 ? 'high' : score >= 2 ? 'moderate' : 'low',
    reasons: reasons.length ? reasons : ['Good driving conditions'],
  }
}

export function useWeather() {
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [loading, setLoading] = useState(true)
  const geo = useGeolocation()

  useEffect(() => {
    const lat = geo.lat ?? -22.5609
    const lng = geo.lng ?? 17.0836

    const url = `https://api.open-meteo.com/v1/forecast?` +
      `latitude=${lat}&longitude=${lng}` +
      `&current=temperature_2m,apparent_temperature,relative_humidity_2m,` +
      `wind_speed_10m,wind_direction_10m,weather_code,visibility,uv_index,is_day` +
      `&hourly=temperature_2m,precipitation_probability,weather_code&forecast_days=1` +
      `&timezone=auto`

    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        const c    = data.current
        const code = c.weather_code as number
        const meta = WMO[code] ?? { icon: '🌡', label: 'Unknown' }
        const { risk, reasons } = assessDrivingRisk(data)

        const now = new Date().getHours()
        const hourly = data.hourly.time
          .slice(now, now + 6)
          .map((t: string, i: number) => ({
            time: new Date(t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            icon: (WMO[data.hourly.weather_code[now + i]] ?? WMO[0]).icon,
            temp: Math.round(data.hourly.temperature_2m[now + i]),
            rain: data.hourly.precipitation_probability?.[now + i] ?? 0,
          }))

        setWeather({
          temp:        Math.round(c.temperature_2m),
          feelsLike:   Math.round(c.apparent_temperature),
          description: meta.label,
          icon:        meta.icon,
          humidity:    c.relative_humidity_2m,
          windSpeed:   Math.round(c.wind_speed_10m),
          windDir:     windDirection(c.wind_direction_10m),
          visibility:  Math.round((c.visibility ?? 10000) / 1000),
          uvIndex:     c.uv_index ?? 0,
          isDay:       c.is_day === 1,
          hourly,
          drivingRisk: risk,
          riskReasons: reasons,
        })
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [
    geo.lat ? Math.round(geo.lat * 20) : 0,
    geo.lng ? Math.round(geo.lng * 20) : 0,
  ])

  return { weather, loading }
}
