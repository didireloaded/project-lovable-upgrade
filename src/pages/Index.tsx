import { useStore } from "@/store";
import { useProfile } from "@/hooks/useProfile";
import { useAuth } from "@/hooks/useAuth";
import { useGeolocation } from "@/hooks/useGeolocation";
import { usePresence } from "@/hooks/usePresence";
import { getSpeedLimit } from "@/lib/speedLimit";
import { BottomNav } from "@/components/drivelink/BottomNav";
import { DriveToast } from "@/components/drivelink/Toast";
import { HomeView } from "@/components/drivelink/HomeView";
import { MessagesView } from "@/components/drivelink/MessagesView";
import { NewsView } from "@/components/drivelink/NewsView";
import { WeatherView } from "@/components/drivelink/WeatherView";
import { HelpView } from "@/components/drivelink/HelpView";
import { useEffect } from "react";

const Index = () => {
  const activeView = useStore((s) => s.currentView);
  const setView = useStore((s) => s.setView);
  const { signOut } = useAuth();

  // Core hooks — always mounted
  const geo = useGeolocation();
  useProfile();
  usePresence();

  // Update speed limit when position changes
  useEffect(() => {
    if (!geo.lat || !geo.lng) return;
    getSpeedLimit(geo.lat, geo.lng).then((limit) => {
      useStore.getState().updateSpeedLimit(limit);
    });
  }, [
    geo.lat ? Math.round(geo.lat * 200) : null,
    geo.lng ? Math.round(geo.lng * 200) : null,
  ]);

  const handleSOS = () => {
    setView('help');
  };

  return (
    <div className="min-h-screen flex items-start justify-center py-10 px-5 relative">
      {/* Ambient glow */}
      <div className="fixed inset-0 ambient-glow pointer-events-none z-0" />

      <div className="relative z-10 flex flex-col items-center gap-8 w-full max-w-[1100px]">
        {/* Title */}
        <div className="text-center">
          <h1 className="font-display text-4xl md:text-5xl font-bold text-primary-foreground tracking-[0.12em] uppercase">
            Drive<span className="text-secondary">Link</span>
          </h1>
          <p className="text-muted-foreground text-sm mt-2 tracking-wider">
            Crowdsourced Road Intelligence for Namibian Drivers
          </p>
          <button
            onClick={signOut}
            className="mt-2 text-xs text-muted-foreground hover:text-foreground bg-transparent border border-foreground/10 rounded-full px-3 py-1 cursor-pointer transition-colors"
          >
            Sign Out
          </button>
        </div>

        {/* Phone frame */}
        <div className="relative">
          <div
            className="w-[375px] h-[780px] bg-[hsl(222_50%_6%)] rounded-[52px] border-2 border-foreground/[0.12] overflow-hidden relative flex flex-col"
            style={{
              boxShadow: "0 0 0 6px rgba(255,255,255,0.04), 0 40px 100px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.08)",
            }}
          >
            {/* Notch */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[120px] h-7 bg-[hsl(222_50%_6%)] rounded-b-[18px] border-2 border-foreground/10 border-t-0 z-[100]" />

            {/* Screen */}
            <div className="flex-1 overflow-hidden flex flex-col relative">
              <DriveToast />

              {activeView === "home" && <HomeView />}
              {activeView === "dm" && <MessagesView />}
              {activeView === "news" && <NewsView />}
              {activeView === "weather" && <WeatherView />}
              {activeView === "help" && <HelpView />}

              {/* FAB */}
              <button
                onClick={handleSOS}
                className="absolute bottom-[90px] right-4 w-12 h-12 rounded-full bg-gradient-to-br from-destructive to-destructive/60 border-none flex items-center justify-center text-xl z-40 cursor-pointer hover:scale-110 transition-transform"
                style={{ animation: "fab-pulse 3s infinite" }}
              >
                🆘
              </button>

              <BottomNav />
            </div>
          </div>
        </div>

        {/* Info strip */}
        <div className="flex gap-4 flex-wrap justify-center max-w-[375px]">
          {["⚡ Real-time reports", "🔐 Auth + Cloud DB", "📍 GPS tracking", "🔴 Live activity feed", "🌤 Live weather", "🤖 AI assistant"].map((pill) => (
            <div key={pill} className="bg-foreground/5 border border-panel-border rounded-full px-3.5 py-1.5 text-[0.7rem] text-muted-foreground flex items-center gap-1.5">
              {pill}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Index;
