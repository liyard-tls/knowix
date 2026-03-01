import type { Achievement, Level } from '@/types'

// Базові XP за статус відповіді
export const XP_BASE = {
  correct: 30,
  partial: 15,
  incorrect: 5,
} as const

// Мультиплікатор стріку (застосовується тільки до базових XP, не до xpBonus)
// Ключ = мінімальна кількість днів стріку для активації
export const STREAK_MULTIPLIER: Record<number, number> = {
  7: 1.5,
  14: 1.75,
  30: 2.0,
}

/**
 * Розраховує мультиплікатор на основі поточного стріку.
 * Повертає найвищий застосовний мультиплікатор.
 */
export function getStreakMultiplier(currentStreak: number): number {
  const thresholds = Object.keys(STREAK_MULTIPLIER)
    .map(Number)
    .sort((a, b) => b - a)

  for (const threshold of thresholds) {
    if (currentStreak >= threshold) {
      return STREAK_MULTIPLIER[threshold]
    }
  }
  return 1.0
}

/**
 * Converts a 0-100 score to a QuestionStatus.
 * 80-100 → correct, 40-79 → partial, 0-39 → incorrect
 */
export function scoreToStatus(score: number): 'correct' | 'partial' | 'incorrect' {
  if (score >= 80) return 'correct'
  if (score >= 40) return 'partial'
  return 'incorrect'
}

/**
 * Повна формула нарахування XP:
 * totalXP = Math.round(XP_BASE[status] * streakMultiplier) + question.xpBonus
 */
export function calculateXP(
  status: 'correct' | 'partial' | 'incorrect',
  xpBonus: number,
  currentStreak: number
): number {
  const base = XP_BASE[status]
  const multiplier = getStreakMultiplier(currentStreak)
  return Math.round(base * multiplier) + xpBonus
}

/**
 * Calculates incremental XP based on score delta.
 * XP is proportional to score improvement: delta/100 * max possible XP.
 * Returns 0 if score didn't improve.
 *
 * previousScore — last AI score for this question (0-100), or 0 if first attempt
 * newScore      — current AI score (0-100)
 * xpBonus       — per-question bonus set by AI
 * currentStreak — for streak multiplier
 */
export function calculateDeltaXP(
  previousScore: number,
  newScore: number,
  xpBonus: number,
  currentStreak: number
): number {
  const delta = newScore - previousScore
  if (delta <= 0) return 0
  const status = scoreToStatus(newScore)
  const maxXP = calculateXP(status, xpBonus, currentStreak)
  return Math.round(maxXP * (delta / 100))
}

// Бонус за завершення щоденної сесії (5 питань за день)
export const DAILY_BONUS_XP = 20

// Бонус за завершення всього курсу (50/50 питань)
export const COURSE_COMPLETE_XP = 100

// Рівні прогресу
export const LEVELS: Level[] = [
  { level: 1, title: 'Trainee',   minXP: 0,    maxXP: 199 },
  { level: 2, title: 'Junior',    minXP: 200,  maxXP: 499 },
  { level: 3, title: 'Middle',    minXP: 500,  maxXP: 999 },
  { level: 4, title: 'Senior',    minXP: 1000, maxXP: 1999 },
  { level: 5, title: 'Lead',      minXP: 2000, maxXP: 3999 },
  { level: 6, title: 'Principal', minXP: 4000, maxXP: Infinity },
]

export function getLevelByXP(xp: number): Level {
  return LEVELS.findLast((l) => xp >= l.minXP) ?? LEVELS[0]
}

export function getXPProgress(xp: number): { current: number; needed: number; percent: number } {
  const level = getLevelByXP(xp)
  const current = xp - level.minXP
  const needed = level.maxXP === Infinity ? 9999 : level.maxXP - level.minXP
  const percent = Math.min(100, Math.round((current / needed) * 100))
  return { current, needed, percent }
}

// Досягнення
export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_question',
    title: 'Перший крок',
    description: 'Відповів на перше питання',
    icon: '🎯',
  },
  {
    id: 'first_course',
    title: 'Перший курс',
    description: 'Створив перший курс',
    icon: '📚',
  },
  {
    id: 'streak_3',
    title: '3 дні поспіль',
    description: 'Підтримав стрік 3 дні',
    icon: '🔥',
  },
  {
    id: 'streak_7',
    title: 'Тижневик',
    description: 'Підтримав стрік 7 днів',
    icon: '🔥🔥',
  },
  {
    id: 'streak_30',
    title: 'Місяць!',
    description: 'Підтримав стрік 30 днів',
    icon: '💎',
  },
  {
    id: 'perfect_session',
    title: 'Ідеальна сесія',
    description: '5/5 правильних відповідей за день',
    icon: '⭐',
  },
  {
    id: 'course_complete',
    title: 'Курс завершено',
    description: 'Пройшов усі 50 питань курсу',
    icon: '🏆',
  },
  {
    id: 'level_senior',
    title: 'Senior!',
    description: 'Досяг рівня Senior (1000 XP)',
    icon: '🚀',
  },
]
