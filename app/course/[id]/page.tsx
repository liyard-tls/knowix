'use client'

import { useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft, CheckCircle2, XCircle, MinusCircle, Circle, Flame, Zap } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useCourse } from '@/hooks/useCourse'
import { useStreak } from '@/hooks/useStreak'
import { useXP } from '@/hooks/useXP'
import { AppShell } from '@/components/layout'
import { Card, ProgressBar, Badge } from '@/components/atoms'
import { cn } from '@/lib/cn'
import type { Question, QuestionStatus } from '@/types'

const STATUS_ICON: Record<QuestionStatus, React.ReactNode> = {
  pending:   <Circle       className="h-4 w-4 text-[var(--text-disabled)]" />,
  correct:   <CheckCircle2 className="h-4 w-4 text-emerald-400" />,
  partial:   <MinusCircle  className="h-4 w-4 text-yellow-400" />,
  incorrect: <XCircle      className="h-4 w-4 text-red-400" />,
}

const STATUS_BG: Record<QuestionStatus, string> = {
  pending:   '',
  correct:   'border-emerald-500/20 bg-emerald-500/5',
  partial:   'border-yellow-500/20 bg-yellow-500/5',
  incorrect: 'border-red-500/20 bg-red-500/5',
}

const DIFFICULTY_BADGE: Record<string, string> = {
  easy:   'bg-emerald-500/10 text-emerald-400',
  medium: 'bg-yellow-500/10 text-yellow-400',
  hard:   'bg-red-500/10 text-red-400',
}

export default function CoursePage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const { course, loading: courseLoading } = useCourse(id)
  const { current: streak } = useStreak()
  const { xp, level } = useXP()

  useEffect(() => {
    if (!authLoading && !user) router.push('/login')
  }, [user, authLoading, router])

  if (authLoading || courseLoading) {
    return (
      <AppShell showNav={false}>
        <div className="flex flex-col gap-3 px-4 pt-12">
          <div className="skeleton h-8 w-48" />
          <div className="skeleton h-4 w-32" />
          <div className="skeleton h-2 w-full mt-2" />
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="skeleton h-16 w-full" />
          ))}
        </div>
      </AppShell>
    )
  }

  if (!course) {
    return (
      <AppShell showNav={false}>
        <div className="flex flex-col items-center justify-center min-h-dvh gap-4 px-4">
          <p className="text-[var(--text-secondary)]">Course not found.</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="text-sm text-[var(--accent)] underline"
          >
            Go to Dashboard
          </button>
        </div>
      </AppShell>
    )
  }

  const total = course.questions.length
  const answered = course.questions.filter((q) => q.status !== 'pending').length
  const correct  = course.questions.filter((q) => q.status === 'correct').length
  const percent  = total > 0 ? Math.round((answered / total) * 100) : 0

  // Find next unanswered question for the CTA button
  const nextQuestion = course.questions
    .slice()
    .sort((a, b) => a.order - b.order)
    .find((q) => q.status === 'pending')

  const handleQuestionClick = (q: Question) => {
    router.push(`/course/${id}/${q.id}`)
  }

  return (
    <AppShell showNav={false}>
      <div className="flex flex-col min-h-dvh">
        {/* Header */}
        <div className="px-4 pt-12 pb-4 bg-[var(--bg-surface)] border-b border-[var(--border)]">
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={() => router.push('/dashboard')}
              className="p-2 rounded-[var(--radius-md)] text-[var(--text-muted)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)] transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="text-base font-semibold text-[var(--text-primary)] line-clamp-2 flex-1">
              {course.title}
            </h1>
          </div>

          {/* Stats row */}
          <div className="flex items-center gap-3 mb-3">
            <span className="text-xs text-[var(--text-muted)]">
              {answered}/{total} answered
            </span>
            {answered > 0 && (
              <>
                <span className="text-[var(--border)]">·</span>
                <span className="text-xs text-emerald-400">{correct} correct</span>
              </>
            )}
            <span className="ml-auto text-xs text-[var(--text-muted)]">{percent}%</span>
          </div>

          <ProgressBar value={answered} max={total} variant="xp" size="sm" />

          {/* XP / Streak pills */}
          <div className="flex items-center gap-2 mt-3">
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-[var(--bg-elevated)]">
              <Flame className="h-3 w-3 text-orange-400" />
              <span className="text-[10px] font-medium text-[var(--text-secondary)]">{streak}</span>
            </div>
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-[var(--bg-elevated)]">
              <Zap className="h-3 w-3 text-yellow-400" />
              <span className="text-[10px] font-medium text-[var(--text-secondary)]">{xp} XP</span>
            </div>
            <Badge variant="xp" size="sm" className="ml-auto">{level.title}</Badge>
          </div>
        </div>

        {/* Continue CTA */}
        {nextQuestion && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="px-4 py-3 bg-[var(--accent)]/10 border-b border-[var(--accent)]/20"
          >
            <button
              onClick={() => handleQuestionClick(nextQuestion)}
              className="w-full flex items-center justify-between text-sm font-medium text-[var(--accent)]"
            >
              <span>Continue — Question {nextQuestion.order}</span>
              <span className="text-lg">→</span>
            </button>
          </motion.div>
        )}

        {/* Questions list */}
        <div className="flex-1 px-4 py-4 flex flex-col gap-2">
          {course.questions
            .slice()
            .sort((a, b) => a.order - b.order)
            .map((q, i) => (
              <motion.div
                key={q.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.015 }}
              >
                <button
                  onClick={() => handleQuestionClick(q)}
                  className={cn(
                    'w-full text-left px-4 py-3 rounded-[var(--radius-md)]',
                    'border border-[var(--border)] bg-[var(--bg-surface)]',
                    'hover:border-[var(--accent)]/40 hover:bg-[var(--bg-elevated)]',
                    'transition-colors active:scale-[0.99]',
                    STATUS_BG[q.status]
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">{STATUS_ICON[q.status]}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] text-[var(--text-disabled)] font-mono">
                          #{q.order}
                        </span>
                        <span className={cn(
                          'text-[10px] font-medium px-1.5 py-0.5 rounded-full',
                          DIFFICULTY_BADGE[q.difficulty]
                        )}>
                          {q.difficulty}
                        </span>
                        {q.xpBonus > 0 && (
                          <span className="text-[10px] text-[var(--text-disabled)]">
                            +{q.xpBonus} XP
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-[var(--text-primary)] line-clamp-2 leading-snug">
                        {q.text}
                      </p>
                    </div>
                  </div>
                </button>
              </motion.div>
            ))}
        </div>
      </div>
    </AppShell>
  )
}
