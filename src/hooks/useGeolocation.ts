import { useEffect, useRef, useState, useCallback } from 'react'
import { useStore } from '@/store'

export interface GeoState {
  lat:      number | null
  lng:      number | null
  speed:    number | null
  heading:  number | null
  accuracy: number | null
  error:    string | null
  loading:  boolean
}

export function useGeolocation() {
  const [geo, setGeo] = useState<GeoState>({
    lat: null, lng: null, speed: null,
    heading: null, accuracy: null, error: null, loading: true,
  })
  const updateSpeed  = useStore((s) => s.updateSpeed)
  const setLocation  = useStore((s) => s.setLocation)
  const watchId      = useRef<number>()
  const lastReverseRef = useRef<{ lat: number; lng: number }>()

  const reverseGeocode = useCallback(async (lat: number, lng: number) => {
    const last = lastReverseRef.current
    if (last && Math.abs(last.lat - lat) < 0.001 && Math.abs(last.lng - lng) < 0.001) return
    lastReverseRef.current = { lat, lng }

    try {
      // Use free Nominatim for reverse geocoding (no API key needed)
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        { headers: { 'User-Agent': 'DriveLink/1.0' } }
      )
      const data = await res.json()
      const street = data.address?.road ?? data.address?.pedestrian ?? null
      const city = data.address?.city ?? data.address?.town ?? data.address?.village ?? null
      setLocation(street, city)
    } catch {
      // Silently fail
    }
  }, [setLocation])

  useEffect(() => {
    if (!navigator.geolocation) {
      setGeo((g) => ({ ...g, error: 'Geolocation not supported', loading: false }))
      return
    }

    watchId.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude, speed, heading, accuracy } = pos.coords
        const kmh = speed != null ? Math.round(speed * 3.6) : 0
        setGeo({ lat: latitude, lng: longitude, speed, heading, accuracy, error: null, loading: false })
        updateSpeed(kmh)
        reverseGeocode(latitude, longitude)
      },
      (err) => setGeo((g) => ({ ...g, error: err.message, loading: false })),
      { enableHighAccuracy: true, maximumAge: 1000, timeout: 8000 }
    )

    return () => {
      if (watchId.current != null) navigator.geolocation.clearWatch(watchId.current)
    }
  }, [updateSpeed, reverseGeocode])

  return geo
}
