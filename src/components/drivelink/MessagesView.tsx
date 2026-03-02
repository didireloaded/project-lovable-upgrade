import { useState, useRef, useEffect } from 'react'
import { useChannels, useMessages } from '@/hooks/useMessages'
import { useAuth } from '@/hooks/useAuth'
import { useStore } from '@/store'
import { useVoiceRoom } from '@/hooks/useVoiceRoom'
import { supabase } from '@/integrations/supabase/client'

export function MessagesView() {
  const channels = useChannels()
  const [activeChannelId, setActive] = useState<string | null>(null)
  const [voiceRooms, setVoiceRooms] = useState<any[]>([])
  const { user } = useAuth()
  const { messages, loading, sendMessage } = useMessages(activeChannelId)
  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const showNotif = useStore((s) => s.showNotification)
  const { joinByUrl, voiceActive } = useVoiceRoom()

  // Set first channel as default
  useEffect(() => {
    if (channels.length && !activeChannelId) setActive(channels[0].id)
  }, [channels, activeChannelId])

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Load voice rooms
  useEffect(() => {
    supabase.from('voice_rooms').select('*').eq('is_active', true)
      .order('created_at', { ascending: false })
      .then(({ data }) => { if (data) setVoiceRooms(data) })

    const ch = supabase.channel('voice-rooms-feed')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'voice_rooms' },
        () => supabase.from('voice_rooms').select('*').eq('is_active', true)
          .order('created_at', { ascending: false })
          .then(({ data }) => { if (data) setVoiceRooms(data) })
      ).subscribe()

    return () => { supabase.removeChannel(ch) }
  }, [])

  const handleSend = async () => {
    if (!input.trim()) return
    await sendMessage(input)
    setInput('')
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-10 pb-2 flex-shrink-0 bg-gradient-to-b from-background to-transparent">
        <h2 className="font-display text-[1.4rem] font-bold tracking-[0.08em] uppercase text-primary-foreground">Driver Community</h2>
        <p className="text-[0.72rem] text-muted-foreground mt-0.5">Chat & voice with nearby drivers</p>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col">
        {/* Voice rooms section */}
        {voiceRooms.length > 0 && (
          <div className="px-4 py-2 flex-shrink-0">
            <div className="card-label">🎙 Live Voice Rooms</div>
            <div className="flex flex-col gap-2">
              {voiceRooms.map((room) => (
                <div key={room.id} className="flex items-center justify-between p-2.5 bg-success/[0.08] border border-success/20 rounded-xl">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🎙</span>
                    <div>
                      <div className="text-[0.75rem] text-success font-medium">{room.name}</div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-success inline-block" style={{ animation: 'pulse-dot 2s infinite' }} />
                        <span className="text-[0.58rem] text-success/70 font-display uppercase tracking-wider">Active</span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => room.daily_room_url ? joinByUrl(room.daily_room_url, room.name) : showNotif('No room URL available', 'error')}
                    disabled={voiceActive}
                    className={`border-none rounded-lg px-3 py-1.5 text-[0.65rem] font-semibold cursor-pointer font-display ${
                      voiceActive ? 'bg-muted/20 text-muted-foreground' : 'bg-success/20 text-success'
                    }`}>
                    {voiceActive ? 'In call' : 'Join'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 hide-scrollbar pb-2">
          {loading ? (
            <div className="text-center text-xs text-muted-foreground py-6">Loading…</div>
          ) : messages.length === 0 ? (
            <div className="text-center text-xs text-muted-foreground py-6">
              No messages yet. Start the conversation!
            </div>
          ) : (
            messages.map((msg) => {
              const isOwn = msg.user_id === user?.id
              return (
                <div key={msg.id} className={`flex gap-2 mb-2.5 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold bg-primary/30 overflow-hidden">
                    {msg.profile?.avatar_url
                      ? <img src={msg.profile.avatar_url} className="w-full h-full object-cover" alt="" />
                      : <span>{(msg.profile?.display_name?.[0] ?? '?').toUpperCase()}</span>
                    }
                  </div>
                  <div className={`max-w-[75%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col gap-0.5`}>
                    {!isOwn && (
                      <span className="text-[0.58rem] text-muted-foreground px-1">
                        {msg.profile?.display_name ?? 'Driver'}
                      </span>
                    )}
                    <div className={`px-3 py-2 rounded-2xl text-[0.75rem] leading-relaxed ${
                      isOwn
                        ? 'bg-primary text-primary-foreground rounded-tr-sm'
                        : 'bg-foreground/10 text-foreground rounded-tl-sm'
                    }`}>
                      {msg.content}
                    </div>
                    <span className="text-[0.55rem] text-muted-foreground px-1">
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              )
            })
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="px-4 pb-20 flex gap-2 flex-shrink-0 border-t border-panel-border pt-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type a message…"
            className="flex-1 bg-foreground/[0.06] border border-foreground/[0.12] rounded-xl px-3 py-2
                       text-sm text-foreground outline-none placeholder:text-muted-foreground"
          />
          <button onClick={handleSend}
            disabled={!input.trim()}
            className="bg-primary border-none rounded-xl px-4 py-2 text-primary-foreground text-sm font-semibold cursor-pointer disabled:opacity-40">
            →
          </button>
        </div>
      </div>
    </div>
  )
}
