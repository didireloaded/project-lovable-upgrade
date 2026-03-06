import { useState, useRef, useEffect } from 'react'
import { useChannels, useMessages } from '@/hooks/useMessages'
import { useAuth } from '@/hooks/useAuth'
import { useStore } from '@/store'
import { useVoiceRoom } from '@/hooks/useVoiceRoom'
import { supabase } from '@/integrations/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Send, Mic, Phone } from 'lucide-react'

function timeLabel(dateStr: string) {
  const d = new Date(dateStr)
  const now = new Date()
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000)
  if (diffDays === 0) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return d.toLocaleDateString([], { weekday: 'long' })
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' })
}

export function MessagesView() {
  const channels = useChannels()
  const [activeChannelId, setActive] = useState<string | null>(null)
  const [showChat, setShowChat] = useState(false)
  const [voiceRooms, setVoiceRooms] = useState<any[]>([])
  const { user } = useAuth()
  const { messages, loading, sendMessage } = useMessages(activeChannelId)
  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const showNotif = useStore((s) => s.showNotification)
  const { joinByUrl, voiceActive } = useVoiceRoom()

  useEffect(() => {
    if (channels.length && !activeChannelId) setActive(channels[0].id)
  }, [channels, activeChannelId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

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

  const openChannel = (id: string) => {
    setActive(id)
    setShowChat(true)
  }

  // Group messages by date
  const groupedMessages: { date: string; msgs: typeof messages }[] = []
  messages.forEach((msg) => {
    const date = new Date(msg.created_at).toLocaleDateString()
    const last = groupedMessages[groupedMessages.length - 1]
    if (last && last.date === date) {
      last.msgs.push(msg)
    } else {
      groupedMessages.push({ date, msgs: [msg] })
    }
  })

  const activeCh = channels.find((c) => c.id === activeChannelId)

  return (
    <div className="flex flex-col h-full">
      {/* Mobile: toggle between list and chat */}
      <AnimatePresence mode="wait">
        {!showChat ? (
          <motion.div
            key="list"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex flex-col h-full"
          >
            {/* Header */}
            <div className="flex-shrink-0 px-5 pt-7 pb-4 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-transparent" />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-1">
                  <h2 className="font-display text-2xl font-bold text-foreground">Messages</h2>
                </div>
                <p className="text-[0.72rem] text-muted-foreground">Chat & voice with nearby drivers</p>
              </div>
            </div>

            {/* Voice rooms */}
            {voiceRooms.length > 0 && (
              <div className="px-5 pb-3 flex-shrink-0">
                <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-1">
                  {voiceRooms.map((room) => (
                    <button
                      key={room.id}
                      onClick={() => room.daily_room_url ? joinByUrl(room.daily_room_url, room.name) : showNotif('No room URL', 'error')}
                      disabled={voiceActive}
                      className="flex-shrink-0 flex flex-col items-center gap-1.5 cursor-pointer bg-transparent border-none"
                    >
                      <div className="relative">
                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-success/20 to-secondary/20 border-2 border-success/40 flex items-center justify-center">
                          <Mic size={18} className="text-success" />
                        </div>
                        <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 bg-success text-[0.45rem] text-success-foreground px-1.5 py-0.5 rounded-full font-bold uppercase">
                          Live
                        </span>
                      </div>
                      <span className="text-[0.6rem] text-foreground/70 max-w-[60px] truncate">{room.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Channel list */}
            <div className="flex-1 overflow-y-auto px-3 hide-scrollbar pb-20 md:pb-4">
              {channels.map((ch) => (
                <button
                  key={ch.id}
                  onClick={() => openChannel(ch.id)}
                  className={`w-full flex items-center gap-3.5 px-3 py-3.5 rounded-2xl mb-1 cursor-pointer border-none transition-colors ${
                    activeChannelId === ch.id ? 'bg-foreground/[0.08]' : 'bg-transparent hover:bg-foreground/[0.04]'
                  }`}
                >
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/25 to-secondary/25 flex items-center justify-center flex-shrink-0">
                    <span className="text-lg">💬</span>
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-foreground truncate">{ch.name}</span>
                      <span className="text-[0.6rem] text-muted-foreground flex-shrink-0 ml-2">
                        {ch.type}
                      </span>
                    </div>
                    <p className="text-[0.72rem] text-muted-foreground truncate mt-0.5">
                      {ch.description || 'Tap to start chatting'}
                    </p>
                  </div>
                </button>
              ))}
              {channels.length === 0 && (
                <div className="text-center py-12">
                  <div className="text-4xl mb-3">💬</div>
                  <p className="text-muted-foreground text-sm">No channels yet</p>
                </div>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="chat"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="flex flex-col h-full"
          >
            {/* Chat header */}
            <div className="flex-shrink-0 flex items-center gap-3 px-4 py-3.5 border-b border-panel-border bg-background/80 backdrop-blur-xl">
              <button
                onClick={() => setShowChat(false)}
                className="w-9 h-9 rounded-full bg-foreground/[0.06] flex items-center justify-center cursor-pointer border-none hover:bg-foreground/10 transition-colors md:hidden"
              >
                <ArrowLeft size={16} className="text-foreground" />
              </button>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/30 to-secondary/30 flex items-center justify-center">
                <span className="text-base">💬</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-foreground truncate">{activeCh?.name ?? 'Chat'}</div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-success" style={{ animation: 'pulse-dot 2s infinite' }} />
                  <span className="text-[0.6rem] text-success">Active now</span>
                </div>
              </div>
              <button className="w-9 h-9 rounded-full bg-foreground/[0.06] flex items-center justify-center cursor-pointer border-none hover:bg-foreground/10 transition-colors">
                <Phone size={14} className="text-foreground/60" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-3 hide-scrollbar">
              {loading ? (
                <div className="text-center text-xs text-muted-foreground py-6">Loading…</div>
              ) : messages.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-4xl mb-3">👋</div>
                  <p className="text-muted-foreground text-sm">Start the conversation!</p>
                </div>
              ) : (
                groupedMessages.map((group) => (
                  <div key={group.date}>
                    <div className="flex justify-center my-4">
                      <span className="bg-foreground/[0.08] rounded-full px-3 py-1 text-[0.6rem] text-muted-foreground">
                        {new Date(group.date).toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    {group.msgs.map((msg) => {
                      const isOwn = msg.user_id === user?.id
                      return (
                        <div key={msg.id} className={`flex gap-2 mb-3 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
                          <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-[0.6rem] font-bold overflow-hidden bg-gradient-to-br from-primary/25 to-secondary/25 self-end mb-5">
                            {msg.profile?.avatar_url
                              ? <img src={msg.profile.avatar_url} className="w-full h-full object-cover" alt="" />
                              : <span className="text-foreground">{(msg.profile?.display_name?.[0] ?? '?').toUpperCase()}</span>
                            }
                          </div>
                          <div className={`max-w-[72%] flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
                            {!isOwn && (
                              <span className="text-[0.58rem] text-muted-foreground px-1 mb-0.5">
                                {msg.profile?.display_name ?? 'Driver'}
                              </span>
                            )}
                            <div className={`px-3.5 py-2.5 text-[0.8rem] leading-relaxed ${
                              isOwn
                                ? 'bg-primary text-primary-foreground rounded-2xl rounded-br-md'
                                : 'bg-foreground/[0.08] text-foreground rounded-2xl rounded-bl-md'
                            }`}>
                              {msg.content}
                            </div>
                            <span className="text-[0.55rem] text-muted-foreground px-1 mt-1">
                              {timeLabel(msg.created_at)}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ))
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input bar */}
            <div className="flex-shrink-0 px-4 pb-20 md:pb-4 pt-2 bg-background/80 backdrop-blur-xl border-t border-panel-border">
              <div className="flex items-center gap-2 bg-foreground/[0.06] border border-foreground/[0.1] rounded-2xl px-3 py-1.5">
                <button className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 border-none cursor-pointer">
                  <span className="text-sm">+</span>
                </button>
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Type something..."
                  className="flex-1 bg-transparent border-none outline-none text-sm text-foreground placeholder:text-muted-foreground py-1.5"
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim()}
                  className="w-9 h-9 rounded-full bg-primary flex items-center justify-center flex-shrink-0 border-none cursor-pointer disabled:opacity-30 transition-opacity"
                >
                  <Send size={14} className="text-primary-foreground" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
