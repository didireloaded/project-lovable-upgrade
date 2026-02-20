import { useEffect, useCallback } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useStore } from '@/store'
import { useAuth } from './useAuth'

export function useProfile() {
  const { user }          = useAuth()
  const setScore          = useStore((s) => s.setScore)
  const setRank           = useStore((s) => s.setRank)
  const setWeeklyReports  = useStore((s) => s.setWeeklyReports)
  const setReportsToday   = useStore((s) => s.setReportsToday)

  useEffect(() => {
    if (!user) return

    const load = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('score, rank, weekly_reports')
        .eq('user_id', user.id)
        .single()

      if (data) {
        setScore(data.score)
        setRank(data.rank as any)
        setWeeklyReports(data.weekly_reports)
      }

      // Load today's actual report count
      const today = new Date().toISOString().split('T')[0]
      const { count } = await supabase
        .from('reports')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('created_at', `${today}T00:00:00`)

      if (count != null) setReportsToday(count)
    }

    load()
  }, [user, setScore, setRank, setWeeklyReports, setReportsToday])

  // Call after every report submission
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
