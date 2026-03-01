'use client'

import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Plus, Heart, Users, User } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { usePublicCourses } from '@/hooks/useCourse'
import { AppShell } from '@/components/layout'
import { Button, Card } from '@/components/atoms'
import { t } from '@/lib/i18n'
import type { Course } from '@/types'

const MODE_EMOJI: Record<string, string> = {
  tech: '💻',
  language: '🗣️',
  general: '🧠',
}

export default function CoursesPage() {
  const { user } = useAuth()
  const router = useRouter()
  const { courses: publicCourses, loading: publicLoading } = usePublicCourses(30)

  // courses page is publicly browsable — no auth redirect

  return (
    <AppShell>
      <div className="px-4 pb-4 pt-safe flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-[var(--text-primary)]">{t.courses.title}</h1>
          <Button
            variant="subtle"
            size="sm"
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={() => router.push('/course/new')}
          >
            {t.dashboard.newCourse}
          </Button>
        </div>

        {/* Explore */}
        {publicLoading ? (
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton h-28 w-full" />
            ))}
          </div>
        ) : publicCourses.length === 0 ? (
          <Card variant="elevated" className="text-center py-8">
            <p className="text-sm text-[var(--text-muted)]">
              {t.courses.explore.empty}
            </p>
          </Card>
        ) : (
          <div className="flex flex-col gap-3">
            {publicCourses.map((course: Course, i: number) => (
              <motion.div
                key={course.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => router.push(`/course/${course.id}/preview`)}
                className="cursor-pointer"
              >
                <Card variant="default" className="flex flex-col gap-3">
                  {/* Title + mode emoji */}
                  <div className="flex items-start gap-2">
                    <span className="text-base flex-shrink-0 mt-0.5">
                      {MODE_EMOJI[course.mode] ?? '📖'}
                    </span>
                    <h3 className="font-semibold text-[var(--text-primary)] line-clamp-2 flex-1 text-sm leading-snug">
                      {course.title}
                    </h3>
                  </div>

                  {/* Author row */}
                  <div className="flex items-center gap-2">
                    {course.authorPhotoURL ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={course.authorPhotoURL}
                        alt={course.authorName ?? ''}
                        className="h-5 w-5 rounded-full object-cover flex-shrink-0"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="h-5 w-5 rounded-full bg-[var(--bg-elevated)] flex items-center justify-center flex-shrink-0">
                        <User className="h-3 w-3 text-[var(--text-disabled)]" />
                      </div>
                    )}
                    <span className="text-xs text-[var(--text-muted)] truncate flex-1">
                      {course.authorName || 'Anonymous'}
                    </span>
                    <span className="text-[10px] text-[var(--text-disabled)]">
                      {t.courses.explore.questionsCount(course.questions.length)}
                    </span>
                  </div>

                  {/* Footer: likes + learners */}
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 text-[var(--text-disabled)]">
                      <Heart className="h-3.5 w-3.5" />
                      <span className="text-xs">{course.likes ?? 0}</span>
                    </div>
                    <div className="flex items-center gap-1 text-[var(--text-disabled)]">
                      <Users className="h-3.5 w-3.5" />
                      <span className="text-xs">{t.courses.explore.learners((course.forkCount ?? 0) + 1)}</span>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  )
}
