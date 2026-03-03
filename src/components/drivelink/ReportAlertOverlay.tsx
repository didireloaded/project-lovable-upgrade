import { AnimatePresence, motion } from 'framer-motion'
import { useReportAlerts } from '@/hooks/useReportAlerts'
import { NotificationCard } from '@/components/ui/notification-card'

export function ReportAlertOverlay() {
  const { alert, dismiss, REPORT_LABELS } = useReportAlerts()

  return (
    <AnimatePresence>
      {alert && (
        <motion.div
          key={alert.id}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="absolute top-10 left-3 right-3 md:left-auto md:right-6 md:w-96 z-[150]"
        >
          <NotificationCard
            title="Nearby Alert"
            avatarSrc={alert.avatar_url ?? ''}
            avatarFallback={alert.display_name?.charAt(0)?.toUpperCase() ?? 'D'}
            isOnline
            userName={alert.display_name ?? 'Driver'}
            userRole="Nearby Driver"
            message={REPORT_LABELS[alert.type] ?? `${alert.type} reported nearby`}
            timestamp={new Date(alert.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            readStatus="Unread"
            onReply={dismiss}
            className="shadow-2xl"
          />
        </motion.div>
      )}
    </AnimatePresence>
  )
}
