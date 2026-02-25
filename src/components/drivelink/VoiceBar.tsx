import { motion, AnimatePresence } from 'framer-motion'
import { useVoiceRoom } from '@/hooks/useVoiceRoom'

export function VoiceBar() {
  const { voiceActive, voiceRoomName, voiceParticipants, leave } = useVoiceRoom()

  return (
    <AnimatePresence>
      {voiceActive && (
        <motion.div
          key="voice-bar"
          initial={{ y: -40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -40, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 320, damping: 28 }}
          className="flex-shrink-0 flex items-center justify-between px-4 py-2
                     bg-success/10 border-b border-success/20"
        >
          {/* Left: animated mic + room name */}
          <div className="flex items-center gap-2">
            {/* Pulsing mic icon */}
            <span
              className="text-base"
              style={{ animation: 'voice-pulse 1.5s infinite' }}
            >
              🎙
            </span>
            <div>
              <div className="text-[0.65rem] text-success font-display font-semibold uppercase tracking-wider leading-none">
                Live Voice
              </div>
              <div className="text-[0.58rem] text-muted-foreground mt-0.5 leading-none truncate max-w-[140px]">
                {voiceRoomName ?? 'drivers-general'}
              </div>
            </div>
          </div>

          {/* Middle: participant count + wave animation */}
          <div className="flex items-center gap-1.5">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="block w-0.5 rounded-full bg-success"
                style={{
                  height: `${8 + i * 4}px`,
                  animation: `voice-wave 1s ${i * 0.18}s infinite ease-in-out alternate`,
                }}
              />
            ))}
            <span className="text-[0.62rem] text-success ml-1">
              {voiceParticipants} connected
            </span>
          </div>

          {/* Right: hang up */}
          <button
            onClick={leave}
            className="bg-destructive/20 border border-destructive/30 rounded-full
                       px-2.5 py-1 text-destructive text-[0.62rem] font-display
                       font-semibold uppercase tracking-wider cursor-pointer
                       hover:bg-destructive/30 transition-colors"
          >
            End
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
