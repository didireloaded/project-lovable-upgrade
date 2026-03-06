import { useStore, type ViewType } from "@/store";
import { motion } from "framer-motion";
import { Home, MessageCircle, Newspaper, Cloud, HelpCircle, UserCircle } from "lucide-react";

const tabs: { id: ViewType; icon: React.ReactNode; label: string }[] = [
  { id: "home", icon: <Home size={18} />, label: "Drive" },
  { id: "dm", icon: <MessageCircle size={18} />, label: "Chat" },
  { id: "news", icon: <Newspaper size={18} />, label: "News" },
  { id: "weather", icon: <Cloud size={18} />, label: "Weather" },
  { id: "help", icon: <HelpCircle size={18} />, label: "Help" },
  { id: "profile", icon: <UserCircle size={18} />, label: "Profile" },
];

export function DesktopSidebar() {
  const activeView = useStore((s) => s.currentView);
  const setView = useStore((s) => s.setView);
  const hasDmNotif = useStore((s) => s.hasDmNotif);
  const voiceActive = useStore((s) => s.voiceActive);
  const score = useStore((s) => s.score);
  const rank = useStore((s) => s.rank);

  return (
    <aside className="hidden md:flex flex-col w-[220px] flex-shrink-0 h-[100dvh] bg-sidebar border-r border-sidebar-border">
      {/* Logo */}
      <div className="px-5 pt-6 pb-4">
        <h1 className="font-display text-xl font-bold tracking-[0.12em] uppercase text-primary">
          DriveLink
        </h1>
        <p className="text-[0.65rem] text-muted-foreground mt-0.5">Road Safety Community</p>
      </div>

      {/* Nav items */}
      <nav className="flex-1 flex flex-col gap-1 px-3">
        {tabs.map((tab) => {
          const isActive = activeView === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setView(tab.id)}
              className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 border-none w-full text-left cursor-pointer ${
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-foreground/50 hover:text-foreground/80 hover:bg-foreground/5"
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="sidebarIndicator"
                  className="absolute left-0 w-[3px] h-5 rounded-r-full bg-primary"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              {tab.icon}
              <span className="font-display text-sm font-medium tracking-wider uppercase">{tab.label}</span>

              {tab.id === "dm" && hasDmNotif && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="w-2 h-2 rounded-full bg-destructive ml-auto"
                  style={{ animation: "pulse-dot 2s infinite" }}
                />
              )}

              {tab.id === "dm" && voiceActive && (
                <span
                  className="w-2 h-2 rounded-full bg-success ml-auto border border-background"
                  style={{ animation: "pulse-dot 2s infinite" }}
                />
              )}
            </button>
          );
        })}
      </nav>

      {/* User stats at bottom */}
      <div className="px-4 pb-5 pt-3 border-t border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-sm">
            🏅
          </div>
          <div>
            <div className="font-display text-sm font-bold text-foreground">{score} pts</div>
            <div className="text-[0.62rem] text-muted-foreground uppercase tracking-wider">{rank}</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
