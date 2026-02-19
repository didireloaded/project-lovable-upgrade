interface Props {
  onShowToast: (msg: string, type?: "success" | "warn") => void;
}

const channels = [
  { name: "Windhoek Drivers", msg: "Alex: Roadblock on B6, avoid!", icon: "🗺", gradient: "from-primary to-primary/70", time: "2m", badge: 3, online: true },
  { name: "Sarah M.", msg: "Thanks for the heads up!", icon: "🚗", gradient: "from-success to-success/70", time: "12m", online: true },
  { name: "Traffic Updates Bot", msg: "Heavy traffic on Independence Ave", icon: "🚦", gradient: "from-warning to-warning/70", time: "1h", badge: 1 },
  { name: "Police Scanner", msg: "All clear on B1 highway", icon: "👮", gradient: "from-purple to-purple/70", time: "2h", online: true },
];

export function MessagesView({ onShowToast }: Props) {
  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-10 pb-3 flex-shrink-0 bg-gradient-to-b from-background to-transparent">
        <h2 className="font-display text-[1.4rem] font-bold tracking-[0.08em] uppercase text-primary-foreground">Messages</h2>
        <p className="text-[0.72rem] text-muted-foreground mt-0.5">Connect with nearby drivers</p>
      </div>
      <div className="flex-1 overflow-y-auto px-4 pb-20 hide-scrollbar">
        <div className="glass-card">
          <div className="card-label">
            Active Channels
            <span className="text-success text-[0.62rem] flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-success inline-block" style={{ animation: "pulse-dot 2s infinite" }} />
              3 online
            </span>
          </div>
          <div className="flex flex-col gap-0.5">
            {channels.map((ch, i) => (
              <div key={i} className="flex items-center gap-3 px-3.5 py-2.5 rounded-[14px] cursor-pointer hover:bg-foreground/[0.06] transition-colors">
                <div className={`w-[42px] h-[42px] rounded-full bg-gradient-to-br ${ch.gradient} flex items-center justify-center text-lg flex-shrink-0 relative`}>
                  {ch.icon}
                  {ch.online && <span className="absolute bottom-0.5 right-0.5 w-2 h-2 rounded-full bg-success border-[1.5px] border-background" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[0.82rem] text-foreground font-medium">{ch.name}</div>
                  <div className="text-[0.68rem] text-muted-foreground mt-0.5 truncate">{ch.msg}</div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <div className="text-[0.6rem] text-muted-foreground">{ch.time}</div>
                  {ch.badge && (
                    <div className="bg-primary text-primary-foreground rounded-full w-[18px] h-[18px] text-[0.6rem] flex items-center justify-center">{ch.badge}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card mt-3.5">
          <div className="card-label">Voice Rooms</div>
          <div className="flex flex-col gap-2">
            {[
              { name: "Windhoek Central", listeners: 4, live: true, color: "success" },
              { name: "Khomasdal Route", listeners: 2, live: false, color: "primary" },
            ].map((room, i) => (
              <div key={i} className={`flex items-center justify-between p-2.5 rounded-xl border ${
                room.color === "success" ? "bg-success/[0.08] border-success/20" : "bg-primary/[0.08] border-primary/20"
              }`}>
                <div>
                  <div className={`text-[0.75rem] font-medium ${room.color === "success" ? "text-success" : "text-primary"}`}>🎙 {room.name}</div>
                  <div className="text-[0.62rem] text-muted-foreground mt-0.5">{room.listeners} listeners{room.live ? " · Live" : ""}</div>
                </div>
                <button
                  onClick={() => onShowToast("Joined voice chat")}
                  className={`rounded-lg px-3 py-1 text-[0.65rem] border-none cursor-pointer font-body ${
                    room.color === "success" ? "bg-success/20 text-success" : "bg-primary/20 text-primary"
                  }`}
                >
                  Join
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
