import { type ActivityItem } from "@/hooks/useDriveLink";
import { motion } from "framer-motion";

interface Props {
  score: number;
  speed: number;
  speedStatus: "safe" | "warn" | "danger";
  reportsToday: number;
  voiceActive: boolean;
  onToggleVoice: () => void;
  onReport: (type: string) => void;
  activities: ActivityItem[];
}

const alertButtons = [
  { type: "Police", icon: "🚔", cls: "from-destructive to-destructive/70 shadow-destructive/30" },
  { type: "Accident", icon: "🚗", cls: "from-warning to-warning/70 shadow-warning/30" },
  { type: "Hazard", icon: "⚠️", cls: "from-warning to-warning/60 shadow-warning/25" },
  { type: "Traffic", icon: "🚦", cls: "from-primary to-primary/70 shadow-primary/30" },
  { type: "Pothole", icon: "🕳️", cls: "from-purple to-purple/70 shadow-purple/30" },
];

export function HomeView({ score, speed, speedStatus, reportsToday, voiceActive, onToggleVoice, onReport, activities }: Props) {
  const speedClass = speedStatus === "danger" ? "speed-danger" : speedStatus === "warn" ? "speed-warn" : "speed-safe";
  const progress = Math.min((reportsToday / 10) * 100, 100);

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
              <div className="text-[0.62rem] text-primary-foreground/80 tracking-[0.1em] mt-0.5">MPH</div>
            </div>
          </div>
          <div className="text-center flex-1">
            <div className="font-display text-2xl font-bold text-primary-foreground leading-none">65</div>
            <div className="text-[0.62rem] text-foreground/60 tracking-[0.1em] mt-0.5">LIMIT</div>
          </div>
        </div>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-20 hide-scrollbar">
        {/* Map */}
        <div className="h-40 rounded-[14px] bg-gradient-to-br from-[hsl(216_50%_16%)] to-[hsl(216_60%_10%)] relative overflow-hidden mb-3.5">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Cpath d='M0 20 L100 20 M0 40 L100 40 M0 60 L100 60 M0 80 L100 80 M20 0 L20 100 M40 0 L40 100 M60 0 L60 100 M80 0 L80 100' stroke='rgba(59,127,245,0.12)' stroke-width='1'/%3E%3C/svg%3E")`,
            backgroundSize: "50px 50px"
          }} />
          <svg className="absolute inset-0 w-full h-full opacity-40" viewBox="0 0 375 160" preserveAspectRatio="none">
            <path d="M0 80 Q80 60 140 80 T280 70 T375 80" stroke="hsl(219 90% 59% / 0.4)" strokeWidth="3" fill="none" />
            <path d="M0 100 Q90 90 160 110 T320 95 T375 105" stroke="hsl(168 100% 45% / 0.25)" strokeWidth="2" fill="none" />
            <path d="M200 0 L180 80 L210 160" stroke="hsl(219 90% 59% / 0.25)" strokeWidth="2" fill="none" strokeDasharray="6 4" />
          </svg>
          <div className="absolute top-1/2 left-1/2 w-[22px] h-[22px] bg-primary rounded-[50%_50%_50%_0] -translate-x-1/2 -translate-y-1/2 rotate-[-45deg]" style={{ animation: "ping-map 2s infinite" }} />
          <div className="absolute top-[60%] left-[20%] w-[60%] h-0.5 bg-gradient-to-r from-transparent via-secondary to-transparent rounded-sm" />
          <div className="absolute top-2.5 right-2.5 bg-background/60 border border-panel-border rounded-lg px-2.5 py-1 text-[0.65rem] text-secondary font-display tracking-wider">
            📍 Windhoek, NA
          </div>
        </div>

        {/* Voice Chat */}
        <div className="flex justify-center my-1 mb-3.5">
          <div className="text-center">
            <div className="text-[0.62rem] text-muted-foreground uppercase tracking-[0.1em] mb-2 font-display">Voice Chat</div>
            <div className="relative inline-block">
              <button
                onClick={onToggleVoice}
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
              {voiceActive ? "🔴 Connected to 3 drivers" : "Tap to connect"}
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
                onClick={() => onReport(btn.type)}
                className={`aspect-square rounded-[14px] flex flex-col items-center justify-center gap-1 bg-gradient-to-br ${btn.cls} shadow-lg text-xl active:scale-[0.93] transition-transform relative overflow-hidden`}
              >
                {btn.icon}
                <span className="text-[0.5rem] text-primary-foreground/80 uppercase tracking-wider font-display font-semibold">{btn.type}</span>
              </button>
            ))}
          </div>
          <div className="mt-2.5 px-3 py-2 bg-primary/8 border border-primary/18 rounded-[10px] text-[0.65rem] text-primary flex items-center gap-1.5">
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
              { icon: "📍", value: reportsToday, label: "Reports Today", change: "+3 from yesterday", color: "text-success" },
              { icon: "👥", value: "3", label: "Nearby Drivers", change: "Active now", color: "text-primary" },
              { icon: "📈", value: "42", label: "Weekly Reports", change: "+15 this week", color: "text-secondary" },
              { icon: "🏅", value: "Silver", label: "Driver Rank", change: "Top 15%", color: "text-warning" },
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
            {activities.map((act) => (
              <motion.div
                key={act.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-2.5 px-3 py-2.5 bg-foreground/[0.04] rounded-xl cursor-pointer hover:bg-foreground/[0.07] transition-colors"
              >
                <span className={`text-sm mt-0.5 ${act.color === "success" ? "text-success" : act.color === "warning" ? "text-warning" : "text-primary"}`}>{act.icon}</span>
                <div className="flex-1">
                  <div className="text-[0.72rem] text-foreground leading-snug">{act.message}</div>
                  <div className="flex justify-between mt-1 text-[0.6rem] text-muted-foreground">
                    <span>{act.time}</span>
                    {act.location && <span>📍 {act.location}</span>}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
