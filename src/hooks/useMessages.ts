import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from './useAuth'

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

export function useChannels() {
  const [channels, setChannels] = useState<Channel[]>([])

  useEffect(() => {
    supabase
      .from('channels')
      .select('id, name, description, type')
      .order('name')
      .then(({ data }) => { if (data) setChannels(data) })
  }, [])

  return channels
}

export function useMessages(channelId: string | null) {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading]   = useState(true)
  const { user }                = useAuth()

  const fetchMessages = useCallback(async () => {
    if (!channelId) return
    const { data } = await supabase
      .from('messages')
      .select('id, channel_id, user_id, content, created_at')
      .eq('channel_id', channelId)
      .order('created_at', { ascending: true })
      .limit(100)

    if (data) {
      // Fetch profiles for all unique user_ids
      const userIds = [...new Set(data.map((m: any) => m.user_id))]
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, display_name, avatar_url')
        .in('user_id', userIds)

      const profileMap = new Map(
        (profiles ?? []).map((p: any) => [p.user_id, { display_name: p.display_name, avatar_url: p.avatar_url }])
      )

      setMessages(data.map((m: any) => ({
        ...m,
        profile: profileMap.get(m.user_id) ?? null,
      })))
    }
    setLoading(false)
  }, [channelId])

  useEffect(() => {
    fetchMessages()

    if (!channelId) return

    const channel = supabase
      .channel(`messages:${channelId}`)
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `channel_id=eq.${channelId}` },
        async (payload) => {
          const msg = payload.new as any
          const { data: profile } = await supabase
            .from('profiles')
            .select('display_name, avatar_url')
            .eq('user_id', msg.user_id)
            .single()
          setMessages((prev) => [...prev, { ...msg, profile: profile ?? null }])
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [channelId, fetchMessages])

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
