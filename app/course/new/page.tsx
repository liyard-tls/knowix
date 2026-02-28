'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft, Sparkles } from 'lucide-react'
import { collection, addDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Button, Card } from '@/components/atoms'
import { AppShell } from '@/components/layout'
import { useAuth } from '@/hooks/useAuth'
import { generateQuestions } from '@/actions/course.actions'
import { t } from '@/lib/i18n'
import type { Course } from '@/types'

export default function NewCoursePage() {
  const router = useRouter()
  const { user } = useAuth()
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleCreate = async () => {
    if (!description.trim() || description.trim().length < 10) {
      setError(t.newCourse.errorMinLength)
      return
    }
    if (!user) {
      router.push('/login')
      return
    }

    setLoading(true)
    setError('')

    try {
      // 1. Generate questions via Server Action (uses GEMINI_API_KEY server-side)
      const questions = await generateQuestions(description.trim())

      // 2. Derive title
      const desc = description.trim()
      const title = desc.length <= 60
        ? desc
        : desc.slice(0, 60).replace(/\s\S+$/, '') + '…'

      // 3. Save to Firestore as authenticated user
      const now = Date.now()
      const courseData: Omit<Course, 'id'> = {
        userId: user.uid,
        title,
        description: desc,
        questions,
        isPublic: false,
        createdAt: now,
        updatedAt: now,
      }
      const docRef = await addDoc(collection(db, 'courses'), courseData)

      router.push(`/course/${docRef.id}`)
    } catch (err) {
      console.error('createCourse failed:', err)
      setError(t.common.error)
      setLoading(false)
    }
  }

  return (
    <AppShell showNav={false}>
      <div className="min-h-dvh flex flex-col px-4 pt-12 pb-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-[var(--radius-md)] text-[var(--text-muted)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)] transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-xl font-bold text-[var(--text-primary)]">{t.newCourse.title}</h1>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex flex-col gap-6 flex-1"
        >
          {/* Description */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-[var(--text-secondary)]">
              {t.newCourse.label}
            </label>
            <textarea
              value={description}
              onChange={(e) => {
                setDescription(e.target.value)
                if (error) setError('')
              }}
              placeholder={t.newCourse.placeholder}
              rows={5}
              className="w-full px-4 py-3 rounded-[var(--radius-lg)] bg-[var(--bg-input)] border border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-disabled)] text-sm leading-relaxed resize-none focus:outline-none focus:border-[var(--accent)] transition-colors"
              disabled={loading}
            />
            {error && (
              <p className="text-xs text-[var(--error)]">{error}</p>
            )}
            <p className="text-xs text-[var(--text-muted)]">
              {t.newCourse.hint}
            </p>
          </div>

          {/* Examples */}
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium text-[var(--text-secondary)]">
              {t.newCourse.examplesLabel}
            </p>
            <div className="flex flex-col gap-2">
              {t.newCourse.examples.map((ex) => (
                <button
                  key={ex}
                  onClick={() => setDescription(ex)}
                  className="text-left px-4 py-3 rounded-[var(--radius-md)] bg-[var(--bg-surface)] border border-[var(--border)] text-sm text-[var(--text-secondary)] hover:border-[var(--accent)] hover:text-[var(--text-primary)] transition-all active:scale-[0.99]"
                  disabled={loading}
                >
                  {ex}
                </button>
              ))}
            </div>
          </div>

          {/* Generate button */}
          <div className="mt-auto">
            {loading && (
              <Card variant="elevated" padding="md" className="mb-4 text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Sparkles className="h-4 w-4 text-[var(--accent)] animate-pulse" />
                  <span className="text-sm font-medium text-[var(--text-primary)]">
                    {t.newCourse.generating.title}
                  </span>
                </div>
                <p className="text-xs text-[var(--text-muted)]">
                  {t.newCourse.generating.subtitle}
                </p>
              </Card>
            )}

            <Button
              variant="primary"
              size="xl"
              className="w-full"
              leftIcon={<Sparkles className="h-5 w-5" />}
              onClick={handleCreate}
              loading={loading}
              disabled={!description.trim()}
            >
              {t.newCourse.submitButton}
            </Button>
          </div>
        </motion.div>
      </div>
    </AppShell>
  )
}
