"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Plus, Flame, Zap, BookOpen } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useStreak } from "@/hooks/useStreak";
import { useXP } from "@/hooks/useXP";
import { useCourses } from "@/hooks/useCourse";
import { AppShell } from "@/components/layout";
import { Button, ProgressBar, Badge, Card } from "@/components/atoms";
import { t } from "@/lib/i18n";

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { current: streak } = useStreak();
  const { xp, level, progress } = useXP();
  const { courses, loading: coursesLoading } = useCourses();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  if (authLoading || !user) return null;

  const firstName =
    user.displayName?.split(" ")[0] ?? t.dashboard.greetingFallback;

  return (
    <AppShell>
      <div className="flex flex-col gap-0">
        {/* Hero streak block */}
        <motion.section
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="px-4 pt-12 pb-6 bg-[var(--bg-surface)] border-b border-[var(--border)]"
        >
          <p className="text-sm text-[var(--text-muted)] mb-1">
            {t.dashboard.greeting(firstName)}
          </p>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-4">
            {t.dashboard.subtitle}
          </h1>

          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center gap-1.5">
              <Flame className="h-5 w-5 text-orange-400" />
              <span className="text-lg font-bold text-[var(--text-primary)]">
                {streak}
              </span>
              <span className="text-sm text-[var(--text-muted)]">
                {t.common.days}
              </span>
            </div>
            <div className="h-4 w-px bg-[var(--border)]" />
            <div className="flex items-center gap-1.5">
              <Zap className="h-4 w-4 text-yellow-400" />
              <span className="text-sm font-semibold text-[var(--text-primary)]">
                {xp} {t.common.xp}
              </span>
              <Badge variant="xp" size="sm">
                {level.title}
              </Badge>
            </div>
          </div>

          <ProgressBar
            value={progress.current}
            max={progress.needed}
            variant="xp"
            size="sm"
          />
          <p className="mt-1.5 text-xs text-[var(--text-muted)]">
            {t.dashboard.xpToNextLevel(progress.current, progress.needed)}
          </p>
        </motion.section>

        {/* Courses section */}
        <section className="px-4 pt-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-[var(--text-primary)]">
              {t.dashboard.myCourses}
            </h2>
            <Button
              variant="subtle"
              size="sm"
              leftIcon={<Plus className="h-4 w-4" />}
              onClick={() => router.push("/course/new")}
            >
              {t.dashboard.newCourse}
            </Button>
          </div>

          {coursesLoading ? (
            <div className="flex flex-col gap-3">
              {[1, 2].map((i) => (
                <div key={i} className="skeleton h-28 w-full" />
              ))}
            </div>
          ) : courses.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <Card variant="elevated" className="text-center py-10">
                <BookOpen className="h-10 w-10 text-[var(--text-disabled)] mx-auto mb-3" />
                <p className="text-[var(--text-secondary)] font-medium mb-1">
                  {t.dashboard.empty.title}
                </p>
                <p className="text-sm text-[var(--text-muted)] mb-4">
                  {t.dashboard.empty.description}
                </p>
                <Button
                  variant="primary"
                  size="md"
                  leftIcon={<Plus className="h-4 w-4" />}
                  onClick={() => router.push("/course/new")}
                >
                  {t.dashboard.empty.cta}
                </Button>
              </Card>
            </motion.div>
          ) : (
            <div className="flex flex-col gap-3">
              {courses.map((course, i) => {
                const total = course.questions.length;
                const done = course.questions.filter(
                  (q) => q.status !== "pending",
                ).length;

                return (
                  <motion.div
                    key={course.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06 }}
                  >
                    <Card
                      variant="default"
                      interactive
                      className="min-h-[112px] flex flex-col justify-between"
                      onClick={() => router.push(`/course/${course.id}`)}
                    >
                      <div>
                        <h3 className="font-semibold text-[var(--text-primary)] mb-1 line-clamp-2">
                          {course.title}
                        </h3>
                        <p className="text-xs text-[var(--text-muted)]">
                          {t.dashboard.questionsProgress(done, total)}
                        </p>
                      </div>
                      <ProgressBar
                        value={done}
                        max={total}
                        size="sm"
                        className="mt-3"
                      />
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}
