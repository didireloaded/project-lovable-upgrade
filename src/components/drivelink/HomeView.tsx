import { useStore } from "@/store";
import { useReports, type Report } from "@/hooks/useReports";
import { useProfile } from "@/hooks/useProfile";
import { useGeolocation } from "@/hooks/useGeolocation";
import { motion } from "framer-motion";
import { useState, useCallback } from "react";

const alertButtons = [
  { type: "police" as const, icon: "🚔", label: "Police", cls: "from-destructive to-destructive/70 shadow-destructive/30" },
  { type: "accident" as const, icon: "🚗", label: "Accident", cls: "from-warning to-warning/70 shadow-warning/30" },
  { type: "hazard" as const, icon: "⚠️", label: "Hazard", cls: "from-warning to-warning/60 shadow-warning/25" },
  { type: "traffic" as const, icon: "🚦", label: "Traffic", cls: "from-primary to-primary/70 shadow-primary/30" },
  { type: "pothole" as const, icon: "🕳️", label: "Pothole", cls: "from-purple to-purple/70 shadow-purple/30" },
];

const REPORT_ICONS: Record<string, string> = {
  police: "🚔", accident: "🚗", hazard: "⚠️", traffic: "🚦", pothole: "🕳️",
};

export function HomeView() {
  const score = useStore((s) => s.score);
  const speed = useStore((s) => s.currentSpeed);
  const speedLimit = useStore((s) => s.speedLimit);
  const reportsToday = useStore((s) => s.reportsToday);
  const nearbyDrivers = useStore((s) => s.nearbyDrivers);
  const rank = useStore((s) => s.rank);
  const weeklyReports = useStore((s) => s.weeklyReports);
  const showNotification = useStore((s) => s.showNotification);
  const currentStreet = useStore((s) => s.currentStreet);
  const currentCity = useStore((s) => s.currentCity);
  const ghostMode = useStore((s) => s.ghostMode);
  const toggleGhost = useStore((s) => s.toggleGhostMode);

  const { reports, loading, submitReport } = useReports();
  const { syncScore } = useProfile();
  const geo = useGeolocation();
  const [voiceActive, setVoiceActive] = useState(false);

  const speedStatus = speed > 120 ? "danger" : speed > 80 ? "warn" : "safe";
  const speedClass = speedStatus === "danger" ? "speed-danger" : speedStatus === "warn" ? "speed-warn" : "speed-safe";
  const progress = Math.min((reportsToday / 10) * 100, 100);

  const handleReport = useCallback(async (type: Report['type']) => {
    const success = await submitReport(type, geo.lat ?? undefined, geo.lng ?? undefined);
    if (success) {
      await syncScore();
      const msgs: Record<string, string> = {
        police: "Police presence reported! +2 pts",
        accident: "Accident reported! +2 pts",
        hazard: "Road hazard reported! +2 pts",
        traffic: "Traffic jam reported! +2 pts",
        pothole: "📸 Pothole reported! +3 pts",
      };
      showNotification(msgs[type] || `${type} reported!`, 'success');
    }
  }, [submitReport, syncScore, showNotification, geo.lat, geo.lng]);

  const toggleVoice = useCallback(() => {
    setVoiceActive((prev) => {
      const next = !prev;
      showNotification(
        next ? "🎙 Connected to nearby drivers!" : "🔕 Disconnected from voice chat",
        next ? "success" : "warning"
      );
      return next;
    });
  }, [showNotification]);

  const recentReports = reports.slice(0, 4);
  const locationLabel = [currentStreet, currentCity].filter(Boolean).join(', ') || 'Windhoek, NA';

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="header-gradient px-5 pt-10 pb-4 relative overflow-hidden flex-shrink-0">
        <div className="absolute inset-0 opacity-30" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='200' height='200' viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='100' cy='100' r='2' fill='rgba(255,255,255,0.06)'/%3E%3Ccircle cx='30' cy='60' r='1.5' fill='rgba(255,255,255,0.04)'/%3E%3Ccircle cx='160' cy='40' r='1' fill='rgba(255,255,255,0.04)'/%3E%3C/svg%3E")`
        }} />
        <h1 className="font-display text-[1.9rem] font-bold text-center tracking-[0.1em] uppercase relative z-10 text-primary-foreground mb-3.5">
          DriveLink
        </h1>
        <div className="relative z-10 flex justify-between items-center bg-foreground/10 border border-foreground/15 rounded-full px-5 py-2.5 backdrop-blur-lg">
          <div className="text-center flex-1">
            <div className="font-display text-2xl font-bold text-primary-foreground leading-none">{score}</div>
            <div className="text-[0.62rem] text-foreground/60 tracking-[0.1em] mt-0.5">SCORE</div>
          </div>
          <div className="text-center flex-1">
            <div className={`inline-flex flex-col items-center px-4 py-1.5 rounded-2xl transition-all duration-500 ${speedClass}`}>
              <div className="font-display text-2xl font-bold text-primary-foreground leading-none">{speed}</div>
              <div className="text-[0.62rem] text-primary-foreground/80 tracking-[0.1em] mt-0.5">KM/H</div>
            </div>
          </div>
          <div className="text-center flex-1">
            <div className="font-display text-2xl font-bold text-primary-foreground leading-none">{speedLimit}</div>
            <div className="text-[0.62rem] text-foreground/60 tracking-[0.1em] mt-0.5">LIMIT</div>
          </div>
        </div>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-20 hide-scrollbar">
        {/* Map area with GPS info */}
        <div className="h-48 rounded-[14px] bg-gradient-to-br from-[hsl(216_50%_16%)] to-[hsl(216_60%_10%)] relative overflow-hidden mb-3.5">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Cpath d='M0 20 L100 20 M0 40 L100 40 M0 60 L100 60 M0 80 L100 80 M20 0 L20 100 M40 0 L40 100 M60 0 L60 100 M80 0 L80 100' stroke='rgba(59,127,245,0.12)' stroke-width='1'/%3E%3C/svg%3E")`,
            backgroundSize: "50px 50px"
          }} />
          <svg className="absolute inset-0 w-full h-full opacity-40" viewBox="0 0 375 200" preserveAspectRatio="none">
            <path d="M0 100 Q80 80 140 100 T280 90 T375 100" stroke="hsl(219 90% 59% / 0.4)" strokeWidth="3" fill="none" />
            <path d="M0 120 Q90 110 160 130 T320 115 T375 125" stroke="hsl(168 100% 45% / 0.25)" strokeWidth="2" fill="none" />
          </svg>

          {/* User dot */}
          {!geo.loading && !geo.error && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
              <div className="w-5 h-5 bg-primary rounded-full border-[3px] border-white" style={{ boxShadow: '0 0 0 8px rgba(59,127,245,0.25)', animation: 'ping-map 2s infinite' }} />
            </div>
          )}

          {/* GPS loading */}
          {geo.loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm">
              <div className="flex flex-col items-center gap-2">
                <div className="w-5 h-5 border-2 border-secondary border-t-transparent rounded-full animate-spin" />
                <span className="text-white/60 text-xs">Getting GPS…</span>
              </div>
            </div>
          )}

          {/* GPS error */}
          {geo.error && !geo.loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm">
              <p className="text-white/50 text-xs text-center px-6">⚠️ {geo.error}</p>
            </div>
          )}

          {/* Location label */}
          <div className="absolute top-2.5 left-2.5 bg-black/70 backdrop-blur text-white text-[0.65rem] px-2.5 py-1.5 rounded-xl border border-white/10 max-w-[60%] truncate">
            📍 {locationLabel}
          </div>

          {/* Ghost mode toggle */}
          <button
            onClick={toggleGhost}
            className={`absolute top-2.5 right-2.5 px-2.5 py-1.5 rounded-xl text-[0.62rem] font-medium border transition-all ${
              ghostMode
                ? 'bg-purple/20 border-purple/30 text-purple'
                : 'bg-black/70 border-white/10 text-white/70'
            }`}
          >
            {ghostMode ? '👻 Ghost' : '👁 Visible'}
          </button>

          {/* Accuracy */}
          {geo.accuracy && (
            <div className="absolute bottom-2.5 left-2.5 bg-black/60 backdrop-blur text-white text-[0.55rem] px-2 py-1 rounded-lg border border-white/10">
              ±{Math.round(geo.accuracy)}m
            </div>
          )}
        </div>

        {/* Voice Chat */}
        <div className="flex justify-center my-1 mb-3.5">
          <div className="text-center">
            <div className="text-[0.62rem] text-muted-foreground uppercase tracking-[0.1em] mb-2 font-display">Voice Chat</div>
            <div className="relative inline-block">
              <button
                onClick={toggleVoice}
                className={`w-[70px] h-[70px] rounded-full border-2 flex items-center justify-center text-2xl transition-transform duration-200 hover:scale-[1.08] ${
                  voiceActive
                    ? "bg-gradient-to-br from-secondary to-secondary/80 border-secondary"
                    : "bg-gradient-to-br from-[hsl(220_50%_30%)] to-[hsl(220_60%_16%)] border-foreground/15"
                }`}
                style={voiceActive ? { animation: "voice-pulse 1.5s infinite" } : {}}
              >
                🎙
              </button>
              {voiceActive && (
                <span className="absolute -inset-2 rounded-full border-2 border-secondary/30" style={{ animation: "ring-expand 2s infinite" }} />
              )}
            </div>
            <div className={`text-[0.62rem] mt-1.5 ${voiceActive ? "text-secondary" : "text-muted-foreground"}`}>
              {voiceActive ? `🔴 Connected to ${nearbyDrivers} drivers` : "Tap to connect"}
            </div>
          </div>
        </div>

        {/* Quick Report */}
        <div className="glass-card">
          <div className="card-label">
            Quick Report
            <span className="text-success text-[0.62rem] flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-success inline-block" style={{ animation: "pulse-dot 2s infinite" }} />
              Tap to report
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2.5">
            {alertButtons.map((btn) => (
              <button
                key={btn.type}
                onClick={() => handleReport(btn.type)}
                className={`aspect-square rounded-[14px] flex flex-col items-center justify-center gap-1 bg-gradient-to-br ${btn.cls} shadow-lg text-xl active:scale-[0.93] transition-transform relative overflow-hidden`}
              >
                {btn.icon}
                <span className="text-[0.5rem] text-primary-foreground/80 uppercase tracking-wider font-display font-semibold">{btn.label}</span>
              </button>
            ))}
          </div>
          <div className="mt-2.5 px-3 py-2 bg-primary/[0.08] border border-primary/[0.18] rounded-[10px] text-[0.65rem] text-primary flex items-center gap-1.5">
            💡 Accurate reports help all drivers stay safe!
          </div>
        </div>

        {/* Driver Stats */}
        <div className="glass-card mt-3.5">
          <div className="card-label">
            Driver Stats
            <span className="text-success text-[0.62rem] flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-success inline-block" style={{ animation: "pulse-dot 2s infinite" }} />
              Live data
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            {[
              { icon: "📍", value: reportsToday, label: "Reports Today", change: "Keep reporting!", color: "text-success" },
              { icon: "👥", value: nearbyDrivers || "—", label: "Nearby Drivers", change: "Active now", color: "text-primary" },
              { icon: "📈", value: weeklyReports, label: "Weekly Reports", change: "This week", color: "text-secondary" },
              { icon: "🏅", value: rank, label: "Driver Rank", change: `Score: ${score}`, color: "text-warning" },
            ].map((stat, i) => (
              <div key={i} className="bg-foreground/[0.04] border border-foreground/[0.08] rounded-[14px] p-3 text-center hover:-translate-y-0.5 transition-transform cursor-pointer">
                <div className="text-lg mb-1">{stat.icon}</div>
                <div className={`font-display text-2xl font-bold ${stat.color}`}>{stat.value}</div>
                <div className="text-[0.6rem] text-muted-foreground uppercase tracking-wider mt-0.5">{stat.label}</div>
                <div className="text-[0.57rem] text-foreground/35 mt-1">{stat.change}</div>
              </div>
            ))}
          </div>
          <div className="mt-3 px-3 py-2.5 bg-primary/[0.06] border border-primary/15 rounded-xl">
            <div className="flex justify-between text-[0.62rem] text-primary mb-1.5">
              <span>Daily Goal Progress</span>
              <span>{reportsToday}/10</span>
            </div>
            <div className="h-1.5 bg-primary/20 rounded-full">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-primary to-secondary"
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>
        </div>

        {/* Live Activity */}
        <div className="glass-card mt-3.5">
          <div className="card-label">
            Live Activity
            <span className="text-success text-[0.62rem] flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-success inline-block" style={{ animation: "pulse-dot 2s infinite" }} />
              Live
            </span>
          </div>
          <div className="flex flex-col gap-2">
            {loading ? (
              <div className="text-center text-[0.72rem] text-muted-foreground py-4">Loading reports…</div>
            ) : recentReports.length === 0 ? (
              <div className="text-center text-[0.72rem] text-muted-foreground py-4">
                No reports in your area yet. Be the first to report!
              </div>
            ) : (
              recentReports.map((report) => (
                <motion.div
                  key={report.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-start gap-2.5 px-3 py-2.5 bg-foreground/[0.04] rounded-xl cursor-pointer hover:bg-foreground/[0.07] transition-colors"
                >
                  <span className="text-sm mt-0.5">{REPORT_ICONS[report.type] || "📍"}</span>
                  <div className="flex-1">
                    <div className="text-[0.72rem] text-foreground leading-snug capitalize">{report.type} reported nearby</div>
                    <div className="flex justify-between mt-1 text-[0.6rem] text-muted-foreground">
                      <span>{new Date(report.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      <span className="text-success">{report.confirmed_by} confirmations</span>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
