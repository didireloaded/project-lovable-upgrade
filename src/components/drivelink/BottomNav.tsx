import { useStore, type ViewType } from "@/store";
import { motion } from "framer-motion";

const tabs: { id: ViewType; icon: string; label: string; activeColor: string }[] = [
  { id: "home", icon: "🏠", label: "Drive", activeColor: "text-primary" },
  { id: "dm", icon: "💬", label: "Chat", activeColor: "text-success" },
  { id: "news", icon: "📰", label: "News", activeColor: "text-warning" },
  { id: "weather", icon: "🌤", label: "Weather", activeColor: "text-secondary" },
  { id: "help", icon: "🆘", label: "Help", activeColor: "text-purple" },
];

export function BottomNav() {
  const activeView = useStore((s) => s.currentView);
  const setView = useStore((s) => s.setView);
  const hasDmNotif = useStore((s) => s.hasDmNotif);
  const voiceActive = useStore((s) => s.voiceActive);

  return (
    <div className="flex-shrink-0 bg-background/90 backdrop-blur-xl border-t border-panel-border z-50 px-2 pb-3.5 pt-2">
      <div className="flex justify-around">
        {tabs.map((tab) => {
          const isActive = activeView === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setView(tab.id)}
              className={`relative flex flex-col items-center gap-0.5 px-2.5 py-1.5 rounded-xl min-w-[52px] transition-all duration-200 border-none ${
                isActive
                  ? `bg-foreground/10 ${tab.activeColor} -translate-y-0.5`
                  : "text-foreground/40 hover:text-foreground/70 hover:bg-foreground/5"
              }`}
            >
              <span className="text-lg">{tab.icon}</span>
              <span className="font-display text-[0.55rem] font-medium tracking-wider uppercase">{tab.label}</span>

              {/* DM notification dot */}
              {tab.id === "dm" && hasDmNotif && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute top-1 right-2 w-1.5 h-1.5 rounded-full bg-destructive"
                  style={{ animation: "pulse-dot 2s infinite" }}
                />
              )}

              {/* Voice active indicator on Chat tab */}
              {tab.id === "dm" && voiceActive && (
                <span
                  className="absolute top-0.5 left-2 w-2 h-2 rounded-full bg-success border border-background"
                  style={{ animation: "pulse-dot 2s infinite" }}
                />
              )}
            </button>
          );
        })}
      </div>
      <div className="w-8 h-[3px] rounded-sm bg-foreground/15 mx-auto mt-1" />
    </div>
  );
}
