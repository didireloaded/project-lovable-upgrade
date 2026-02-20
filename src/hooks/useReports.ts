import { useEffect, useState, useCallback, useRef } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useStore } from '@/store'
import { useGeolocation } from './useGeolocation'

export interface Report {
  id: string
  user_id: string
  type: 'police' | 'accident' | 'hazard' | 'traffic' | 'pothole'
  lat: number
  lng: number
  description: string | null
  photo_url: string | null
  confirmed_by: number
  created_at: string
  expires_at: string
}

export function useReports(radiusKm = 10) {
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const addReport = useStore((s) => s.addReport)
  const showNotification = useStore((s) => s.showNotification)
  const geo = useGeolocation()
  const prevLatRef = useRef<number>()

  const fetchReports = useCallback(async () => {
    if (geo.lat != null && geo.lng != null) {
      // Use proximity function when GPS available
      const { data, error } = await supabase.rpc('reports_within_radius', {
        user_lat:  geo.lat,
        user_lng:  geo.lng,
        radius_km: radiusKm,
      })
      if (!error && data) setReports(data as Report[])
    } else {
      // Fall back to global fetch
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .gte('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(50)
      if (!error && data) setReports(data as Report[])
    }
    setLoading(false)
  }, [geo.lat, geo.lng, radiusKm])

  // Re-fetch when position changes significantly (~500m)
  useEffect(() => {
    if (geo.lat == null) return
    const prev = prevLatRef.current
    if (prev == null || Math.abs(geo.lat - prev) > 0.005) {
      prevLatRef.current = geo.lat
      fetchReports()
    }
  }, [geo.lat, fetchReports])

  useEffect(() => {
    fetchReports()

    const channel = supabase
      .channel('reports-feed')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'reports' },
        (payload) => {
          const report = payload.new as Report
          setReports((prev) => [report, ...prev])
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [fetchReports])

  const submitReport = useCallback(
    async (type: Report['type'], lat?: number, lng?: number, description?: string) => {
      if (lat == null || lng == null) {
        // Fallback to Windhoek default if no GPS
        lat = -22.5609 + (Math.random() - 0.5) * 0.01
        lng = 17.0836 + (Math.random() - 0.5) * 0.01
      }

      const { error } = await supabase.from('reports').insert({
        type,
        lat,
        lng,
        description: description ?? null,
      } as any)

      if (error) {
        showNotification('Failed to submit report', 'error')
        return false
      }

      addReport(type)

      // Auto-post to traffic-board channel
      try {
        const { data: channel } = await supabase
          .from('channels')
          .select('id')
          .eq('name', 'traffic-board')
          .single()

        if (channel) {
          const icons: Record<string, string> = {
            police: '🚔', accident: '🚗', hazard: '⚠️', traffic: '🚦', pothole: '🕳️',
          }
          const { data: { user } } = await supabase.auth.getUser()
          if (user) {
            await supabase.from('messages').insert({
              channel_id: channel.id,
              user_id:    user.id,
              content:    `${icons[type] ?? '📍'} ${type.toUpperCase()} reported nearby — ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
            } as any)
          }
        }
      } catch {} // Don't block on traffic-board post

      return true
    },
    [addReport, showNotification]
  )

  return { reports, loading, submitReport, refetch: fetchReports }
}
