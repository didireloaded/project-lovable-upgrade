import { useState, useCallback, useRef, useEffect } from "react";

export type ViewTab = "home" | "dm" | "news" | "weather" | "help";

export interface ActivityItem {
  id: string;
  icon: string;
  color: string;
  message: string;
  time: string;
  location?: string;
}

export interface ToastData {
  message: string;
  type: "success" | "warn";
  id: number;
}

const initialActivities: ActivityItem[] = [
  { id: "1", icon: "📍", color: "success", message: "Speed camera reported on B1 Highway", time: "14:22", location: "Windhoek Central" },
  { id: "2", icon: "👥", color: "primary", message: "Sarah joined voice chat", time: "14:18" },
  { id: "3", icon: "⚡", color: "warning", message: "Traffic jam detected ahead", time: "14:15", location: "Independence Ave" },
];

export function useDriveLink() {
  const [activeView, setActiveView] = useState<ViewTab>("home");
  const [score, setScore] = useState(85);
  const [speed, setSpeed] = useState(54);
  const [reportsToday, setReportsToday] = useState(7);
  const [voiceActive, setVoiceActive] = useState(false);
  const [toast, setToast] = useState<ToastData | null>(null);
  const [activities, setActivities] = useState<ActivityItem[]>(initialActivities);
  const [hasDmNotif, setHasDmNotif] = useState(false);
  const toastCounter = useRef(0);

  // Speed simulation
  useEffect(() => {
    const interval = setInterval(() => {
      setSpeed((prev) => Math.max(25, Math.min(85, Math.round(prev + (Math.random() - 0.5) * 10))));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // DM notification
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (activeView !== "dm") setHasDmNotif(true);
    }, 8000);
    return () => clearTimeout(timeout);
  }, []);

  const showToast = useCallback((message: string, type: "success" | "warn" = "success") => {
    const id = ++toastCounter.current;
    setToast({ message, type, id });
    setTimeout(() => setToast((prev) => (prev?.id === id ? null : prev)), 2500);
  }, []);

  const switchView = useCallback((view: ViewTab) => {
    setActiveView(view);
    if (view === "dm") setHasDmNotif(false);
  }, []);

  const reportAlert = useCallback((type: string) => {
    setScore((s) => s + 2);
    setReportsToday((r) => r + 1);

    const msgs: Record<string, string> = {
      Police: "Police presence reported! +2 pts",
      Accident: "Accident reported! +2 pts",
      Hazard: "Road hazard reported! +2 pts",
      Traffic: "Traffic jam reported! +2 pts",
      Pothole: "📸 Photo captured! Pothole auto-detected.",
    };
    showToast(msgs[type] || `${type} reported! +2 pts`);
    setTimeout(() => showToast("✓ Confirmed by nearby drivers!"), 2600);

    const actTypes: Record<string, { icon: string; color: string; msg: string }> = {
      Police: { icon: "📍", color: "success", msg: "Police spotted on your route" },
      Accident: { icon: "⚡", color: "warning", msg: "Accident reported nearby" },
      Hazard: { icon: "⚠️", color: "warning", msg: "Road hazard flagged" },
      Traffic: { icon: "🚦", color: "primary", msg: "Traffic congestion reported" },
    };
    const a = actTypes[type];
    if (a) {
      const now = new Date().toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit" });
      setActivities((prev) => [{ id: Date.now().toString(), icon: a.icon, color: a.color, message: a.msg, time: now, location: "Near you" }, ...prev].slice(0, 4));
    }
  }, [showToast]);

  const toggleVoice = useCallback(() => {
    setVoiceActive((prev) => {
      const next = !prev;
      showToast(next ? "🎙 Connected to nearby drivers!" : "🔕 Disconnected from voice chat", next ? "success" : "warn");
      return next;
    });
  }, [showToast]);

  const activateSOS = useCallback(() => {
    showToast("SOS activated! Emergency services notified.", "warn");
  }, [showToast]);

  const speedStatus: "danger" | "warn" | "safe" = speed > 75 ? "danger" : speed > 65 ? "warn" : "safe";

  return {
    activeView, switchView,
    score, speed, speedStatus, reportsToday,
    voiceActive, toggleVoice,
    toast, showToast,
    activities,
    hasDmNotif,
    reportAlert, activateSOS,
  };
}
