'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Plus, Compass, BookOpen } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useCourses } from '@/hooks/useCourse'
import { AppShell } from '@/components/layout'
import { Button, Card, ProgressBar } from '@/components/atoms'
import { t } from '@/lib/i18n'

export default function CoursesPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const { courses, loading: coursesLoading } = useCourses()

  useEffect(() => {
    if (!authLoading && !user) router.push('/login')
  }, [user, authLoading, router])

  if (authLoading || !user) return null

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

        {/* My Courses */}
        <section>
          <h2 className="text-sm font-semibold text-[var(--text-secondary)] mb-3">
            {t.courses.myCoursesSection}
          </h2>

          {coursesLoading ? (
            <div className="flex flex-col gap-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="skeleton h-24 w-full" />
              ))}
            </div>
          ) : courses.length === 0 ? (
            <Card variant="elevated" className="text-center py-8">
              <BookOpen className="h-8 w-8 text-[var(--text-disabled)] mx-auto mb-2" />
              <p className="text-sm text-[var(--text-secondary)] font-medium mb-1">
                {t.dashboard.empty.title}
              </p>
              <p className="text-xs text-[var(--text-muted)] mb-4">
                {t.dashboard.empty.description}
              </p>
              <Button
                variant="primary"
                size="sm"
                leftIcon={<Plus className="h-4 w-4" />}
                onClick={() => router.push('/course/new')}
              >
                {t.dashboard.empty.cta}
              </Button>
            </Card>
          ) : (
            <div className="flex flex-col gap-3">
              {courses.map((course, i) => {
                const total = course.questions.length
                const done = course.questions.filter((q) => q.status !== 'pending').length

                return (
                  <motion.div
                    key={course.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Card
                      variant="default"
                      interactive
                      className="flex flex-col gap-2"
                      onClick={() => router.push(`/course/${course.id}`)}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold text-[var(--text-primary)] line-clamp-2 flex-1 text-sm">
                          {course.title}
                        </h3>
                        <span className="text-[10px] text-[var(--text-disabled)] flex-shrink-0 mt-0.5 font-mono">
                          {done}/{total}
                        </span>
                      </div>
                      <ProgressBar value={done} max={total} size="sm" />
                    </Card>
                  </motion.div>
                )
              })}
            </div>
          )}
        </section>

        {/* Explore — WIP */}
        <section>
          <h2 className="text-sm font-semibold text-[var(--text-secondary)] mb-3">
            {t.courses.exploreSection}
          </h2>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card variant="elevated" className="text-center py-10">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-[var(--accent-subtle)] mx-auto mb-3">
                <Compass className="h-6 w-6 text-[var(--accent)]" />
              </div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--accent-subtle)] mb-3">
                <span className="text-[10px] font-semibold text-[var(--accent)] uppercase tracking-wider">
                  {t.courses.wip.badge}
                </span>
              </div>
              <p className="text-sm font-semibold text-[var(--text-primary)] mb-1">
                {t.courses.wip.title}
              </p>
              <p className="text-xs text-[var(--text-muted)] max-w-[240px] mx-auto leading-relaxed">
                {t.courses.wip.description}
              </p>
            </Card>
          </motion.div>
        </section>
      </div>
    </AppShell>
  )
}
