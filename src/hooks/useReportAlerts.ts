import { useEffect, useState } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from './useAuth'

export interface ReportAlert {
  id: string
  type: string
  created_at: string
  user_id: string
  display_name: string | null
  avatar_url: string | null
}

const REPORT_LABELS: Record<string, string> = {
  police: '🚔 Police spotted nearby',
  accident: '🚗 Accident reported ahead',
  hazard: '⚠️ Road hazard ahead',
  traffic: '🚦 Traffic jam reported',
  pothole: '🕳️ Pothole reported',
}

export function useReportAlerts() {
  const { user } = useAuth()
  const [alert, setAlert] = useState<ReportAlert | null>(null)

  useEffect(() => {
    if (!user) return

    const channel = supabase
      .channel('report-alerts')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'reports' },
        async (payload) => {
          const row = payload.new as any
          // Don't show own reports
          if (row.user_id === user.id) return

          // Fetch reporter profile
          const { data: profile } = await supabase
            .from('profiles')
            .select('display_name, avatar_url')
            .eq('user_id', row.user_id)
            .single()

          const newAlert: ReportAlert = {
            id: row.id,
            type: row.type,
            created_at: row.created_at,
            user_id: row.user_id,
            display_name: profile?.display_name ?? 'Driver',
            avatar_url: profile?.avatar_url ?? null,
          }

          setAlert(newAlert)

          // Auto-dismiss after 6 seconds
          setTimeout(() => {
            setAlert((prev) => (prev?.id === newAlert.id ? null : prev))
          }, 6000)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user])

  const dismiss = () => setAlert(null)

  return { alert, dismiss, REPORT_LABELS }
}
