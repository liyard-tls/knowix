'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Flame, Zap, BookOpen, LogOut, User, Users, ChevronRight } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useStreak } from '@/hooks/useStreak'
import { useXP } from '@/hooks/useXP'
import { useCourses } from '@/hooks/useCourse'
import { useUserContext } from '@/context'
import { AppShell } from '@/components/layout'
import { Button, Card, Badge, ProgressBar } from '@/components/atoms'
import { t } from '@/lib/i18n'

export default function ProfilePage() {
  const { user, loading: authLoading, signOut } = useAuth()
  const router = useRouter()
  const { current: streak, longest } = useStreak()
  const { xp, level, progress } = useXP()
  const { courses } = useCourses()
  const { profile } = useUserContext()

  const friendCount = profile?.friends?.length ?? 0
  const pendingCount = profile?.friendRequestsIn?.length ?? 0

  useEffect(() => {
    if (!authLoading && !user) router.push('/login')
  }, [user, authLoading, router])

  if (authLoading || !user) return null

  const totalAnswered = courses.reduce(
    (sum, c) => sum + c.questions.filter((q) => q.status !== 'pending').length,
    0
  )

  const joinedDate = user.metadata?.creationTime
    ? new Date(user.metadata.creationTime).toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric',
      })
    : null

  return (
    <AppShell>
      <div className="px-4 pt-10 pb-4 flex flex-col gap-6">
        <h1 className="text-xl font-bold text-[var(--text-primary)]">{t.profile.title}</h1>

        {/* Avatar + name */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card variant="elevated" padding="md">
            <div className="flex items-center gap-4">
              {user.photoURL ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.photoURL}
                  alt={user.displayName ?? 'Avatar'}
                  className="h-14 w-14 rounded-full object-cover ring-2 ring-[var(--border)]"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="h-14 w-14 rounded-full bg-[var(--bg-base)] flex items-center justify-center ring-2 ring-[var(--border)]">
                  <User className="h-7 w-7 text-[var(--text-muted)]" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-[var(--text-primary)] truncate">
                  {user.displayName ?? 'Learner'}
                </p>
                <p className="text-xs text-[var(--text-muted)] truncate">{user.email}</p>
                {joinedDate && (
                  <p className="text-xs text-[var(--text-disabled)] mt-0.5">
                    {t.profile.memberSince(joinedDate)}
                  </p>
                )}
              </div>
              <Badge variant="xp" size="sm" className="flex-shrink-0">
                {level.title}
              </Badge>
            </div>
          </Card>
        </motion.div>

        {/* Friends row */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card
            variant="default"
            padding="sm"
            interactive
            onClick={() => router.push('/friends')}
          >
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2.5">
                <Users className="h-4 w-4 text-[var(--accent)]" />
                <span className="text-sm font-medium text-[var(--text-primary)]">
                  {t.friends.title}
                </span>
                {pendingCount > 0 && (
                  <Badge variant="xp" size="sm">{pendingCount} new</Badge>
                )}
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm text-[var(--text-muted)]">{friendCount}</span>
                <ChevronRight className="h-4 w-4 text-[var(--text-disabled)]" />
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Stats grid */}
        <section>
          <h2 className="text-sm font-semibold text-[var(--text-secondary)] mb-3">
            {t.profile.statsSection}
          </h2>

          <div className="grid grid-cols-3 gap-2">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.05 }}
            >
              <Card variant="elevated" padding="sm" className="flex flex-col gap-1 items-center text-center">
                <Flame className="h-5 w-5 text-orange-400" />
                <p className="text-xl font-bold text-[var(--text-primary)]">{streak}</p>
                <p className="text-[10px] text-[var(--text-muted)]">Day streak</p>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
            >
              <Card variant="elevated" padding="sm" className="flex flex-col gap-1 items-center text-center">
                <Zap className="h-5 w-5 text-yellow-400" />
                <p className="text-xl font-bold text-[var(--text-primary)]">{xp}</p>
                <p className="text-[10px] text-[var(--text-muted)]">Total XP</p>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.15 }}
            >
              <Card variant="elevated" padding="sm" className="flex flex-col gap-1 items-center text-center">
                <BookOpen className="h-5 w-5 text-[var(--accent)]" />
                <p className="text-xl font-bold text-[var(--text-primary)]">{courses.length}</p>
                <p className="text-[10px] text-[var(--text-muted)]">Courses</p>
              </Card>
            </motion.div>
          </div>

          {/* Answers answered stat */}
          {totalAnswered > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="mt-2"
            >
              <Card variant="default" padding="sm">
                <p className="text-xs text-[var(--text-muted)] text-center">
                  {t.profile.questionsAnswered(totalAnswered)}
                </p>
              </Card>
            </motion.div>
          )}
        </section>

        {/* Level progress */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card variant="default" padding="md">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-[var(--text-primary)]">
                Level {level.level} — {level.title}
              </span>
              <span className="text-xs text-[var(--text-muted)]">{progress.percent}%</span>
            </div>
            <ProgressBar value={progress.current} max={progress.needed} variant="xp" size="sm" />
            <p className="mt-1.5 text-xs text-[var(--text-muted)]">
              {progress.current} / {progress.needed} XP to level {level.level + 1}
            </p>
            {longest > 0 && (
              <p className="mt-1 text-xs text-[var(--text-disabled)]">
                Longest streak: {longest} days
              </p>
            )}
          </Card>
        </motion.div>

        {/* Sign out */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <Button
            variant="ghost"
            size="md"
            className="w-full text-[var(--error)]"
            leftIcon={<LogOut className="h-4 w-4" />}
            onClick={signOut}
          >
            {t.profile.signOut}
          </Button>
        </motion.div>
      </div>
    </AppShell>
  )
}
