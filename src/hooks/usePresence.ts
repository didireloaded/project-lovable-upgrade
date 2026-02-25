import { useEffect, useRef, useState, useCallback } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useStore } from '@/store'
import { useAuth } from './useAuth'
import { useGeolocation } from './useGeolocation'

export interface DriverOnMap {
  user_id:      string
  lat:          number
  lng:          number
  speed:        number | null
  heading:      number | null
  last_seen:    string
  display_name: string | null
  avatar_url:   string | null
}

export function usePresence() {
  const { user }         = useAuth()
  const geo              = useGeolocation()
  const setNearbyDrivers = useStore((s) => s.setNearbyDrivers)
  const ghostMode        = useStore((s) => s.ghostMode)
  const intervalRef      = useRef<ReturnType<typeof setInterval>>()

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
        heading:   geo.heading != null ? Math.round(geo.heading) : null,
        last_seen: new Date().toISOString(),
      } as any)
    }

    upsert()
    intervalRef.current = setInterval(upsert, 10_000)

    return () => {
      clearInterval(intervalRef.current)
      if (!ghostMode) {
        supabase.from('driver_presence').delete().eq('user_id', user.id)
      }
    }
  }, [user, geo.lat, geo.lng, geo.speed, geo.heading, ghostMode])

  const refreshCount = useCallback(async () => {
    if (!user) return
    const cutoff = new Date(Date.now() - 30_000).toISOString()
    const { count } = await supabase
      .from('driver_presence')
      .select('user_id', { count: 'exact', head: true })
      .neq('user_id', user.id)
      .gte('last_seen', cutoff)
    setNearbyDrivers(count ?? 0)
  }, [user, setNearbyDrivers])

  useEffect(() => {
    if (user) refreshCount()
  }, [user, refreshCount])

  useEffect(() => {
    if (!user) return

    const channel = supabase
      .channel('driver-presence-count')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'driver_presence' },
        () => refreshCount()
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [user, refreshCount])
}

export function useDriversOnMap(): DriverOnMap[] {
  const [drivers, setDrivers] = useState<DriverOnMap[]>([])
  const { user } = useAuth()
  const geo = useGeolocation()

  const fetchDrivers = useCallback(async () => {
    if (!user) return

    if (geo.lat != null && geo.lng != null) {
      const { data } = await supabase.rpc('nearby_drivers' as any, {
        user_lat:  geo.lat,
        user_lng:  geo.lng,
        radius_km: 10,
      })
      if (data) setDrivers(data as DriverOnMap[])
      return
    }

    const cutoff = new Date(Date.now() - 30_000).toISOString()
    const { data } = await supabase
      .from('driver_presence')
      .select('user_id, lat, lng, speed, heading, last_seen')
      .neq('user_id', user.id)
      .gte('last_seen', cutoff)

    if (!data) return

    const ids = data.map((d: any) => d.user_id)
    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, display_name, avatar_url')
      .in('user_id', ids)

    const profileMap = new Map((profiles ?? []).map((p: any) => [p.user_id, p]))

    setDrivers(data.map((d: any) => ({
      ...d,
      display_name: profileMap.get(d.user_id)?.display_name ?? null,
      avatar_url:   profileMap.get(d.user_id)?.avatar_url   ?? null,
    })))
  }, [user, geo.lat, geo.lng])

  useEffect(() => {
    fetchDrivers()
  }, [fetchDrivers])

  useEffect(() => {
    if (!user) return

    const channel = supabase
      .channel('drivers-on-map')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'driver_presence' },
        fetchDrivers
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [user, fetchDrivers])

  return drivers
}
