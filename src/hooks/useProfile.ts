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
        .select('score, rank, weekly_reports')
        .eq('user_id', user.id)
        .single()

      if (data) {
        useStore.getState().setScore(data.score)
        useStore.getState().setRank(data.rank as any)
        useStore.getState().setWeeklyReports(data.weekly_reports)
      }

      const today = new Date().toISOString().split('T')[0]
      const { count } = await supabase
        .from('reports')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('created_at', `${today}T00:00:00`)

      if (count != null) useStore.getState().setReportsToday(count)
    }

    load()
  }, [user])

  const syncScore = useCallback(async () => {
    if (!user) return
    const { score, rank, weeklyReports } = useStore.getState()
    await supabase
      .from('profiles')
      .update({ score, rank, weekly_reports: weeklyReports })
      .eq('user_id', user.id)
  }, [user])

  return { syncScore }
}
