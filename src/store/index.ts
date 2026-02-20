import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'

export type ReportType = 'police' | 'accident' | 'hazard' | 'traffic' | 'pothole'
export type ViewType = 'home' | 'dm' | 'news' | 'weather' | 'help'
export type Rank = 'Bronze' | 'Silver' | 'Gold' | 'Platinum'

export interface AppNotification {
  id: string
  message: string
  type: 'success' | 'warning' | 'error'
}

interface DriveState {
  // User
  score: number
  rank: Rank
  userId: string | null

  // Session
  currentSpeed: number
  speedLimit: number
  isSessionActive: boolean

  // Location
  ghostMode: boolean
  currentStreet: string | null
  currentCity: string | null

  // Stats
  reportsToday: number
  weeklyReports: number
  totalMiles: number
  nearbyDrivers: number

  // UI
  currentView: ViewType
  notification: AppNotification | null
  hasDmNotif: boolean

  // Actions
  setView: (view: ViewType) => void
  addReport: (type: ReportType) => void
  updateSpeed: (speed: number) => void
  updateSpeedLimit: (limit: number) => void
  setNearbyDrivers: (n: number) => void
  setUserId: (id: string | null) => void
  showNotification: (msg: string, type: AppNotification['type']) => void
  clearNotification: () => void
  setHasDmNotif: (v: boolean) => void
  setScore: (score: number) => void
  setRank: (rank: Rank) => void
  setReportsToday: (n: number) => void
  setWeeklyReports: (n: number) => void
  toggleGhostMode: () => void
  setLocation: (street: string | null, city: string | null) => void
}

const POINTS: Record<ReportType, number> = {
  police: 2, accident: 2, hazard: 2, traffic: 2,
  pothole: 3,
}

const getRank = (score: number): Rank => {
  if (score >= 500) return 'Platinum'
  if (score >= 200) return 'Gold'
  if (score >= 100) return 'Silver'
  return 'Bronze'
}

export const useStore = create<DriveState>()(
  devtools(
    persist(
      (set, get) => ({
        score: 0, rank: 'Bronze', userId: null,
        currentSpeed: 0, speedLimit: 60,
        isSessionActive: false,
        ghostMode: false,
        currentStreet: null, currentCity: null,
        reportsToday: 0, weeklyReports: 0,
        totalMiles: 0, nearbyDrivers: 0,
        currentView: 'home', notification: null,
        hasDmNotif: false,

        setView: (view) => {
          set({ currentView: view })
          if (view === 'dm') set({ hasDmNotif: false })
        },

        addReport: (type) => {
          const pts = POINTS[type]
          const newScore = get().score + pts
          set({
            score: newScore,
            rank: getRank(newScore),
            reportsToday: get().reportsToday + 1,
            weeklyReports: get().weeklyReports + 1,
          })
        },

        updateSpeed: (speed) => set({ currentSpeed: speed }),
        updateSpeedLimit: (limit) => set({ speedLimit: limit }),
        setNearbyDrivers: (n) => set({ nearbyDrivers: n }),
        setUserId: (id) => set({ userId: id }),
        setScore: (score) => set({ score, rank: getRank(score) }),
        setRank: (rank) => set({ rank }),
        setReportsToday: (n) => set({ reportsToday: n }),
        setWeeklyReports: (n) => set({ weeklyReports: n }),
        toggleGhostMode: () => set((s) => ({ ghostMode: !s.ghostMode })),
        setLocation: (street, city) => set({ currentStreet: street, currentCity: city }),

        showNotification: (message, type) => {
          const id = crypto.randomUUID()
          set({ notification: { id, message, type } })
          setTimeout(() => {
            const current = get().notification
            if (current?.id === id) set({ notification: null })
          }, 2500)
        },

        clearNotification: () => set({ notification: null }),
        setHasDmNotif: (v) => set({ hasDmNotif: v }),
      }),
      {
        name: 'drivelink-v1',
        partialize: (s) => ({
          score: s.score, rank: s.rank, userId: s.userId,
          totalMiles: s.totalMiles, weeklyReports: s.weeklyReports,
          ghostMode: s.ghostMode,
        }),
      }
    ),
    { name: 'DriveLink' }
  )
)
