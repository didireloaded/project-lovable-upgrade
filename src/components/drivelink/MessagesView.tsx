import { useState, useRef, useEffect } from 'react'
import { useChannels, useMessages } from '@/hooks/useMessages'
import { useAuth } from '@/hooks/useAuth'
import { useStore } from '@/store'
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

  const activeChannel = channels.find((c) => c.id === activeChannelId)

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-10 pb-2 flex-shrink-0 bg-gradient-to-b from-background to-transparent">
        <h2 className="font-display text-[1.4rem] font-bold tracking-[0.08em] uppercase text-primary-foreground">Messages</h2>
        <p className="text-[0.72rem] text-muted-foreground mt-0.5">Connect with nearby drivers</p>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col">
        {/* Channel tabs */}
        <div className="flex gap-1.5 px-4 py-2 overflow-x-auto hide-scrollbar flex-shrink-0">
          {channels.map((ch) => (
            <button key={ch.id}
              onClick={() => setActive(ch.id)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-[0.62rem] font-display font-semibold uppercase tracking-wider border transition-all cursor-pointer ${
                activeChannelId === ch.id
                  ? 'bg-primary/20 border-primary/30 text-primary'
                  : 'bg-foreground/5 border-panel-border text-muted-foreground hover:text-foreground'
              }`}
            >
              {ch.name === 'traffic-board' ? '🚦' : ch.name === 'windhoek-drivers' ? '🗺' : '💬'} {ch.name.replace(/-/g, ' ')}
            </button>
          ))}
        </div>

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

        {/* Input — hide for traffic-board */}
        {activeChannel?.name !== 'traffic-board' && (
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
        )}

        {/* Voice rooms */}
        {activeChannel?.name !== 'traffic-board' && (
          <div className="px-4 pb-20 mt-1 flex-shrink-0">
            <div className="card-label">Voice Rooms</div>
            <div className="flex flex-col gap-2">
              {voiceRooms.length === 0 ? (
                <div className="text-xs text-muted-foreground text-center py-2">No active rooms</div>
              ) : voiceRooms.map((room) => (
                <div key={room.id} className="flex items-center justify-between p-2.5 bg-success/[0.08] border border-success/20 rounded-xl">
                  <div>
                    <div className="text-[0.75rem] text-success font-medium">🎙 {room.name}</div>
                    <div className="text-[0.62rem] text-muted-foreground mt-0.5">
                      {new Date(room.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  <button
                    onClick={() => showNotif('Voice rooms coming soon!', 'success')}
                    className="bg-success/20 border-none rounded-lg px-3 py-1.5 text-success text-[0.65rem] font-semibold cursor-pointer font-display">
                    Join
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
