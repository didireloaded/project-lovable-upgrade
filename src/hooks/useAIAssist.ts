import { useState, useCallback } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useStore } from '@/store'

export interface ChatMessage {
  id:   string
  role: 'user' | 'assistant'
  text: string
  ts:   number
}

const WELCOME: ChatMessage = {
  id:   'welcome',
  role: 'assistant',
  text: '👋 Hi! I\'m your DriveLink AI assistant. Ask me about Namibian traffic laws, vehicle issues, route advice, or anything car-related.',
  ts:   Date.now(),
}

export function useAIAssist() {
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME])
  const [loading, setLoading]   = useState(false)

  const currentSpeed  = useStore((s) => s.currentSpeed)
  const currentStreet = useStore((s) => s.currentStreet)
  const currentCity   = useStore((s) => s.currentCity)

  const send = useCallback(async (text: string) => {
    if (!text.trim() || loading) return

    const userMsg: ChatMessage = {
      id:   crypto.randomUUID(),
      role: 'user',
      text: text.trim(),
      ts:   Date.now(),
    }

    setMessages((m) => [...m, userMsg])
    setLoading(true)

    const context = {
      speed:    currentSpeed,
      location: [currentStreet, currentCity].filter(Boolean).join(', ') || 'Namibia',
    }

    try {
      const { data, error } = await supabase.functions.invoke('ai-assist', {
        body: { message: text.trim(), context },
      })

      if (error) throw error

      setMessages((m) => [...m, {
        id:   crypto.randomUUID(),
        role: 'assistant',
        text: data.reply ?? 'Sorry, I could not get a response.',
        ts:   Date.now(),
      }])
    } catch {
      setMessages((m) => [...m, {
        id:   crypto.randomUUID(),
        role: 'assistant',
        text: 'I\'m having trouble connecting. Please check your internet and try again.',
        ts:   Date.now(),
      }])
    } finally {
      setLoading(false)
    }
  }, [loading, currentSpeed, currentStreet, currentCity])

  const clear = () => setMessages([WELCOME])

  return { messages, loading, send, clear }
}
