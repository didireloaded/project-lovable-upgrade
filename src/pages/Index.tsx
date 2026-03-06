import { useStore } from "@/store";
import { useProfile } from "@/hooks/useProfile";
import { useAuth } from "@/hooks/useAuth";
import { useGeo } from "@/contexts/GeoContext";
import { usePresence } from "@/hooks/usePresence";
import { useOfflineSync } from "@/hooks/useOfflineSync";
import { useVoiceRoom } from "@/hooks/useVoiceRoom";
import { getSpeedLimit } from "@/lib/speedLimit";
import { BottomNav } from "@/components/drivelink/BottomNav";
import { DesktopSidebar } from "@/components/drivelink/DesktopSidebar";
import { DriveToast } from "@/components/drivelink/Toast";
import { ReportAlertOverlay } from "@/components/drivelink/ReportAlertOverlay";
import { PersistentVoiceBar } from "@/components/drivelink/PersistentVoiceBar";
import { HomeView } from "@/components/drivelink/HomeView";
import { MessagesView } from "@/components/drivelink/MessagesView";
import { NewsView } from "@/components/drivelink/NewsView";
import { WeatherView } from "@/components/drivelink/WeatherView";
import { HelpView } from "@/components/drivelink/HelpView";
import { ProfileView } from "@/components/drivelink/ProfileView";
import { useEffect } from "react";

const Index = () => {
  const activeView = useStore((s) => s.currentView);
  const { signOut } = useAuth();

  const geo = useGeo();
  useProfile();
  usePresence();
  const { isOnline, pending } = useOfflineSync();
  const voiceRoom = useVoiceRoom();

  useEffect(() => {
    if (!geo.lat || !geo.lng) return;
    getSpeedLimit(geo.lat, geo.lng).then((limit) => {
      useStore.getState().updateSpeedLimit(limit);
    });
  }, [
    geo.lat ? Math.round(geo.lat * 200) : null,
    geo.lng ? Math.round(geo.lng * 200) : null,
  ]);

  return (
    <div className="flex w-full h-[100dvh] bg-background overflow-hidden">
      {/* Desktop sidebar — hidden on mobile */}
      <DesktopSidebar />

      {/* Main content area */}
      <div className="flex-1 flex flex-col h-[100dvh] relative overflow-hidden">
        <DriveToast />
        <ReportAlertOverlay />
        <PersistentVoiceBar />

        {!isOnline && (
          <div className="bg-warning/20 border-b border-warning/30 text-warning text-[0.65rem] text-center py-1.5 px-3 font-medium flex-shrink-0">
            📴 Offline{pending > 0 ? ` — ${pending} report${pending > 1 ? 's' : ''} queued` : ''}
          </div>
        )}

        <div className="flex-1 overflow-hidden flex flex-col relative">
          {activeView === "home" && <HomeView />}
          {activeView === "dm" && <MessagesView />}
          {activeView === "news" && <NewsView />}
          {activeView === "weather" && <WeatherView />}
          {activeView === "help" && <HelpView />}
          {activeView === "profile" && <ProfileView />}
        </div>

        {/* Bottom nav — mobile only */}
        <div className="md:hidden">
          <BottomNav />
        </div>
      </div>
    </div>
  );
};

export default Index;
