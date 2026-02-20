const CACHE = new Map<string, number>()

export async function getSpeedLimit(lat: number, lng: number): Promise<number> {
  const key = `${(lat * 500 | 0)},${(lng * 500 | 0)}`
  if (CACHE.has(key)) return CACHE.get(key)!

  try {
    const query = `
      [out:json][timeout:5];
      way(around:30,${lat},${lng})[highway][maxspeed];
      out tags 1;
    `
    const res  = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      body:   `data=${encodeURIComponent(query)}`,
    })
    const data = await res.json()
    const raw  = data.elements?.[0]?.tags?.maxspeed as string | undefined

    if (!raw) { CACHE.set(key, 60); return 60 }

    const num = parseInt(raw)
    const kmh = raw.toLowerCase().includes('mph') ? Math.round(num * 1.609) : num
    CACHE.set(key, kmh)
    return kmh
  } catch {
    return 60
  }
}
