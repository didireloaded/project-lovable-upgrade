import { useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useStore } from '@/store'
import { useAuth } from './useAuth'

export function useProfile() {
  const { user } = useAuth()
  const setScore = useStore((s) => s.setScore)
  const setRank = useStore((s) => s.setRank)
  const setWeeklyReports = useStore((s) => s.setWeeklyReports)

  useEffect(() => {
    if (!user) return

    const fetchProfile = async () => {
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
    }

    fetchProfile()
  }, [user, setScore, setRank, setWeeklyReports])

  const syncScore = async (newScore: number, newRank: string) => {
    if (!user) return
    await supabase
      .from('profiles')
      .update({ score: newScore, rank: newRank })
      .eq('user_id', user.id)
  }

  return { syncScore }
}
