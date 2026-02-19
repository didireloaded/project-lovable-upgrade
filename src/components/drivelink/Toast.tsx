import { useStore } from "@/store";
import { AnimatePresence, motion } from "framer-motion";

export function DriveToast() {
  const notification = useStore((s) => s.notification);

  return (
    <AnimatePresence>
      {notification && (
        <motion.div
          key={notification.id}
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          className={`absolute top-11 left-4 right-4 z-[200] rounded-xl px-3.5 py-2.5 text-xs flex items-center gap-2 ${
            notification.type === "warning" || notification.type === "error"
              ? "bg-warning/15 border border-warning/35 text-warning"
              : "bg-success/15 border border-success/35 text-success"
          }`}
        >
          {notification.type === "warning" || notification.type === "error" ? "⚠️" : "✓"} {notification.message}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
