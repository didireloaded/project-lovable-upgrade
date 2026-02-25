import { useEffect, useCallback, useRef } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useStore } from '@/store'
import { useAuth } from './useAuth'

export function useProfile() {
  const { user } = useAuth()
  const loadedRef = useRef(false)

  useEffect(() => {
    if (!user || loadedRef.current) return
    loadedRef.current = true

    const load = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('score, rank, weekly_reports, reports_today, last_report_date')
        .eq('user_id', user.id)
        .single()

      if (data) {
        const d = data as any
        const store = useStore.getState()
        store.setScore(d.score)
        store.setRank(d.rank as any)
        store.setWeeklyReports(d.weekly_reports)

        const today = new Date().toISOString().slice(0, 10)
        if (d.last_report_date === today) {
          store.setReportsToday(d.reports_today ?? 0)
        } else {
          store.setReportsToday(0)
        }
      }
    }

    load()
  }, [user])

  useEffect(() => {
    if (!user) return

    const channel = supabase
      .channel(`profile:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const d = payload.new as any
          const store = useStore.getState()
          store.setScore(d.score)
          store.setRank(d.rank)
          store.setWeeklyReports(d.weekly_reports)

          const today = new Date().toISOString().slice(0, 10)
          if (d.last_report_date === today) {
            store.setReportsToday(d.reports_today ?? 0)
          }
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [user])

  const syncScore = useCallback(async (points: number, reportType: string) => {
    if (!user) return
    const { data, error } = await supabase.rpc('add_report_score' as any, {
      p_points: points,
      p_report_type: reportType,
    })
    if (!error && data) {
      const d = data as any
      const store = useStore.getState()
      store.setScore(d.score)
      store.setRank(d.rank)
      store.setReportsToday(d.reports_today)
    }
  }, [user])

  return { syncScore }
}
