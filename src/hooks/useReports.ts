import { useEffect, useState, useCallback, useRef } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useStore } from '@/store'
import { useGeolocation } from './useGeolocation'
import { queueReport } from '@/lib/offlineQueue'

export interface Report {
  id:           string
  user_id:      string
  type:         'police' | 'accident' | 'hazard' | 'traffic' | 'pothole'
  lat:          number
  lng:          number
  description:  string | null
  photo_url:    string | null
  confirmed_by: number
  created_at:   string
  expires_at:   string
}

const COOLDOWN_MS = 30_000

export function useReports(radiusKm = 10) {
  const [reports, setReports]     = useState<Report[]>([])
  const [loading, setLoading]     = useState(true)
  const addReport                 = useStore((s) => s.addReport)
  const showNotification          = useStore((s) => s.showNotification)
  const geo                       = useGeolocation()
  const prevLatRef                = useRef<number>()
  const cooldownRef               = useRef<Map<string, number>>(new Map())

  const fetchReports = useCallback(async () => {
    if (geo.lat != null && geo.lng != null) {
      const { data, error } = await supabase.rpc('reports_within_radius', {
        user_lat:  geo.lat,
        user_lng:  geo.lng,
        radius_km: radiusKm,
      })
      if (!error && data) setReports(data as Report[])
    } else {
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
          setReports((prev) => {
            if (prev.some((r) => r.id === report.id)) return prev
            return [report, ...prev]
          })
        }
      )
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'reports' },
        (payload) => {
          const updated = payload.new as Report
          setReports((prev) =>
            prev.map((r) => r.id === updated.id ? { ...r, confirmed_by: updated.confirmed_by } : r)
          )
        }
      )
      .on('postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'reports' },
        (payload) => {
          const deleted = payload.old as { id: string }
          setReports((prev) => prev.filter((r) => r.id !== deleted.id))
        }
      )
      .subscribe()

    const pruneTimer = setInterval(() => {
      const now = new Date().toISOString()
      setReports((prev) => prev.filter((r) => r.expires_at > now))
    }, 5 * 60_000)

    return () => {
      supabase.removeChannel(channel)
      clearInterval(pruneTimer)
    }
  }, [fetchReports])

  const submitReport = useCallback(
    async (type: Report['type'], lat?: number, lng?: number, description?: string): Promise<boolean> => {
      const lastAt = cooldownRef.current.get(type) ?? 0
      if (Date.now() - lastAt < COOLDOWN_MS) {
        const remaining = Math.ceil((COOLDOWN_MS - (Date.now() - lastAt)) / 1000)
        showNotification(`⏳ Wait ${remaining}s before reporting ${type} again`, 'warning')
        return false
      }

      if (lat == null || lng == null) {
        lat = -22.5609 + (Math.random() - 0.5) * 0.01
        lng = 17.0836  + (Math.random() - 0.5) * 0.01
      }

      if (!navigator.onLine) {
        await queueReport({ type, lat, lng, description: description ?? null, queued_at: new Date().toISOString() })
        addReport(type)
        cooldownRef.current.set(type, Date.now())
        showNotification('📴 Saved offline — will sync when back online', 'warning')
        return true
      }

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        showNotification('You must be signed in to report', 'error')
        return false
      }

      const { error } = await supabase.from('reports').insert({
        type, lat, lng,
        description: description ?? null,
        user_id: user.id,
      })

      if (error) {
        showNotification('Failed to submit report', 'error')
        return false
      }

      cooldownRef.current.set(type, Date.now())
      addReport(type)

      try {
        const { data: ch } = await supabase
          .from('channels').select('id').eq('name', 'traffic-board').single()
        if (ch) {
          const icons: Record<string, string> = {
            police: '🚔', accident: '🚗', hazard: '⚠️', traffic: '🚦', pothole: '🕳️',
          }
          await supabase.from('messages').insert({
            channel_id: ch.id,
            user_id:    user.id,
            content:    `${icons[type] ?? '📍'} ${type.toUpperCase()} reported nearby — ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
          })
        }
      } catch { /* non-blocking */ }

      return true
    },
    [addReport, showNotification]
  )

  const confirmReport = useCallback(async (reportId: string): Promise<void> => {
    const { error } = await supabase.rpc('confirm_report' as any, { p_report_id: reportId })
    if (error) showNotification('Could not confirm report', 'error')
  }, [showNotification])

  return { reports, loading, submitReport, confirmReport, refetch: fetchReports }
}
