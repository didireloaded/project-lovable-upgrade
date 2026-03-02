/**
 * useVoiceRoom — rebuilt for stability.
 * - Uses driver display_name as room name
 * - Clears old rooms before creating new ones
 * - Toggle behaviour (tap again to leave)
 * - Upsert with onConflict: created_by
 */
import { useCallback, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useStore } from '@/store'

declare global {
  interface Window {
    DailyIframe: {
      createCallObject: (opts?: object) => DailyCallObject
    }
  }
}

interface DailyCallObject {
  join:    (opts: { url: string; startVideoOff?: boolean; startAudioOff?: boolean }) => Promise<void>
  leave:   () => Promise<void>
  destroy: () => Promise<void>
  on:      (event: string, cb: (evt: any) => void) => DailyCallObject
  off:     (event: string, cb: (evt: any) => void) => DailyCallObject
  participants: () => Record<string, unknown>
}

let dailyCall: DailyCallObject | null = null

function createDailyCall(): DailyCallObject {
  if (!dailyCall) {
    if (!window.DailyIframe) {
      throw new Error('Daily.co SDK not loaded yet. Check index.html script tag.')
    }
    dailyCall = window.DailyIframe.createCallObject({
      audioSource: true,
      videoSource: false,
    })
  }
  return dailyCall
}

/** Deactivate all previous rooms for this user */
async function clearOldRooms(userId: string) {
  await supabase
    .from('voice_rooms')
    .update({ is_active: false })
    .eq('created_by', userId)
    .eq('is_active', true)
}

export function useVoiceRoom() {
  const voiceActive       = useStore((s) => s.voiceActive)
  const voiceRoomName     = useStore((s) => s.voiceRoomName)
  const voiceParticipants = useStore((s) => s.voiceParticipants)
  const setVoiceRoom      = useStore((s) => s.setVoiceRoom)
  const leaveVoiceRoom    = useStore((s) => s.leaveVoiceRoom)
  const setParticipants   = useStore((s) => s.setVoiceParticipants)
  const showNotification  = useStore((s) => s.showNotification)

  // Keep participant count in sync
  useEffect(() => {
    if (!voiceActive || !dailyCall) return

    const countParticipants = () => {
      try {
        const parts = Object.keys(dailyCall!.participants()).length
        setParticipants(parts)
      } catch {}
    }

    const cb = () => countParticipants()
    dailyCall
      .on('participant-joined', cb)
      .on('participant-left', cb)
      .on('participant-updated', cb)

    countParticipants()

    return () => {
      dailyCall?.off('participant-joined', cb)
             .off('participant-left', cb)
             .off('participant-updated', cb)
    }
  }, [voiceActive, setParticipants])

  const join = useCallback(async () => {
    // Toggle: if already active, leave instead
    if (voiceActive) {
      await leaveInternal()
      return
    }

    try {
      showNotification('🎙 Connecting to voice…', 'success')

      // Get current user + display name
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        showNotification('❌ You must be signed in', 'error')
        return
      }

      // Fetch display name from profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('user_id', user.id)
        .maybeSingle()

      const driverName = profile?.display_name || user.email?.split('@')[0] || 'Driver'

      // Clear old rooms for this user
      await clearOldRooms(user.id)

      // Create Daily.co room
      const { data, error } = await supabase.functions.invoke('create-voice-room', {
        body: { name: driverName },
      })

      if (error || !data?.url) {
        console.error('Voice room error:', error ?? data)
        showNotification('❌ Could not create voice room', 'error')
        return
      }

      // Upsert room record — one per driver
      await supabase.from('voice_rooms').upsert({
        name:           driverName,
        daily_room_url: data.url,
        is_active:      true,
        created_by:     user.id,
      }, { onConflict: 'created_by' })

      // Join via Daily.co
      const call = createDailyCall()
      await call.join({
        url:            data.url,
        startVideoOff:  true,
        startAudioOff:  false,
      })

      setVoiceRoom(data.url, driverName)
      showNotification('🎙 Connected to voice room!', 'success')
    } catch (err: any) {
      console.error('useVoiceRoom join error:', err)
      showNotification(`❌ ${err?.message ?? 'Voice connection failed'}`, 'error')
    }
  }, [voiceActive, setVoiceRoom, showNotification])

  const leaveInternal = async () => {
    try {
      if (dailyCall) {
        await dailyCall.leave()
        await dailyCall.destroy()
        dailyCall = null
      }
      // Mark room inactive
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await clearOldRooms(user.id)
      }
    } catch (err) {
      console.error('useVoiceRoom leave error:', err)
    } finally {
      leaveVoiceRoom()
      showNotification('🔕 Left voice room', 'warning')
    }
  }

  const leave = useCallback(async () => {
    await leaveInternal()
  }, [leaveVoiceRoom, showNotification])

  const joinByUrl = useCallback(async (url: string, name: string) => {
    try {
      showNotification('🎙 Joining room…', 'success')
      const call = createDailyCall()
      await call.join({ url, startVideoOff: true, startAudioOff: false })
      setVoiceRoom(url, name)
      showNotification('🎙 Joined voice room!', 'success')
    } catch (err: any) {
      showNotification(`❌ ${err?.message ?? 'Could not join room'}`, 'error')
    }
  }, [setVoiceRoom, showNotification])

  return {
    voiceActive,
    voiceRoomName,
    voiceParticipants,
    join,
    leave,
    joinByUrl,
  }
}
