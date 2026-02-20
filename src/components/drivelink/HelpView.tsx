import { useState, useCallback, useEffect } from "react";
import { useStore } from "@/store";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useGeolocation } from "@/hooks/useGeolocation";
import { AIChat } from "./AIChat";

export function HelpView() {
  const showNotification = useStore((s) => s.showNotification);
  const { user } = useAuth();
  const geo = useGeolocation();
  const [sosStep, setSosStep] = useState<'idle' | 'confirm' | 'sent'>('idle');
  const [activeSOS, setActiveSOS] = useState<any>(null);

  // Listen for incoming SOS alerts from other drivers
  useEffect(() => {
    const channel = supabase
      .channel('sos-alerts')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'sos_events' },
        async (payload) => {
          const sos = payload.new as any;
          if (sos.user_id === user?.id) return; // Skip own SOS

          const { data: profile } = await supabase
            .from('profiles')
            .select('display_name, avatar_url')
            .eq('user_id', sos.user_id)
            .single();

          setActiveSOS({ ...sos, profile });
          showNotification(
            `🆘 ${profile?.display_name ?? 'A driver'} needs emergency help!`,
            'error'
          );
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [showNotification, user?.id]);

  const handleSOS = useCallback(async () => {
    if (sosStep === 'idle') {
      setSosStep('confirm');
      return;
    }

    setSosStep('sent');

    if (user) {
      await supabase.from('sos_events').insert({
        lat: geo.lat ?? -22.5609,
        lng: geo.lng ?? 17.0836,
        message: 'Emergency SOS activated',
      } as any);
    }

    showNotification('SOS sent to all nearby drivers!', 'error');
    setTimeout(() => setSosStep('idle'), 10000);
  }, [sosStep, user, geo.lat, geo.lng, showNotification]);

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-10 pb-3 flex-shrink-0 bg-gradient-to-b from-background to-transparent">
        <h2 className="font-display text-[1.4rem] font-bold tracking-[0.08em] uppercase text-primary-foreground">Help Me</h2>
        <p className="text-[0.72rem] text-muted-foreground mt-0.5">Get roadside assistance fast</p>
      </div>
      <div className="flex-1 overflow-y-auto px-4 pb-20 hide-scrollbar">

        {/* Active SOS from other driver */}
        {activeSOS && (
          <div className="glass-card !bg-destructive/10 !border-destructive/30 mb-3.5">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🆘</span>
              <div className="flex-1">
                <div className="text-sm font-semibold text-destructive">
                  {activeSOS.profile?.display_name ?? 'A driver'} needs help!
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {new Date(activeSOS.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
              <button
                onClick={() => setActiveSOS(null)}
                className="text-muted-foreground text-xs underline bg-transparent border-none cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* SOS - Double confirm */}
        <div className="glass-card !bg-destructive/[0.08] !border-destructive/25">
          {sosStep === 'sent' ? (
            <div className="text-center py-4">
              <div className="text-3xl mb-2 animate-pulse">📡</div>
              <p className="font-display text-sm font-semibold text-destructive">SOS Sent to All Drivers</p>
              <p className="text-muted-foreground text-xs mt-1">Help is on the way. Stay calm and visible.</p>
            </div>
          ) : (
            <div className="text-center py-1.5">
              <div className="text-3xl mb-2">🆘</div>
              <div className="font-display text-base font-bold text-destructive uppercase tracking-[0.1em]">Emergency SOS</div>
              <div className="text-[0.7rem] text-muted-foreground my-1.5 mb-3">
                Alerts all nearby drivers + sends your location
              </div>
              <button
                onClick={handleSOS}
                className={`w-full bg-gradient-to-br border-none rounded-xl py-3 font-display text-base font-bold text-primary-foreground tracking-[0.1em] uppercase cursor-pointer transition-all ${
                  sosStep === 'confirm'
                    ? 'from-destructive to-destructive animate-pulse'
                    : 'from-destructive to-destructive/70'
                }`}
              >
                {sosStep === 'confirm' ? '⚠️ TAP AGAIN TO CONFIRM' : 'ACTIVATE SOS'}
              </button>
              {sosStep === 'confirm' && (
                <button onClick={() => setSosStep('idle')} className="text-muted-foreground text-xs mt-2 underline bg-transparent border-none cursor-pointer">
                  Cancel
                </button>
              )}
            </div>
          )}
        </div>

        {/* Quick Help */}
        <div className="glass-card mt-3.5">
          <div className="card-label">Quick Help</div>
          <div className="grid grid-cols-2 gap-2.5">
            {[
              { icon: "🔧", title: "Breakdown", sub: "Alert nearby drivers", msg: "Breakdown reported — nearby drivers alerted", type: "breakdown" },
              { icon: "🛞", title: "Flat Tyre", sub: "Share location", msg: "Flat tyre — location shared with nearby drivers", type: "flat_tyre" },
              { icon: "⛽", title: "Out of Fuel", sub: "Find nearby station", msg: "Fuel request sent to nearby drivers", type: "fuel" },
              { icon: "🏥", title: "Medical", sub: "Request ambulance", msg: "Medical emergency — alerting all drivers", type: "medical" },
            ].map((item) => (
              <button
                key={item.type}
                onClick={async () => {
                  showNotification(item.msg, 'success');
                  if (user) {
                    await supabase.from('sos_events').insert({
                      lat: geo.lat ?? -22.5609,
                      lng: geo.lng ?? 17.0836,
                      message: item.msg,
                    } as any);
                  }
                }}
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
        <AIChat />
      </div>
    </div>
  );
}
