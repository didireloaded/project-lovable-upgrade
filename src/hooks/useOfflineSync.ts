import { useEffect, useCallback, useState } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useStore } from '@/store'
import { getPendingReports, removePendingReport, pendingCount } from '@/lib/offlineQueue'

/**
 * Watches for online status and syncs any queued offline reports.
 */
export function useOfflineSync() {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [pending, setPending] = useState(0)
  const showNotification = useStore((s) => s.showNotification)
  const addReport = useStore((s) => s.addReport)

  // Track online/offline
  useEffect(() => {
    const goOnline = () => setIsOnline(true)
    const goOffline = () => setIsOnline(false)
    window.addEventListener('online', goOnline)
    window.addEventListener('offline', goOffline)
    return () => {
      window.removeEventListener('online', goOnline)
      window.removeEventListener('offline', goOffline)
    }
  }, [])

  // Update pending count
  const refreshPending = useCallback(async () => {
    const c = await pendingCount()
    setPending(c)
  }, [])

  useEffect(() => { refreshPending() }, [refreshPending])

  // Sync when coming back online
  const syncQueue = useCallback(async () => {
    const reports = await getPendingReports()
    if (reports.length === 0) return

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    let synced = 0
    for (const report of reports) {
      const { error } = await supabase.from('reports').insert({
        type: report.type,
        lat: report.lat,
        lng: report.lng,
        description: report.description,
        user_id: user.id,
      })

      if (!error) {
        await removePendingReport(report.id!)
        addReport(report.type as any)
        synced++
      }
    }

    if (synced > 0) {
      showNotification(`📶 Synced ${synced} offline report${synced > 1 ? 's' : ''}!`, 'success')
    }
    await refreshPending()
  }, [showNotification, addReport, refreshPending])

  // Auto-sync when coming online
  useEffect(() => {
    if (isOnline) {
      syncQueue()
    }
  }, [isOnline, syncQueue])

  return { isOnline, pending, syncQueue, refreshPending }
}
