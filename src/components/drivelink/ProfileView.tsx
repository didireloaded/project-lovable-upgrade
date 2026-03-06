import { useAuth } from "@/hooks/useAuth";
import { useStore } from "@/store";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { User, Shield, Lock, Bell, Volume2, Eye, EyeOff, LogOut, ChevronRight, Ghost } from "lucide-react";

export function ProfileView() {
  const { user, signOut } = useAuth();
  const score = useStore((s) => s.score);
  const rank = useStore((s) => s.rank);
  const ghostMode = useStore((s) => s.ghostMode);
  const toggleGhost = useStore((s) => s.toggleGhostMode);
  const weeklyReports = useStore((s) => s.weeklyReports);
  const totalMiles = useStore((s) => s.totalMiles);

  const [profile, setProfile] = useState<{ display_name: string | null; avatar_url: string | null } | null>(null);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState("");

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("display_name, avatar_url").eq("user_id", user.id).single()
      .then(({ data }) => {
        if (data) {
          setProfile(data);
          setNameInput(data.display_name ?? "");
        }
      });
  }, [user]);

  const saveName = async () => {
    if (!user || !nameInput.trim()) return;
    await supabase.from("profiles").update({ display_name: nameInput.trim() }).eq("user_id", user.id);
    setProfile((p) => p ? { ...p, display_name: nameInput.trim() } : p);
    setEditingName(false);
  };

  const displayName = profile?.display_name || user?.email?.split("@")[0] || "Driver";
  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex-shrink-0 pt-8 pb-6 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/15 via-primary/5 to-transparent" />
        <div className="relative z-10">
          <h2 className="font-display text-sm font-semibold tracking-[0.16em] uppercase text-primary mb-6">Profile</h2>

          {/* Avatar */}
          <div className="relative w-24 h-24 mx-auto mb-4">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary/30 to-secondary/30 border-2 border-primary/30 flex items-center justify-center overflow-hidden">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} className="w-full h-full object-cover" alt="" />
              ) : (
                <span className="font-display text-2xl font-bold text-primary-foreground">{initials}</span>
              )}
            </div>
            <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-primary flex items-center justify-center shadow-lg">
              <span className="text-xs text-primary-foreground">✏️</span>
            </div>
          </div>

          {/* Name */}
          {editingName ? (
            <div className="flex items-center justify-center gap-2 px-8">
              <input
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && saveName()}
                className="bg-foreground/10 border border-foreground/15 rounded-xl px-3 py-1.5 text-sm text-foreground text-center outline-none w-40"
                autoFocus
              />
              <button onClick={saveName} className="text-xs text-primary bg-transparent border-none cursor-pointer">Save</button>
              <button onClick={() => setEditingName(false)} className="text-xs text-muted-foreground bg-transparent border-none cursor-pointer">✕</button>
            </div>
          ) : (
            <button onClick={() => setEditingName(true)} className="bg-transparent border-none cursor-pointer">
              <div className="font-display text-xl font-bold text-foreground">{displayName}</div>
              <div className="text-[0.7rem] text-muted-foreground mt-0.5">@{user?.email?.split("@")[0] ?? "driver"}</div>
            </button>
          )}

          {/* Rank badge */}
          <div className="flex items-center justify-center gap-2 mt-3">
            <span className="px-3 py-1 rounded-full bg-secondary/15 border border-secondary/25 text-[0.65rem] text-secondary font-display font-semibold uppercase tracking-wider">
              🏅 {rank} · {score} pts
            </span>
          </div>
        </div>
      </div>

      {/* Scrollable settings */}
      <div className="flex-1 overflow-y-auto px-4 md:px-6 lg:px-8 pb-24 md:pb-6 hide-scrollbar">
        <div className="max-w-lg mx-auto space-y-5">
          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { value: score, label: "Total Score" },
              { value: weeklyReports, label: "Weekly Reports" },
              { value: `${totalMiles}`, label: "Miles Driven" },
            ].map((s, i) => (
              <div key={i} className="glass-card text-center !p-3">
                <div className="font-display text-lg font-bold text-primary">{s.value}</div>
                <div className="text-[0.55rem] text-muted-foreground uppercase tracking-wider mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Account section */}
          <div>
            <h3 className="font-display text-[0.72rem] font-semibold tracking-[0.14em] uppercase text-foreground mb-2">Account</h3>
            <div className="glass-card !p-0 divide-y divide-foreground/[0.06]">
              <SettingsRow icon={<User size={16} />} label="Profile & Accounts" />
              <SettingsRow icon={<Shield size={16} />} label="Security" />
              <SettingsRow icon={<Lock size={16} />} label="Password" />
            </div>
          </div>

          {/* Personalization */}
          <div>
            <h3 className="font-display text-[0.72rem] font-semibold tracking-[0.14em] uppercase text-foreground mb-2">Personalization</h3>
            <div className="glass-card !p-0 divide-y divide-foreground/[0.06]">
              <div className="flex items-center justify-between px-4 py-3.5">
                <div className="flex items-center gap-3">
                  <Ghost size={16} className="text-purple" />
                  <span className="text-sm text-foreground">Ghost Mode</span>
                </div>
                <button
                  onClick={toggleGhost}
                  className={`w-11 h-6 rounded-full relative transition-colors cursor-pointer border-none ${
                    ghostMode ? "bg-secondary" : "bg-foreground/15"
                  }`}
                >
                  <motion.div
                    className="w-5 h-5 rounded-full bg-white shadow-md absolute top-0.5"
                    animate={{ left: ghostMode ? 22 : 2 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                </button>
              </div>
              <div className="flex items-center justify-between px-4 py-3.5">
                <div className="flex items-center gap-3">
                  {ghostMode ? <EyeOff size={16} className="text-muted-foreground" /> : <Eye size={16} className="text-success" />}
                  <span className="text-sm text-foreground">Visibility</span>
                </div>
                <span className={`text-[0.7rem] ${ghostMode ? "text-purple" : "text-success"}`}>
                  {ghostMode ? "Hidden" : "Visible to all"}
                </span>
              </div>
            </div>
          </div>

          {/* Notifications */}
          <div>
            <h3 className="font-display text-[0.72rem] font-semibold tracking-[0.14em] uppercase text-foreground mb-2">Notifications & Activity</h3>
            <div className="glass-card !p-0 divide-y divide-foreground/[0.06]">
              <SettingsRow icon={<Bell size={16} />} label="Notifications" />
              <SettingsRow icon={<Volume2 size={16} />} label="Sound" />
            </div>
          </div>

          {/* Sign out */}
          <button
            onClick={signOut}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive text-sm font-semibold cursor-pointer hover:bg-destructive/15 transition-colors"
          >
            <LogOut size={16} />
            Log out
          </button>
        </div>
      </div>
    </div>
  );
}

function SettingsRow({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <button className="w-full flex items-center justify-between px-4 py-3.5 bg-transparent border-none cursor-pointer hover:bg-foreground/[0.03] transition-colors">
      <div className="flex items-center gap-3">
        <span className="text-muted-foreground">{icon}</span>
        <span className="text-sm text-foreground">{label}</span>
      </div>
      <ChevronRight size={14} className="text-muted-foreground" />
    </button>
  );
}
