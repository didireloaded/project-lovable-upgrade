import { useRef, useEffect, useState } from 'react'
import { useAIAssist } from '@/hooks/useAIAssist'

const QUICK_PROMPTS = [
  'Speed limit on B1 highway?',
  'What to do if my tyre bursts?',
  'Safest route to Swakopmund?',
  'Traffic laws I should know?',
]

export function AIChat() {
  const { messages, loading, send, clear } = useAIAssist()
  const [input, setInput]   = useState('')
  const bottomRef           = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const handleSend = () => {
    if (!input.trim()) return
    send(input)
    setInput('')
  }

  return (
    <div className="glass-card mt-3.5">
      <div className="card-label">
        AI Assistant
        <button onClick={clear}
          className="text-[0.58rem] text-muted-foreground bg-foreground/5 border border-panel-border rounded-lg px-2 py-0.5 cursor-pointer font-body">
          Clear
        </button>
      </div>

      {/* Quick prompts */}
      <div className="flex gap-1.5 flex-wrap mb-3">
        {QUICK_PROMPTS.map((p) => (
          <button key={p} onClick={() => send(p)}
            className="text-[0.6rem] bg-primary/10 border border-primary/20 text-primary rounded-full px-2.5 py-1 cursor-pointer hover:bg-primary/20 transition-colors font-body">
            {p}
          </button>
        ))}
      </div>

      {/* Messages */}
      <div className="flex flex-col gap-2 max-h-52 overflow-y-auto mb-3 hide-scrollbar pr-1">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
            <div className={`text-[0.72rem] px-3 py-2 rounded-2xl leading-relaxed max-w-[85%] ${
              msg.role === 'user'
                ? 'bg-primary/20 text-primary-foreground rounded-tr-sm self-end'
                : 'bg-secondary/10 text-secondary rounded-tl-sm self-start'
            }`}>
              {msg.text}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex items-center gap-2 self-start">
            <div className="bg-secondary/10 text-secondary/60 text-[0.7rem] px-3 py-2 rounded-2xl rounded-tl-sm flex items-center gap-1.5">
              <span className="w-1 h-1 bg-secondary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1 h-1 bg-secondary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1 h-1 bg-secondary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Ask anything car or road related…"
          className="flex-1 bg-foreground/[0.06] border border-foreground/[0.12] rounded-[10px] px-3 py-2
                     text-[0.72rem] text-foreground outline-none placeholder:text-muted-foreground
                     focus:border-secondary/40"
        />
        <button onClick={handleSend}
          disabled={!input.trim() || loading}
          className="bg-secondary border-none rounded-[10px] px-3.5 py-2 cursor-pointer
                     text-[0.75rem] text-secondary-foreground font-semibold disabled:opacity-40 transition-opacity">
          →
        </button>
      </div>
    </div>
  )
}
