'use client'

import { useUserContext } from '@/context/UserContext'
import { getLevelByXP, getXPProgress, getStreakMultiplier, calculateXP } from '@/config/gamification'
import type { QuestionStatus } from '@/types'

export function useXP() {
  const { profile, addXP } = useUserContext()

  const xp = profile?.xp ?? 0
  const level = getLevelByXP(xp)
  const progress = getXPProgress(xp)
  const streak = profile?.streak.current ?? 0
  const multiplier = getStreakMultiplier(streak)

  const awardXP = async (
    status: QuestionStatus,
    xpBonus: number
  ) => {
    if (status === 'pending') return 0
    const amount = calculateXP(
      status as 'correct' | 'partial' | 'incorrect',
      xpBonus,
      streak
    )
    await addXP(amount)
    return amount
  }

  return { xp, level, progress, multiplier, awardXP }
}
