'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, CheckCircle2, XCircle, MinusCircle, Circle, Flame, Zap, MoreVertical, Share2, Globe, Trash2 } from 'lucide-react'
import { doc, deleteDoc, updateDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
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
  const [menuOpen, setMenuOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [sharingToggling, setSharingToggling] = useState(false)
  const [shareCopied, setShareCopied] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!menuOpen) return
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [menuOpen])

  useEffect(() => {
    if (!authLoading && !user) router.push('/login')
  }, [user, authLoading, router])

  const handleDelete = async () => {
    if (!confirmDelete) { setConfirmDelete(true); return }
    setDeleting(true)
    try {
      await deleteDoc(doc(db, 'courses', id))
      router.push('/dashboard')
    } catch {
      setDeleting(false)
      setConfirmDelete(false)
    }
  }

  if (authLoading || courseLoading) {
    return (
      <AppShell showNav={false}>
        <div className="flex flex-col gap-3 px-4 pt-safe">
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

  const handleShare = async () => {
    const url = `${window.location.origin}/course/${id}/preview`
    setMenuOpen(false)
    if (navigator.share) {
      try {
        await navigator.share({ title: course?.title ?? 'Course', url })
      } catch {
        // user cancelled or error — ignore
      }
    } else {
      await navigator.clipboard.writeText(url)
      setShareCopied(true)
      setTimeout(() => setShareCopied(false), 2000)
    }
  }

  const handleTogglePublish = async () => {
    if (!course || sharingToggling) return
    setMenuOpen(false)
    setSharingToggling(true)
    try {
      const newIsPublic = !course.isPublic
      await updateDoc(doc(db, 'courses', id), {
        isPublic: newIsPublic,
        authorName: user?.displayName ?? '',
        authorPhotoURL: user?.photoURL ?? null,
        likes: course.likes ?? 0,
        forkCount: course.forkCount ?? 0,
      })
    } finally {
      setSharingToggling(false)
    }
  }

  return (
    <AppShell showNav={false}>
      <div className="flex flex-col min-h-dvh">
        {/* Header */}
        <div className="px-4 pb-4 pt-safe bg-[var(--bg-surface)] border-b border-[var(--border)]">
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
            {/* 3-dot context menu */}
            <div className="relative flex-shrink-0" ref={menuRef}>
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="p-2 rounded-[var(--radius-md)] text-[var(--text-muted)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)] transition-colors"
              >
                <MoreVertical className="h-5 w-5" />
              </button>

              <AnimatePresence>
                {menuOpen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -4 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -4 }}
                    transition={{ duration: 0.12 }}
                    className="absolute right-0 top-full mt-1 z-50 min-w-[160px] rounded-[var(--radius-lg)] bg-[var(--bg-elevated)] border border-[var(--border)] shadow-[var(--shadow-md)] overflow-hidden"
                  >
                    {/* Share */}
                    <button
                      onClick={handleShare}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-input)] transition-colors"
                    >
                      <Share2 className="h-4 w-4 text-[var(--text-muted)]" />
                      {shareCopied ? 'Copied!' : 'Share'}
                    </button>

                    {/* Publish */}
                    <button
                      onClick={handleTogglePublish}
                      disabled={sharingToggling}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors hover:bg-[var(--bg-input)]"
                    >
                      <Globe className={cn('h-4 w-4', course.isPublic ? 'text-[var(--accent)]' : 'text-[var(--text-muted)]')} />
                      <span className={course.isPublic ? 'text-[var(--accent)]' : 'text-[var(--text-primary)]'}>
                        {course.isPublic ? 'Unpublish' : 'Publish'}
                      </span>
                    </button>

                    <div className="h-px bg-[var(--border)]" />

                    {/* Delete */}
                    <button
                      onClick={() => { setMenuOpen(false); handleDelete() }}
                      disabled={deleting}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                      {deleting ? 'Deleting…' : 'Delete'}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Delete confirmation banner */}
          <AnimatePresence>
            {confirmDelete && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden mb-3"
              >
                <div className="flex items-center justify-between px-3 py-2 rounded-[var(--radius-md)] bg-red-500/10 border border-red-500/20">
                  <p className="text-xs text-red-400">
                    {deleting ? 'Deleting…' : 'Delete this course?'}
                  </p>
                  {!deleting && (
                    <div className="flex items-center gap-3 ml-3">
                      <button
                        onClick={handleDelete}
                        className="text-xs font-medium text-red-400 hover:text-red-300"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => setConfirmDelete(false)}
                        className="text-xs text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

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
            .map((q) => (
              <button
                key={q.id}
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
                  {/* Status icon */}
                  <div className="flex-shrink-0 mt-0.5">{STATUS_ICON[q.status]}</div>
                  {/* Right column: number + text inline, difficulty+XP below */}
                  <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                    <p className="text-sm text-[var(--text-primary)] line-clamp-2 leading-snug">
                      <span className="text-[var(--text-disabled)] mr-1.5">{q.order}.</span>
                      {q.text}
                    </p>
                    <div className="flex items-center gap-2">
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
                  </div>
                </div>
              </button>
            ))}
        </div>
      </div>
    </AppShell>
  )
}
