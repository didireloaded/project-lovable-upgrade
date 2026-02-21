import { useEffect, useRef } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import type { Report } from '@/hooks/useReports'
import type { DriverOnMap } from '@/hooks/usePresence'

mapboxgl.accessToken = 'pk.eyJ1IjoiZGlkaXJlbG9hZGVkZmlsbXMiLCJhIjoiY21oMXo4MnhtMHN0bnNzcXAzYndweGs0MyJ9.Q7conONwJpAL7oVetI77Jg'

const REPORT_ICONS: Record<string, string> = {
  police: '🚔', accident: '🚗', hazard: '⚠️', traffic: '🚦', pothole: '🕳️',
}

interface DriveMapProps {
  lat: number | null
  lng: number | null
  accuracy: number | null
  reports: Report[]
  drivers: DriverOnMap[]
  ghostMode: boolean
}

export function DriveMap({ lat, lng, accuracy, reports, drivers, ghostMode }: DriveMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<mapboxgl.Map>()
  const userMarkerRef = useRef<mapboxgl.Marker>()
  const reportMarkersRef = useRef<mapboxgl.Marker[]>([])
  const driverMarkersRef = useRef<mapboxgl.Marker[]>([])
  const initializedRef = useRef(false)

  // Init map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [lng ?? 17.0836, lat ?? -22.5609],
      zoom: 14,
      attributionControl: false,
    })

    map.addControl(new mapboxgl.AttributionControl({ compact: true }), 'bottom-right')
    mapRef.current = map

    return () => {
      map.remove()
      mapRef.current = undefined
      initializedRef.current = false
    }
  }, [])

  // Update user position
  useEffect(() => {
    const map = mapRef.current
    if (!map || lat == null || lng == null) return

    if (!userMarkerRef.current) {
      const el = document.createElement('div')
      el.className = 'drivelink-user-dot'
      el.innerHTML = `<div class="dot-inner"></div><div class="dot-ring"></div>`
      userMarkerRef.current = new mapboxgl.Marker({ element: el })
        .setLngLat([lng, lat])
        .addTo(map)
    } else {
      userMarkerRef.current.setLngLat([lng, lat])
    }

    if (!initializedRef.current) {
      map.flyTo({ center: [lng, lat], zoom: 15, duration: 1200 })
      initializedRef.current = true
    }
  }, [lat, lng])

  // Report pins
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    // Clear old
    reportMarkersRef.current.forEach((m) => m.remove())
    reportMarkersRef.current = []

    reports.forEach((r) => {
      const el = document.createElement('div')
      el.className = 'drivelink-report-pin'
      el.textContent = REPORT_ICONS[r.type] || '📍'
      el.title = `${r.type} — ${r.confirmed_by} confirmations`

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([r.lng, r.lat])
        .setPopup(
          new mapboxgl.Popup({ offset: 20, closeButton: false, maxWidth: '160px' })
            .setHTML(`<div style="font-size:12px;color:#fff"><strong>${r.type.toUpperCase()}</strong><br/>${r.confirmed_by} confirms<br/><span style="opacity:0.6">${new Date(r.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span></div>`)
        )
        .addTo(map)

      reportMarkersRef.current.push(marker)
    })
  }, [reports])

  // Driver avatars
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    driverMarkersRef.current.forEach((m) => m.remove())
    driverMarkersRef.current = []

    drivers.forEach((d) => {
      if (d.lat == null || d.lng == null) return
      const el = document.createElement('div')
      el.className = 'drivelink-driver-dot'
      el.textContent = '🚗'

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([d.lng, d.lat])
        .addTo(map)

      driverMarkersRef.current.push(marker)
    })
  }, [drivers])

  return (
    <div ref={containerRef} className="w-full h-full rounded-[14px] overflow-hidden" />
  )
}
