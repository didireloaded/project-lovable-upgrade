import { useEffect, useState } from 'react'
import { useGeolocation } from './useGeolocation'

export interface WeatherData {
  temp:        number   // °C
  feelsLike:   number
  description: string
  icon:        string
  humidity:    number   // %
  windSpeed:   number   // km/h
  windDir:     string
  visibility:  number   // km (estimated)
  uvIndex:     number
  isDay:       boolean
  hourly:      Array<{ time: string; icon: string; temp: number; rain: number }>
  drivingRisk: 'low' | 'moderate' | 'high'
  riskReasons: string[]
}

// WMO weather code → icon + label
const WMO: Record<number, { icon: string; label: string }> = {
  0:  { icon: '☀️',  label: 'Clear sky'      },
  1:  { icon: '🌤',  label: 'Mainly clear'   },
  2:  { icon: '⛅',  label: 'Partly cloudy'  },
  3:  { icon: '☁️',  label: 'Overcast'       },
  45: { icon: '🌫',  label: 'Foggy'          },
  48: { icon: '🌫',  label: 'Freezing fog'   },
  51: { icon: '🌦',  label: 'Light drizzle'  },
  53: { icon: '🌧',  label: 'Drizzle'        },
  55: { icon: '🌧',  label: 'Heavy drizzle'  },
  61: { icon: '🌧',  label: 'Light rain'     },
  63: { icon: '🌧',  label: 'Moderate rain'  },
  65: { icon: '🌧',  label: 'Heavy rain'     },
  71: { icon: '🌨',  label: 'Light snow'     },
  73: { icon: '❄️',  label: 'Moderate snow'  },
  80: { icon: '🌦',  label: 'Rain showers'   },
  81: { icon: '🌧',  label: 'Heavy showers'  },
  95: { icon: '⛈',  label: 'Thunderstorm'   },
  99: { icon: '⛈',  label: 'Severe storm'   },
}

function windDir(deg: number): string {
  const dirs = ['N','NE','E','SE','S','SW','W','NW']
  return dirs[Math.round(deg / 45) % 8]
}

function riskAssess(current: any): { risk: WeatherData['drivingRisk']; reasons: string[] } {
  const reasons: string[] = []
  let score = 0
  const code  = current.weather_code
  const wind  = current.wind_speed_10m
  const vis   = current.visibility ?? 10000

  if ([45, 48].includes(code))         { score += 3; reasons.push('Fog — severely reduced visibility') }
  if ([61, 63, 80, 81].includes(code)) { score += 2; reasons.push('Rain — wet and slippery roads')     }
  if ([65].includes(code))             { score += 3; reasons.push('Heavy rain — hazardous roads')      }
  if ([95, 99].includes(code))         { score += 4; reasons.push('Thunderstorm — extreme danger')     }
  if (wind > 70)                       { score += 2; reasons.push('Strong winds — high vehicles caution') }
  if (vis < 500)                       { score += 3; reasons.push('Very low visibility < 500m')        }
  else if (vis < 2000)                 { score += 1; reasons.push('Reduced visibility')                }

  if (!reasons.length) reasons.push('Good driving conditions — roads are clear')

  return {
    risk:    score >= 5 ? 'high' : score >= 2 ? 'moderate' : 'low',
    reasons,
  }
}

export function useWeather() {
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState<string | null>(null)
  const geo = useGeolocation()

  // Re-fetch when position moves significantly (~5km)
  const latKey = geo.lat ? Math.round(geo.lat * 20) : 0
  const lngKey = geo.lng ? Math.round(geo.lng * 20) : 0

  useEffect(() => {
    const lat = geo.lat ?? -22.5609   // Windhoek fallback
    const lng = geo.lng ?? 17.0836

    const url =
      `https://api.open-meteo.com/v1/forecast` +
      `?latitude=${lat}&longitude=${lng}` +
      `&current=temperature_2m,apparent_temperature,relative_humidity_2m,` +
      `wind_speed_10m,wind_direction_10m,weather_code,visibility,uv_index,is_day` +
      `&hourly=temperature_2m,precipitation_probability,weather_code` +
      `&forecast_days=1` +
      `&timezone=auto`

    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        const c    = data.current
        const code = c.weather_code as number
        const meta = WMO[code] ?? { icon: '🌡', label: 'Unknown' }
        const { risk, reasons } = riskAssess(c)

        // Build hourly (next 6 hours from now)
        const nowHour = new Date().getHours()
        const hourly  = data.hourly.time
          .slice(nowHour, nowHour + 6)
          .map((t: string, i: number) => ({
            time: new Date(t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            icon: (WMO[data.hourly.weather_code[nowHour + i]] ?? WMO[0]).icon,
            temp: Math.round(data.hourly.temperature_2m[nowHour + i]),
            rain: data.hourly.precipitation_probability?.[nowHour + i] ?? 0,
          }))

        setWeather({
          temp:        Math.round(c.temperature_2m),
          feelsLike:   Math.round(c.apparent_temperature),
          description: meta.label,
          icon:        meta.icon,
          humidity:    c.relative_humidity_2m,
          windSpeed:   Math.round(c.wind_speed_10m),
          windDir:     windDir(c.wind_direction_10m),
          visibility:  Math.round((c.visibility ?? 10000) / 1000),
          uvIndex:     Math.round(c.uv_index ?? 0),
          isDay:       c.is_day === 1,
          hourly,
          drivingRisk: risk,
          riskReasons: reasons,
        })
        setError(null)
      })
      .catch((err) => {
        console.error('Weather fetch failed:', err)
        setError('Could not load weather data')
      })
      .finally(() => setLoading(false))
  }, [latKey, lngKey]) // eslint-disable-line react-hooks/exhaustive-deps

  return { weather, loading, error }
}
