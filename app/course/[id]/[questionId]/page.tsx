'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, ArrowRight, Send, Zap, CheckCircle2, MinusCircle, XCircle } from 'lucide-react'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/hooks/useAuth'
import { useCourse } from '@/hooks/useCourse'
import { useStreak } from '@/hooks/useStreak'
import { useUserContext } from '@/context'
import { evaluateAnswer } from '@/actions/chat.actions'
import { calculateXP } from '@/config/gamification'
import { AppShell } from '@/components/layout'
import { Button } from '@/components/atoms'
import { cn } from '@/lib/cn'
import type { Message, EvaluationResult } from '@/types'

const STATUS_CONFIG = {
  correct:   { icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20', label: 'Correct' },
  partial:   { icon: MinusCircle,  color: 'text-yellow-400',  bg: 'bg-yellow-500/10 border-yellow-500/20',   label: 'Partial' },
  incorrect: { icon: XCircle,      color: 'text-red-400',     bg: 'bg-red-500/10 border-red-500/20',         label: 'Incorrect' },
}

export default function QuestionPage() {
  const { id: courseId, questionId } = useParams<{ id: string; questionId: string }>()
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const { course, loading: courseLoading } = useCourse(courseId)
  const { current: streak } = useStreak()
  const { addXP, updateStreak } = useUserContext()

  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [evaluating, setEvaluating] = useState(false)
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (!authLoading && !user) router.push('/login')
  }, [user, authLoading, router])

  const question = course?.questions.find((q) => q.id === questionId)

  // Seed initial AI message when question loads
  useEffect(() => {
    if (!question || messages.length > 0) return
    setMessages([{
      id: 'q0',
      role: 'assistant',
      content: question.text,
      timestamp: Date.now(),
    }])
    // If already answered, restore evaluation state
    if (question.status !== 'pending') {
      setEvaluation({
        status: question.status as 'correct' | 'partial' | 'incorrect',
        score: 0,
        feedback: 'Previously answered.',
        xpEarned: question.xpEarned,
      })
    }
  }, [question]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const question_index = course?.questions
    .slice()
    .sort((a, b) => a.order - b.order)
    .findIndex((q) => q.id === questionId) ?? -1

  const sortedQuestions = course?.questions.slice().sort((a, b) => a.order - b.order) ?? []
  const prevQuestion = question_index > 0 ? sortedQuestions[question_index - 1] : null
  const nextQuestion = question_index < sortedQuestions.length - 1 ? sortedQuestions[question_index + 1] : null

  const handleSubmit = useCallback(async () => {
    if (!input.trim() || evaluating || !question || !course || !user) return

    const userMsg: Message = {
      id: `u${Date.now()}`,
      role: 'user',
      content: input.trim(),
      timestamp: Date.now(),
    }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setEvaluating(true)

    try {
      const result = await evaluateAnswer(question.text, userMsg.content)
      const xpEarned = calculateXP(result.status, question.xpBonus, streak)

      const fullResult: EvaluationResult = { ...result, xpEarned }
      setEvaluation(fullResult)

      // AI feedback message
      const aiMsg: Message = {
        id: `a${Date.now()}`,
        role: 'assistant',
        content: result.feedback,
        timestamp: Date.now(),
      }
      setMessages((prev) => [...prev, aiMsg])

      // Persist to Firestore (client-side, authenticated)
      const updatedQuestions = course.questions.map((q) =>
        q.id === questionId
          ? { ...q, status: result.status, xpEarned }
          : q
      )
      await updateDoc(doc(db, 'courses', courseId), {
        questions: updatedQuestions,
        updatedAt: Date.now(),
      })

      // Award XP + update streak
      await addXP(xpEarned)
      await updateStreak()
    } catch (err) {
      console.error('evaluateAnswer failed:', err)
      setMessages((prev) => [...prev, {
        id: `err${Date.now()}`,
        role: 'assistant',
        content: 'Something went wrong. Please try again.',
        timestamp: Date.now(),
      }])
    } finally {
      setEvaluating(false)
    }
  }, [input, evaluating, question, course, user, streak, questionId, courseId, addXP, updateStreak])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  // Auto-resize textarea
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
    const el = e.target
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`
  }

  if (authLoading || courseLoading) return null

  if (!question) {
    return (
      <AppShell showNav={false}>
        <div className="flex flex-col items-center justify-center min-h-dvh gap-4 px-4">
          <p className="text-[var(--text-secondary)]">Question not found.</p>
          <button onClick={() => router.push(`/course/${courseId}`)} className="text-sm text-[var(--accent)] underline">
            Back to course
          </button>
        </div>
      </AppShell>
    )
  }

  const isAnswered = evaluation !== null && question.status !== 'pending'
  const canAnswer = !isAnswered && !evaluating

  return (
    <AppShell showNav={false}>
      <div className="flex flex-col h-dvh">

        {/* Top bar */}
        <div className="flex items-center gap-2 px-4 h-14 border-b border-[var(--border)] bg-[var(--bg-surface)] flex-shrink-0">
          <button
            onClick={() => router.push(`/course/${courseId}`)}
            className="p-1.5 rounded-[var(--radius-md)] text-[var(--text-muted)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)] transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>

          <div className="flex-1 flex items-center gap-2 min-w-0">
            <span className="text-xs font-mono text-[var(--text-disabled)] flex-shrink-0">
              #{question.order}
            </span>
            <span className="text-xs text-[var(--text-muted)] truncate">
              {course?.title}
            </span>
          </div>

          {/* Prev / Next nav */}
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={() => prevQuestion && router.push(`/course/${courseId}/${prevQuestion.id}`)}
              disabled={!prevQuestion}
              className="p-1.5 rounded-[var(--radius-md)] text-[var(--text-muted)] hover:bg-[var(--bg-elevated)] disabled:opacity-30 disabled:pointer-events-none transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <span className="text-[10px] text-[var(--text-disabled)] px-0.5">
              {question.order}/{sortedQuestions.length}
            </span>
            <button
              onClick={() => nextQuestion && router.push(`/course/${courseId}/${nextQuestion.id}`)}
              disabled={!nextQuestion}
              className="p-1.5 rounded-[var(--radius-md)] text-[var(--text-muted)] hover:bg-[var(--bg-elevated)] disabled:opacity-30 disabled:pointer-events-none transition-colors"
            >
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Chat messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">
          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className={cn('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}
              >
                <div className={cn(
                  'max-w-[85%] px-4 py-3 rounded-[var(--radius-lg)] text-sm leading-relaxed',
                  msg.role === 'user'
                    ? 'bg-[var(--accent)] text-white rounded-br-sm'
                    : 'bg-[var(--bg-elevated)] text-[var(--text-primary)] rounded-bl-sm border border-[var(--border)]'
                )}>
                  {msg.content}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Typing indicator */}
          {evaluating && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-start"
            >
              <div className="px-4 py-3 rounded-[var(--radius-lg)] rounded-bl-sm bg-[var(--bg-elevated)] border border-[var(--border)]">
                <div className="flex gap-1 items-center h-4">
                  {[0, 1, 2].map((i) => (
                    <motion.span
                      key={i}
                      className="h-1.5 w-1.5 rounded-full bg-[var(--text-muted)]"
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* Evaluation result card */}
          <AnimatePresence>
            {evaluation && evaluation.status !== undefined && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', damping: 20 }}
              >
                {(() => {
                  const cfg = STATUS_CONFIG[evaluation.status]
                  const Icon = cfg.icon
                  return (
                    <div className={cn(
                      'rounded-[var(--radius-lg)] border p-4 flex flex-col gap-3',
                      cfg.bg
                    )}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Icon className={cn('h-4 w-4', cfg.color)} />
                          <span className={cn('text-sm font-semibold', cfg.color)}>{cfg.label}</span>
                          <span className="text-xs text-[var(--text-muted)]">
                            score: {evaluation.score}/100
                          </span>
                        </div>
                        {evaluation.xpEarned > 0 && (
                          <div className="flex items-center gap-1 text-yellow-400">
                            <Zap className="h-3.5 w-3.5" />
                            <span className="text-xs font-semibold">+{evaluation.xpEarned} XP</span>
                          </div>
                        )}
                      </div>

                      {evaluation.codeExample && (
                        <pre className="text-xs bg-[var(--bg-base)] rounded-[var(--radius-md)] p-3 overflow-x-auto text-[var(--text-secondary)] leading-relaxed">
                          <code>{evaluation.codeExample}</code>
                        </pre>
                      )}

                      {/* Next question CTA */}
                      {nextQuestion ? (
                        <Button
                          variant="subtle"
                          size="sm"
                          className="self-end"
                          rightIcon={<ArrowRight className="h-3.5 w-3.5" />}
                          onClick={() => router.push(`/course/${courseId}/${nextQuestion.id}`)}
                        >
                          Next question
                        </Button>
                      ) : (
                        <Button
                          variant="subtle"
                          size="sm"
                          className="self-end"
                          onClick={() => router.push(`/course/${courseId}`)}
                        >
                          Back to course
                        </Button>
                      )}
                    </div>
                  )
                })()}
              </motion.div>
            )}
          </AnimatePresence>

          <div ref={bottomRef} />
        </div>

        {/* Input area */}
        <div className={cn(
          'flex-shrink-0 px-4 py-3 border-t border-[var(--border)] bg-[var(--bg-surface)]',
          'pb-[max(12px,env(safe-area-inset-bottom))]'
        )}>
          {isAnswered ? (
            <p className="text-center text-xs text-[var(--text-muted)] py-1">
              Already answered · {nextQuestion ? 'tap Next to continue' : 'course complete!'}
            </p>
          ) : (
            <div className="flex items-end gap-2">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="Type your answer… (Enter to send)"
                rows={1}
                disabled={!canAnswer}
                className={cn(
                  'flex-1 resize-none px-3 py-2.5 rounded-[var(--radius-lg)]',
                  'bg-[var(--bg-input)] border border-[var(--border)]',
                  'text-sm text-[var(--text-primary)] placeholder:text-[var(--text-disabled)]',
                  'focus:outline-none focus:border-[var(--accent)] transition-colors',
                  'disabled:opacity-50 leading-relaxed'
                )}
                style={{ minHeight: '42px' }}
              />
              <button
                onClick={handleSubmit}
                disabled={!input.trim() || !canAnswer}
                className={cn(
                  'flex-shrink-0 h-[42px] w-[42px] flex items-center justify-center',
                  'rounded-[var(--radius-lg)] transition-all',
                  input.trim() && canAnswer
                    ? 'bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)]'
                    : 'bg-[var(--bg-elevated)] text-[var(--text-disabled)]'
                )}
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

      </div>
    </AppShell>
  )
}
