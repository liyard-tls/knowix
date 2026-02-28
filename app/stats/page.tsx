'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Flame, Zap, Trophy, Target } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useStreak } from '@/hooks/useStreak'
import { useXP } from '@/hooks/useXP'
import { AppShell } from '@/components/layout'
import { Card, Badge, ProgressBar } from '@/components/atoms'
import { ACHIEVEMENTS } from '@/config/gamification'
import { useUserContext } from '@/context'
import { t } from '@/lib/i18n'

export default function StatsPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const { current: streak, longest } = useStreak()
  const { xp, level, progress } = useXP()
  const { profile } = useUserContext()

  useEffect(() => {
    if (!authLoading && !user) router.push('/login')
  }, [user, authLoading, router])

  if (authLoading || !user) return null

  const unlockedIds = new Set(profile?.achievements ?? [])

  return (
    <AppShell>
      <div className="px-4 pt-10 pb-4 flex flex-col gap-6">
        <h1 className="text-xl font-bold text-[var(--text-primary)]">{t.stats.title}</h1>

        {/* Streak + XP cards */}
        <div className="grid grid-cols-2 gap-3">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.05 }}>
            <Card variant="elevated" padding="md" className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <Flame className="h-5 w-5 text-orange-400" />
                <span className="text-xs text-[var(--text-muted)] font-medium">{t.stats.streak}</span>
              </div>
              <p className="text-3xl font-bold text-[var(--text-primary)]">{streak}</p>
              <p className="text-xs text-[var(--text-muted)]">{t.stats.streakRecord(longest)}</p>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}>
            <Card variant="elevated" padding="md" className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-yellow-400" />
                <span className="text-xs text-[var(--text-muted)] font-medium">{t.stats.xpLabel}</span>
              </div>
              <p className="text-3xl font-bold text-[var(--text-primary)]">{xp}</p>
              <Badge variant="xp" size="sm">{level.title}</Badge>
            </Card>
          </motion.div>
        </div>

        {/* Level progress */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <Card variant="default" padding="md">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-[var(--accent)]" />
                <span className="text-sm font-medium text-[var(--text-primary)]">
                  {t.stats.level(level.level, level.title)}
                </span>
              </div>
              <span className="text-xs text-[var(--text-muted)]">{progress.percent}%</span>
            </div>
            <ProgressBar value={progress.current} max={progress.needed} variant="xp" />
            <p className="mt-2 text-xs text-[var(--text-muted)]">
              {t.stats.xpProgress(progress.current, progress.needed, level.level + 1)}
            </p>
          </Card>
        </motion.div>

        {/* Achievements */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Trophy className="h-4 w-4 text-[var(--accent)]" />
            <h2 className="text-sm font-semibold text-[var(--text-primary)]">
              {t.stats.achievements(unlockedIds.size, ACHIEVEMENTS.length)}
            </h2>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {ACHIEVEMENTS.map((achievement, i) => {
              const unlocked = unlockedIds.has(achievement.id)
              return (
                <motion.div
                  key={achievement.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 + i * 0.04 }}
                >
                  <Card
                    variant="elevated"
                    padding="sm"
                    className={unlocked ? 'border-[var(--accent)]/30' : 'opacity-40'}
                  >
                    <div className="text-xl mb-1">{achievement.icon}</div>
                    <p className="text-xs font-medium text-[var(--text-primary)] leading-tight">
                      {achievement.title}
                    </p>
                    <p className="text-[10px] text-[var(--text-muted)] mt-0.5 leading-tight">
                      {achievement.description}
                    </p>
                  </Card>
                </motion.div>
              )
            })}
          </div>
        </div>
      </div>
    </AppShell>
  )
}
