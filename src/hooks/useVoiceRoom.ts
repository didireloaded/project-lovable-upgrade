/**
 * useVoiceRoom
 *
 * Manages a Daily.co audio-only call.
 * The DailyCall object is kept in a MODULE-LEVEL variable so it is never
 * destroyed when the component that called this hook unmounts (e.g. switching
 * from Home to Chat). Voice stays live across all views.
 */
import { useCallback, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useStore } from '@/store'

// Extend window so TS knows about the Daily.co CDN global
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

// Singleton — survives component unmount / view changes
let dailyCall: DailyCallObject | null = null

function createDailyCall(): DailyCallObject {
  if (!dailyCall) {
    if (!window.DailyIframe) {
      throw new Error('Daily.co SDK not loaded yet. Check index.html script tag.')
    }
    dailyCall = window.DailyIframe.createCallObject({
      // Audio-only; no video tracks at all
      audioSource: true,
      videoSource: false,
    })
  }
  return dailyCall
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

  const join = useCallback(async (roomName: string = 'drivers-general') => {
    try {
      showNotification('🎙 Connecting to voice…', 'success')

      // 1. Ask the edge function to create / get a Daily.co room
      const { data, error } = await supabase.functions.invoke('create-voice-room', {
        body: { name: roomName },
      })

      if (error || !data?.url) {
        console.error('Voice room error:', error ?? data)
        showNotification('❌ Could not create voice room', 'error')
        return
      }

      // 2. Persist the room to supabase so MessagesView can list it
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await supabase.from('voice_rooms').insert({
          name:           roomName,
          daily_room_url: data.url,
          is_active:      true,
          created_by:     user.id,
        }).maybeSingle()   // OK if it fails (may already exist)
      }

      // 3. Join via Daily.co call object (audio only)
      const call = createDailyCall()

      await call.join({
        url:            data.url,
        startVideoOff:  true,
        startAudioOff:  false,
      })

      setVoiceRoom(data.url, data.name ?? roomName)
      showNotification('🎙 Connected to voice room!', 'success')
    } catch (err: any) {
      console.error('useVoiceRoom join error:', err)
      showNotification(`❌ ${err?.message ?? 'Voice connection failed'}`, 'error')
    }
  }, [setVoiceRoom, showNotification])

  const leave = useCallback(async () => {
    try {
      if (dailyCall) {
        await dailyCall.leave()
        await dailyCall.destroy()
        dailyCall = null
      }
    } catch (err) {
      console.error('useVoiceRoom leave error:', err)
    } finally {
      leaveVoiceRoom()
      showNotification('🔕 Left voice room', 'warning')
    }
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
