import { useEffect, useRef, useState } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useStore } from '@/store'
import { useAuth } from './useAuth'
import { useGeolocation } from './useGeolocation'

export interface DriverOnMap {
  user_id:      string
  lat:          number
  lng:          number
  speed:        number | null
  avatar_url:   string | null
  display_name: string | null
  last_seen:    string
}

export function usePresence() {
  const { user }         = useAuth()
  const geo              = useGeolocation()
  const setNearbyDrivers = useStore((s) => s.setNearbyDrivers)
  const ghostMode        = useStore((s) => s.ghostMode)
  const intervalRef      = useRef<ReturnType<typeof setInterval>>()

  // Broadcast own position (unless ghost mode)
  useEffect(() => {
    if (!user || !geo.lat || !geo.lng) return

    const upsert = async () => {
      if (ghostMode) {
        await supabase.from('driver_presence').delete().eq('user_id', user.id)
        return
      }
      await supabase.from('driver_presence').upsert({
        user_id:   user.id,
        lat:       geo.lat!,
        lng:       geo.lng!,
        speed:     geo.speed != null ? Math.round(geo.speed * 3.6) : 0,
        last_seen: new Date().toISOString(),
      })
    }

    upsert()
    intervalRef.current = setInterval(upsert, 10_000)

    return () => {
      clearInterval(intervalRef.current)
      if (!ghostMode) {
        supabase.from('driver_presence').delete().eq('user_id', user.id)
      }
    }
  }, [user, geo.lat, geo.lng, geo.speed, ghostMode])

  // Count nearby drivers
  useEffect(() => {
    if (!user) return

    const channel = supabase
      .channel('driver-presence-count')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'driver_presence' },
        async () => {
          const cutoff = new Date(Date.now() - 30_000).toISOString()
          const { count } = await supabase
            .from('driver_presence')
            .select('user_id', { count: 'exact', head: true })
            .neq('user_id', user.id)
            .gte('last_seen', cutoff)
          setNearbyDrivers(count ?? 0)
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [user, setNearbyDrivers])
}

export function useDriversOnMap(): DriverOnMap[] {
  const [drivers, setDrivers] = useState<DriverOnMap[]>([])
  const { user } = useAuth()

  useEffect(() => {
    if (!user) return

    const fetchDrivers = async () => {
      const cutoff = new Date(Date.now() - 30_000).toISOString()
      const { data } = await supabase
        .from('driver_presence')
        .select('user_id, lat, lng, speed, last_seen')
        .neq('user_id', user.id)
        .gte('last_seen', cutoff)

      if (data) setDrivers(data.map((d: any) => ({
        user_id:      d.user_id,
        lat:          d.lat,
        lng:          d.lng,
        speed:        d.speed,
        last_seen:    d.last_seen,
        avatar_url:   null,
        display_name: null,
      })))
    }

    fetchDrivers()

    const channel = supabase
      .channel('drivers-on-map')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'driver_presence' },
        fetchDrivers
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [user])

  return drivers
}
