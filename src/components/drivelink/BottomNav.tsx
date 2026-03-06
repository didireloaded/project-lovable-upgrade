import { useStore, type ViewType } from "@/store";
import { motion } from "framer-motion";
import { Home, MessageCircle, Newspaper, Cloud, HelpCircle, UserCircle } from "lucide-react";

const tabs: { id: ViewType; icon: React.ReactNode; label: string }[] = [
  { id: "home", icon: <Home size={20} />, label: "Drive" },
  { id: "dm", icon: <MessageCircle size={20} />, label: "Chat" },
  { id: "news", icon: <Newspaper size={20} />, label: "News" },
  { id: "weather", icon: <Cloud size={20} />, label: "Weather" },
  { id: "help", icon: <HelpCircle size={20} />, label: "Help" },
  { id: "profile", icon: <UserCircle size={20} />, label: "Profile" },
];

export function BottomNav() {
  const activeView = useStore((s) => s.currentView);
  const setView = useStore((s) => s.setView);
  const hasDmNotif = useStore((s) => s.hasDmNotif);
  const voiceActive = useStore((s) => s.voiceActive);

  return (
    <div className="flex-shrink-0 bg-background/90 backdrop-blur-xl border-t border-panel-border z-50 px-1 pb-4 pt-2">
      <div className="flex justify-around">
        {tabs.map((tab) => {
          const isActive = activeView === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setView(tab.id)}
              className={`relative flex flex-col items-center gap-0.5 px-1.5 py-1.5 rounded-xl min-w-[44px] transition-all duration-200 border-none cursor-pointer ${
                isActive
                  ? "text-primary -translate-y-0.5"
                  : "text-foreground/35 hover:text-foreground/60"
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="bottomNavIndicator"
                  className="absolute -top-2 w-5 h-0.5 rounded-full bg-primary"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              {tab.icon}
              <span className="font-display text-[0.5rem] font-medium tracking-wider uppercase">{tab.label}</span>

              {tab.id === "dm" && hasDmNotif && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute top-0.5 right-1 w-2 h-2 rounded-full bg-destructive"
                  style={{ animation: "pulse-dot 2s infinite" }}
                />
              )}

              {tab.id === "dm" && voiceActive && (
                <span
                  className="absolute top-0.5 left-1 w-2 h-2 rounded-full bg-success border border-background"
                  style={{ animation: "pulse-dot 2s infinite" }}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
