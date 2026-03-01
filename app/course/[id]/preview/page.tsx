'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft, Heart, Users, User } from 'lucide-react'
import {
  doc, addDoc, updateDoc, collection,
  arrayUnion, arrayRemove, increment,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/hooks/useAuth'
import { useCourse, useCourses } from '@/hooks/useCourse'
import { AppShell } from '@/components/layout'
import { cn } from '@/lib/cn'
import { t } from '@/lib/i18n'
import type { QuestionDifficulty } from '@/types'

const MODE_EMOJI: Record<string, string> = {
  tech: '💻',
  language: '🗣️',
  general: '🧠',
}

const DIFFICULTY_BADGE: Record<QuestionDifficulty, string> = {
  easy:   'bg-emerald-500/10 text-emerald-400',
  medium: 'bg-yellow-500/10 text-yellow-400',
  hard:   'bg-red-500/10 text-red-400',
}

export default function CoursePreviewPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const { course, loading: courseLoading } = useCourse(id)
  // only fetch user's courses when logged in (hook handles null user internally)
  const { courses: myCourses } = useCourses()
  const [joining, setJoining] = useState(false)
  const [likePending, setLikePending] = useState(false)

  // Loading state — wait for course, but don't block on auth
  if (courseLoading || authLoading) {
    return (
      <AppShell showNav={false}>
        <div className="flex flex-col gap-3 px-4 pt-safe">
          <div className="skeleton h-8 w-48" />
          <div className="skeleton h-4 w-32" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="skeleton h-14 w-full" />
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
            onClick={() => router.push('/courses')}
            className="text-sm text-[var(--accent)] underline"
          >
            Back to Courses
          </button>
        </div>
      </AppShell>
    )
  }

  const isOwn = !!user && course.userId === user.uid
  const forkedCourse = user ? myCourses.find((c) => c.forkedFrom === id) : undefined
  const isLiked = !!user && (course.likedBy?.includes(user.uid) ?? false)
  const likes = course.likes ?? 0
  const learners = (course.forkCount ?? 0) + 1  // +1 for the author

  const requireLogin = () => router.push(`/login?next=/course/${id}/preview`)

  const handleJoin = async () => {
    if (!user) { requireLogin(); return }
    if (joining) return
    setJoining(true)
    try {
      const now = Date.now()
      const ref = await addDoc(collection(db, 'courses'), {
        userId: user.uid,
        title: course.title,
        description: course.description,
        mode: course.mode,
        questions: course.questions.map((q) => ({
          ...q,
          status: 'pending',
          xpEarned: 0,
        })),
        isPublic: false,
        authorName: user.displayName ?? '',
        authorPhotoURL: user.photoURL ?? null,
        likes: 0,
        forkCount: 0,
        forkedFrom: id,
        createdAt: now,
        updatedAt: now,
      })
      await updateDoc(doc(db, 'courses', id), { forkCount: increment(1) })
      router.push(`/course/${ref.id}`)
    } finally {
      setJoining(false)
    }
  }

  const handleLike = async () => {
    if (!user) { requireLogin(); return }
    if (likePending || isOwn) return
    setLikePending(true)
    try {
      if (isLiked) {
        await updateDoc(doc(db, 'courses', id), {
          likedBy: arrayRemove(user.uid),
          likes: increment(-1),
        })
      } else {
        await updateDoc(doc(db, 'courses', id), {
          likedBy: arrayUnion(user.uid),
          likes: increment(1),
        })
      }
    } finally {
      setLikePending(false)
    }
  }

  const ctaLabel = isOwn
    ? t.courses.explore.goToCourse
    : forkedCourse
      ? t.courses.explore.alreadyJoined
      : joining
        ? '…'
        : t.courses.explore.join

  const handleCta = () => {
    if (isOwn) { router.push(`/course/${id}`); return }
    if (forkedCourse) { router.push(`/course/${forkedCourse.id}`); return }
    handleJoin()
  }

  return (
    <AppShell showNav={false}>
      <div className="flex flex-col min-h-dvh">
        {/* Header */}
        <div className="px-4 pb-4 pt-safe bg-[var(--bg-surface)] border-b border-[var(--border)]">
          <div className="flex items-center gap-3 mb-3">
            <button
              onClick={() => router.back()}
              className="p-2 rounded-[var(--radius-md)] text-[var(--text-muted)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)] transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <span className="text-lg flex-shrink-0">{MODE_EMOJI[course.mode] ?? '📖'}</span>
            <h1 className="text-base font-semibold text-[var(--text-primary)] line-clamp-2 flex-1">
              {course.title}
            </h1>
          </div>

          {/* Author row */}
          <div className="flex items-center gap-2 mb-3">
            {course.authorPhotoURL ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={course.authorPhotoURL}
                alt={course.authorName ?? ''}
                className="h-6 w-6 rounded-full object-cover flex-shrink-0"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="h-6 w-6 rounded-full bg-[var(--bg-elevated)] flex items-center justify-center flex-shrink-0">
                <User className="h-3.5 w-3.5 text-[var(--text-disabled)]" />
              </div>
            )}
            <span className="text-sm text-[var(--text-muted)] flex-1">
              {course.authorName || 'Anonymous'}
            </span>
          </div>

          {/* Stats row */}
          <div className="flex items-center gap-4">
            <span className="text-xs text-[var(--text-disabled)]">
              {t.courses.explore.questionsCount(course.questions.length)}
            </span>
            <div className="flex items-center gap-1 text-[var(--text-disabled)]">
              <Users className="h-3.5 w-3.5" />
              <span className="text-xs">{t.courses.explore.learners(learners)}</span>
            </div>

            {/* Like button */}
            <button
              onClick={handleLike}
              disabled={likePending}
              className={cn(
                'ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors',
                isLiked
                  ? 'bg-red-500/15 text-red-400'
                  : 'bg-[var(--bg-elevated)] text-[var(--text-muted)] hover:text-red-400',
                isOwn && 'opacity-0 pointer-events-none'
              )}
            >
              <Heart className={cn('h-3.5 w-3.5', isLiked && 'fill-current')} />
              <span>{likes}</span>
            </button>
          </div>
        </div>

        {/* Question list — read-only */}
        <div className="flex-1 px-4 py-4 flex flex-col gap-2">
          {course.questions
            .slice()
            .sort((a, b) => a.order - b.order)
            .map((q, i) => (
              <motion.div
                key={q.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.02 }}
                className="px-4 py-3 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-surface)]"
              >
                <p className="text-sm text-[var(--text-primary)] line-clamp-2 leading-snug mb-1.5">
                  <span className="text-[var(--text-disabled)] mr-1.5">{q.order}.</span>
                  {q.text}
                </p>
                <span className={cn(
                  'text-[10px] font-medium px-1.5 py-0.5 rounded-full',
                  DIFFICULTY_BADGE[q.difficulty]
                )}>
                  {q.difficulty}
                </span>
              </motion.div>
            ))}
        </div>

        {/* Sticky CTA */}
        <div className="sticky bottom-0 px-4 py-4 bg-[var(--bg-surface)] border-t border-[var(--border)]">
          <button
            onClick={handleCta}
            disabled={joining}
            className={cn(
              'w-full py-3 rounded-[var(--radius-lg)] text-sm font-semibold transition-colors',
              isOwn || forkedCourse
                ? 'bg-[var(--bg-elevated)] text-[var(--text-primary)] hover:bg-[var(--bg-input)]'
                : 'bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] active:scale-[0.99]',
              joining && 'opacity-60'
            )}
          >
            {ctaLabel}
          </button>
        </div>
      </div>
    </AppShell>
  )
}
