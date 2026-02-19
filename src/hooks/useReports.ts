import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useStore } from '@/store'

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

export function useReports() {
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const addReport = useStore((s) => s.addReport)
  const showNotification = useStore((s) => s.showNotification)

  const fetchReports = useCallback(async () => {
    const { data, error } = await supabase
      .from('reports')
      .select('*')
      .gte('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(50)
    if (!error && data) {
      setReports(data as Report[])
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchReports()

    // Real-time subscription — new reports appear instantly
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
      // Use Windhoek defaults if no GPS
      const reportLat = lat ?? -22.5609 + (Math.random() - 0.5) * 0.01
      const reportLng = lng ?? 17.0836 + (Math.random() - 0.5) * 0.01

      const { error } = await supabase.from('reports').insert([{
        type,
        lat: reportLat,
        lng: reportLng,
        description,
      }] as any)

      if (error) {
        showNotification('Failed to submit report', 'error')
        return false
      }

      addReport(type)
      return true
    },
    [addReport, showNotification]
  )

  return { reports, loading, submitReport, refetch: fetchReports }
}
