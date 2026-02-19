import { useState } from "react";

interface Props {
  onSOS: () => void;
  onShowToast: (msg: string, type?: "success" | "warn") => void;
}

const aiAnswers = [
  "The speed limit on B1 Highway is 120 km/h. Your current section allows overtaking.",
  "Based on current reports, the fastest route to Gobabis avoids the B6 roadblock — take Sam Nujoma Drive instead.",
  "Windhoek traffic law requires daytime running lights outside urban zones. You're compliant!",
  "Current road conditions: mostly clear, light rain forecast at 17:00. Recommended: reduce speed by 20%.",
];

export function HelpView({ onSOS, onShowToast }: Props) {
  const [aiInput, setAiInput] = useState("");
  const [aiResp, setAiResp] = useState<string | null>(null);
  const [thinking, setThinking] = useState(false);

  const sendAI = () => {
    if (!aiInput.trim()) return;
    setAiInput("");
    setThinking(true);
    setAiResp("Thinking…");
    setTimeout(() => {
      setAiResp(aiAnswers[Math.floor(Math.random() * aiAnswers.length)]);
      setThinking(false);
    }, 800);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-10 pb-3 flex-shrink-0 bg-gradient-to-b from-background to-transparent">
        <h2 className="font-display text-[1.4rem] font-bold tracking-[0.08em] uppercase text-primary-foreground">Help Me</h2>
        <p className="text-[0.72rem] text-muted-foreground mt-0.5">Get roadside assistance fast</p>
      </div>
      <div className="flex-1 overflow-y-auto px-4 pb-20 hide-scrollbar">
        {/* SOS */}
        <div className="glass-card !bg-destructive/[0.08] !border-destructive/25">
          <div className="text-center py-1.5">
            <div className="text-3xl mb-2">🆘</div>
            <div className="font-display text-base font-bold text-destructive uppercase tracking-[0.1em]">Emergency SOS</div>
            <div className="text-[0.7rem] text-muted-foreground my-1.5 mb-3">Sends your location to emergency services</div>
            <button
              onClick={onSOS}
              className="w-full bg-gradient-to-br from-destructive to-destructive/70 border-none rounded-xl py-3 font-display text-base font-bold text-primary-foreground tracking-[0.1em] uppercase cursor-pointer"
            >
              ACTIVATE SOS
            </button>
          </div>
        </div>

        {/* Quick Help */}
        <div className="glass-card mt-3.5">
          <div className="card-label">Quick Help</div>
          <div className="grid grid-cols-2 gap-2.5">
            {[
              { icon: "🔧", title: "Breakdown", sub: "Alert nearby drivers", msg: "Breakdown reported – nearby drivers alerted" },
              { icon: "🛞", title: "Flat Tyre", sub: "Share location", msg: "Flat tyre – location shared" },
              { icon: "⛽", title: "Out of Fuel", sub: "Find nearby station", msg: "Fuel request sent to group" },
              { icon: "🏥", title: "Medical", sub: "Request ambulance", msg: "Medical alert sent – ambulance notified" },
            ].map((item, i) => (
              <button
                key={i}
                onClick={() => onShowToast(item.msg)}
                className="bg-foreground/[0.04] border border-foreground/[0.07] rounded-[14px] p-3.5 cursor-pointer hover:-translate-y-0.5 hover:bg-foreground/[0.07] transition-all text-center"
              >
                <div className="text-2xl mb-2">{item.icon}</div>
                <div className="text-[0.72rem] text-foreground font-medium">{item.title}</div>
                <div className="text-[0.6rem] text-muted-foreground mt-0.5">{item.sub}</div>
              </button>
            ))}
          </div>
        </div>

        {/* AI Assistant */}
        <div className="glass-card mt-3.5">
          <div className="card-label">AI Assistant</div>
          <div className="flex flex-col gap-2">
            <div className="p-2.5 bg-secondary/[0.07] border border-secondary/[0.18] rounded-xl text-[0.72rem] text-secondary leading-relaxed">
              💬 Ask me anything about traffic laws, route suggestions, or vehicle issues.
            </div>
            <div className="flex gap-2">
              <input
                value={aiInput}
                onChange={(e) => setAiInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendAI()}
                className="flex-1 bg-foreground/[0.06] border border-foreground/[0.12] rounded-[10px] px-3 py-2 text-[0.72rem] text-foreground outline-none font-body placeholder:text-muted-foreground"
                placeholder="Ask a question…"
              />
              <button
                onClick={sendAI}
                className="bg-secondary border-none rounded-[10px] px-3.5 py-2 cursor-pointer text-[0.75rem] text-secondary-foreground font-semibold font-body"
              >
                →
              </button>
            </div>
            {aiResp && (
              <div className={`text-[0.7rem] p-2 ${thinking ? "text-muted-foreground italic" : "text-secondary"}`}>
                {aiResp}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
