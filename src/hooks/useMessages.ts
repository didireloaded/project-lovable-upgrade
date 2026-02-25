import { useEffect, useState, useCallback, useRef } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from './useAuth'
import { useStore } from '@/store'

export interface Message {
  id:         string
  channel_id: string
  user_id:    string
  content:    string
  created_at: string
  profile?: {
    display_name: string | null
    avatar_url:   string | null
  } | null
}

export interface Channel {
  id:          string
  name:        string
  description: string | null
  type:        string
}

const profileCache = new Map<string, { display_name: string | null; avatar_url: string | null }>()

async function fetchProfile(userId: string) {
  if (profileCache.has(userId)) return profileCache.get(userId)!
  const { data } = await supabase
    .from('profiles')
    .select('display_name, avatar_url')
    .eq('user_id', userId)
    .single()
  const p = { display_name: data?.display_name ?? null, avatar_url: data?.avatar_url ?? null }
  profileCache.set(userId, p)
  return p
}

export function useChannels() {
  const [channels, setChannels] = useState<Channel[]>([])

  useEffect(() => {
    supabase
      .from('channels')
      .select('id, name, description, type')
      .order('name')
      .then(({ data }) => { if (data) setChannels(data) })

    const ch = supabase
      .channel('channels-feed')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'channels' },
        (payload) => setChannels((prev) => [...prev, payload.new as Channel])
      )
      .subscribe()

    return () => { supabase.removeChannel(ch) }
  }, [])

  return channels
}

export function useMessages(channelId: string | null) {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading]   = useState(true)
  const { user }                = useAuth()
  const setHasDmNotif           = useStore((s) => s.setHasDmNotif)
  const currentView             = useStore((s) => s.currentView)
  const isVisibleRef            = useRef(currentView === 'dm')

  useEffect(() => {
    isVisibleRef.current = currentView === 'dm'
  }, [currentView])

  const fetchMessages = useCallback(async () => {
    if (!channelId) return
    const { data } = await supabase
      .from('messages')
      .select('id, channel_id, user_id, content, created_at')
      .eq('channel_id', channelId)
      .order('created_at', { ascending: true })
      .limit(100)

    if (data) {
      const userIds = [...new Set(data.map((m: any) => m.user_id))]
      await Promise.all(userIds.map(fetchProfile))
      setMessages(data.map((m: any) => ({
        ...m,
        profile: profileCache.get(m.user_id) ?? null,
      })))
    }
    setLoading(false)
  }, [channelId])

  useEffect(() => {
    setLoading(true)
    fetchMessages()

    if (!channelId) return

    const channel = supabase
      .channel(`messages:${channelId}`)
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `channel_id=eq.${channelId}` },
        async (payload) => {
          const msg = payload.new as any
          const profile = await fetchProfile(msg.user_id)
          setMessages((prev) => [...prev, { ...msg, profile }])

          if (!isVisibleRef.current && msg.user_id !== user?.id) {
            setHasDmNotif(true)
          }
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [channelId, fetchMessages, user, setHasDmNotif])

  const sendMessage = useCallback(async (content: string) => {
    if (!user || !channelId || !content.trim()) return
    await supabase.from('messages').insert({
      channel_id: channelId,
      user_id:    user.id,
      content:    content.trim(),
    } as any)
  }, [user, channelId])

  return { messages, loading, sendMessage }
}
