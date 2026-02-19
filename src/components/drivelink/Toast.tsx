import { type ToastData } from "@/hooks/useDriveLink";
import { AnimatePresence, motion } from "framer-motion";

export function DriveToast({ toast }: { toast: ToastData | null }) {
  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          key={toast.id}
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          className={`absolute top-11 left-4 right-4 z-[200] rounded-xl px-3.5 py-2.5 text-xs flex items-center gap-2 ${
            toast.type === "warn"
              ? "bg-warning/15 border border-warning/35 text-warning"
              : "bg-success/15 border border-success/35 text-success"
          }`}
        >
          {toast.type === "warn" ? "⚠️" : "✓"} {toast.message}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
