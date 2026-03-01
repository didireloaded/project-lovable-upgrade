import { useState } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '@/store'
import { useVoiceRoom } from '@/hooks/useVoiceRoom'

// ─── PersistentVoiceBar ────────────────────────────────────────────────────────
// Minimising/switching tabs only hides the full-screen wrapper via CSS.
// This keeps the audio connection alive across all tab switches.
export function PersistentVoiceBar() {
  const room    = useStore((s) => s.activeVoiceRoom)
  const { leave } = useVoiceRoom()
  const [expanded, setExpanded] = useState(false)

  // Nothing at all if not in a room
  if (!room) return null

  return (
    <>
      {/* ── Compact bar — always shown when in a room, above bottom nav ── */}
      <AnimatePresence>
        {!expanded && (
          <motion.div
            key="voice-bar"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex-shrink-0 flex items-center justify-between px-4 py-2.5
                       bg-success/15 border-b border-success/25 z-30 cursor-pointer"
          >
            {/* Tap the bar (not End) to open full-screen */}
            <button
              onClick={() => setExpanded(true)}
              className="flex items-center gap-2.5 bg-transparent border-none flex-1 text-left cursor-pointer"
            >
              {/* Pulsing mic */}
              <div className="relative flex-shrink-0 w-6 h-6 flex items-center justify-center">
                <span className="text-base relative z-10">🎙</span>
                <span
                  className="absolute inset-0 rounded-full border-2 border-success/60 opacity-60"
                  style={{ animation: 'ring-expand 1.8s infinite' }}
                />
              </div>
              <div>
                <div className="text-xs font-bold text-success font-display tracking-wide">
                  {room.name}
                </div>
                <div className="text-[0.58rem] text-success/60 font-body">
                  🔴 Live · tap to open
                </div>
              </div>
            </button>

            {/* End call */}
            <button
              onClick={(e) => { e.stopPropagation(); leave() }}
              className="text-[0.6rem] bg-destructive/20 border border-destructive/30 text-destructive
                         rounded-full px-3 py-1.5 cursor-pointer font-display uppercase tracking-wider
                         hover:bg-destructive/30 transition-colors ml-2 flex-shrink-0"
            >
              End
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Full-screen overlay via portal so it escapes overflow-hidden ── */}
      {createPortal(
        <div
          className="fixed inset-0 z-[9999] flex flex-col bg-[hsl(222_50%_5%)]
                     transition-opacity duration-200"
          style={{
            opacity:          expanded ? 1  : 0,
            pointerEvents:    expanded ? 'auto' : 'none',
            visibility:       expanded ? 'visible' : 'hidden',
          }}
        >
          {/* Header */}
          <div className="flex-shrink-0 flex items-center justify-between px-5 py-4
                          border-b border-panel-border">
            <div>
              <div className="font-display text-base font-bold text-primary-foreground
                              uppercase tracking-wider">
                🎙 {room.name}
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span
                  className="w-1.5 h-1.5 rounded-full bg-success"
                  style={{ animation: 'pulse-dot 2s infinite' }}
                />
                <span className="text-[0.62rem] text-success font-display uppercase tracking-wider">
                  Live
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setExpanded(false)}
                className="text-[0.62rem] text-muted-foreground bg-foreground/10 border border-panel-border
                           rounded-full px-3 py-1.5 cursor-pointer hover:bg-foreground/15 transition-colors
                           font-display uppercase tracking-wider"
              >
                Minimise
              </button>
              <button
                onClick={() => { setExpanded(false); leave() }}
                className="text-[0.62rem] bg-destructive/20 border border-destructive/30 text-destructive
                           rounded-full px-3 py-1.5 cursor-pointer font-display uppercase tracking-wider
                           hover:bg-destructive/30 transition-colors"
              >
                Leave
              </button>
            </div>
          </div>

          {/* Daily.co iframe — ALWAYS mounted, connection never drops */}
          <div className="flex-1 relative">
            {room.url ? (
              <iframe
                src={`${room.url}?embed=1&showLeaveButton=0&showFullscreenButton=0`}
                className="absolute inset-0 w-full h-full border-none"
                allow="camera; microphone; fullscreen; display-capture"
                title="Voice Room"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-4xl mb-3" style={{ animation: 'pulse-dot 1.5s infinite' }}>🎙</div>
                  <div className="text-sm text-muted-foreground">Connecting to voice room…</div>
                </div>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
