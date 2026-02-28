'use client'

import { useUserContext } from '@/context/UserContext'

export function useStreak() {
  const { profile, updateStreak } = useUserContext()

  const streak = profile?.streak ?? { current: 0, longest: 0, lastActivity: 0 }

  const isActiveToday = () => {
    if (!streak.lastActivity) return false
    const now = Date.now()
    const oneDayMs = 24 * 60 * 60 * 1000
    return Math.floor((now - streak.lastActivity) / oneDayMs) === 0
  }

  return {
    current: streak.current,
    longest: streak.longest,
    lastActivity: streak.lastActivity,
    isActiveToday: isActiveToday(),
    updateStreak,
  }
}
