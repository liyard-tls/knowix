'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, ArrowRight, Send, Zap, CheckCircle2, MinusCircle, XCircle, FlaskConical, MessageSquare, Code2, Loader2 } from 'lucide-react'
import { doc, updateDoc, getDoc, setDoc } from 'firebase/firestore'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { db } from '@/lib/firebase'
import { useAuth } from '@/hooks/useAuth'
import { useCourse } from '@/hooks/useCourse'
import { useStreak } from '@/hooks/useStreak'
import { useUserContext } from '@/context'
import { sendChatMessage, generateExamples, type ChatMessage, type CodeExample } from '@/actions/chat.actions'
import { calculateXP } from '@/config/gamification'
import { AppShell } from '@/components/layout'
import { CodeBlock } from '@/components/atoms'
import { cn } from '@/lib/cn'
import type { EvaluationResult } from '@/types'

// ─── Markdown renderer ────────────────────────────────────────────────────────

function MarkdownContent({ content, className }: { content: string; className?: string }) {
  return (
    <div className={cn(className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
          strong: ({ children }) => (
            <strong className="font-semibold text-[var(--text-primary)]">{children}</strong>
          ),
          em: ({ children }) => (
            <em className="text-[var(--accent)] not-italic font-medium">{children}</em>
          ),
          code: ({ children, className: cls }) => {
            const langMatch = cls?.match(/language-(\S+)/)
            if (langMatch) {
              return (
                <CodeBlock
                  code={String(children).replace(/\n$/, '')}
                  lang={langMatch[1]}
                  className="my-3"
                />
              )
            }
            return (
              <code className="px-1.5 py-0.5 rounded-[var(--radius-sm)] bg-[var(--bg-elevated)] text-[var(--accent)] text-[0.8em] font-mono border border-[var(--border)]">
                {children}
              </code>
            )
          },
          ul: ({ children }) => <ul className="my-2 ml-4 space-y-1 list-disc">{children}</ul>,
          ol: ({ children }) => <ol className="my-2 ml-4 space-y-1 list-decimal">{children}</ol>,
          li: ({ children }) => <li className="text-[var(--text-secondary)] leading-relaxed">{children}</li>,
          h3: ({ children }) => <h3 className="text-sm font-semibold text-[var(--text-primary)] mt-3 mb-1">{children}</h3>,
          blockquote: ({ children }) => (
            <blockquote className="my-2 pl-3 border-l-2 border-[var(--accent)] text-[var(--text-muted)] italic">
              {children}
            </blockquote>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  correct:   { icon: CheckCircle2, color: 'text-emerald-400', label: 'Correct',   accent: 'var(--success)' },
  partial:   { icon: MinusCircle,  color: 'text-yellow-400',  label: 'Partial',   accent: 'var(--warning)' },
  incorrect: { icon: XCircle,      color: 'text-red-400',     label: 'Incorrect', accent: 'var(--error)' },
}

// ─── Separator ────────────────────────────────────────────────────────────────

function Separator({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 my-1">
      <div className="flex-1 h-px bg-[var(--border)]" />
      <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-disabled)]">
        {label}
      </span>
      <div className="flex-1 h-px bg-[var(--border)]" />
    </div>
  )
}

// ─── Examples tab ─────────────────────────────────────────────────────────────

function ExamplesTab({
  examples,
  loading,
}: {
  examples: CodeExample[]
  loading: boolean
}) {
  const [expanded, setExpanded] = useState<number | null>(0)

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 gap-3 text-[var(--text-muted)]">
        <Loader2 className="h-5 w-5 animate-spin" />
        <p className="text-sm">Generating examples…</p>
      </div>
    )
  }

  if (!examples.length) {
    return (
      <div className="flex items-center justify-center flex-1 text-sm text-[var(--text-muted)]">
        No examples available.
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
      {examples.map((ex, idx) => (
        <div
          key={idx}
          className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-surface)] overflow-hidden"
        >
          {/* Header */}
          <button
            onClick={() => setExpanded(expanded === idx ? null : idx)}
            className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-[var(--bg-elevated)] transition-colors"
          >
            <div className="flex-shrink-0 mt-0.5">
              <Code2 className="h-4 w-4 text-[var(--accent)]" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-sm font-medium text-[var(--text-primary)] truncate">{ex.title}</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[var(--bg-elevated)] text-[var(--text-muted)] flex-shrink-0">
                  {ex.language}
                </span>
              </div>
              <p className="text-xs text-[var(--text-muted)] leading-snug">{ex.explanation}</p>
            </div>
            <span className="flex-shrink-0 text-[var(--text-disabled)] text-xs ml-1">
              {expanded === idx ? '▲' : '▼'}
            </span>
          </button>

          {/* Code */}
          <AnimatePresence initial={false}>
            {expanded === idx && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="border-t border-[var(--border)]">
                  <CodeBlock
                    code={ex.code}
                    lang={ex.language}
                    className="rounded-none border-0 border-t-0"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  )
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface StoredMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
  isEvaluation?: boolean
  evaluation?: Omit<EvaluationResult, 'xpEarned'>
}

type Tab = 'chat' | 'examples'

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function QuestionPage() {
  const { id: courseId, questionId } = useParams<{ id: string; questionId: string }>()
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const { course, loading: courseLoading } = useCourse(courseId)
  const { current: streak } = useStreak()
  const { addXP, updateStreak } = useUserContext()

  const [activeTab, setActiveTab] = useState<Tab>('chat')
  const [messages, setMessages] = useState<StoredMessage[]>([])
  const [examples, setExamples] = useState<CodeExample[]>([])
  const [examplesLoading, setExamplesLoading] = useState(false)
  const [historyLoaded, setHistoryLoaded] = useState(false)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (!authLoading && !user) router.push('/login')
  }, [user, authLoading, router])

  const question = course?.questions.find((q) => q.id === questionId)
  const chatDocId = user && courseId && questionId
    ? `${user.uid}_${courseId}_${questionId}`
    : null

  // ── Load chat history from Firestore ──────────────────────────────────────
  useEffect(() => {
    if (!chatDocId || !question || historyLoaded) return

    const load = async () => {
      const ref = doc(db, 'chatHistory', chatDocId)
      const snap = await getDoc(ref)

      if (snap.exists()) {
        const data = snap.data() as { messages: StoredMessage[]; examples?: CodeExample[] }
        setMessages(data.messages ?? [])
        if (data.examples?.length) setExamples(data.examples)
        const evalMsg = data.messages?.find((m) => m.isEvaluation)
        if (evalMsg?.evaluation && question.status !== 'pending') {
          setEvaluation({ ...evalMsg.evaluation, xpEarned: question.xpEarned })
        }
      } else {
        const seed: StoredMessage = {
          id: 'q0',
          role: 'assistant',
          content: question.text,
          timestamp: Date.now(),
        }
        setMessages([seed])
        await setDoc(ref, { messages: [seed], updatedAt: Date.now() })
      }
      setHistoryLoaded(true)
    }

    load()
  }, [chatDocId, question, historyLoaded])

  // ── Auto-scroll ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (activeTab === 'chat') {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, sending, activeTab])

  // ── Navigation ─────────────────────────────────────────────────────────────
  const sortedQuestions = course?.questions.slice().sort((a, b) => a.order - b.order) ?? []
  const questionIndex = sortedQuestions.findIndex((q) => q.id === questionId)
  const prevQuestion = questionIndex > 0 ? sortedQuestions[questionIndex - 1] : null
  const nextQuestion = questionIndex < sortedQuestions.length - 1 ? sortedQuestions[questionIndex + 1] : null

  // ── Save messages to Firestore ─────────────────────────────────────────────
  const saveHistory = useCallback(async (msgs: StoredMessage[]) => {
    if (!chatDocId) return
    // Firestore rejects `undefined` values — strip them by serializing through JSON
    const safe = JSON.parse(JSON.stringify(msgs)) as StoredMessage[]
    await setDoc(doc(db, 'chatHistory', chatDocId), { messages: safe, updatedAt: Date.now() }, { merge: true })
  }, [chatDocId])

  // ── Switch tab — generate & cache examples on first open ──────────────────
  const handleTabSwitch = useCallback(async (tab: Tab) => {
    setActiveTab(tab)
    if (tab !== 'examples' || examples.length > 0 || examplesLoading || !question || !chatDocId) return

    setExamplesLoading(true)
    try {
      const data = await generateExamples(question.text, course?.mode ?? 'tech')
      setExamples(data)
      await setDoc(doc(db, 'chatHistory', chatDocId), { examples: data }, { merge: true })
    } finally {
      setExamplesLoading(false)
    }
  }, [examples.length, examplesLoading, question, chatDocId])

  // ── Send message ───────────────────────────────────────────────────────────
  const send = useCallback(async (forceEvaluate = false) => {
    const text = input.trim()
    if ((!text && !forceEvaluate) || sending || !question || !course || !user) return

    const userMsg: StoredMessage | null = text ? {
      id: `u${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: Date.now(),
    } : null

    const newMessages = userMsg ? [...messages, userMsg] : messages
    if (userMsg) setMessages(newMessages)
    setInput('')
    setSending(true)
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }

    try {
      const historyForAI: ChatMessage[] = newMessages
        .filter((m) => m.id !== 'q0')
        .map((m) => ({ role: m.role, content: m.content }))

      const response = await sendChatMessage(question.text, historyForAI, forceEvaluate, course.mode ?? 'tech')

      const evalData = response.evaluation
        ? {
            status: response.evaluation.status,
            score: response.evaluation.score,
            feedback: response.evaluation.feedback,
            codeExample: response.evaluation.codeExample === null ? undefined : response.evaluation.codeExample,
          }
        : undefined

      const aiMsg: StoredMessage = {
        id: `a${Date.now()}`,
        role: 'assistant',
        content: response.content,
        timestamp: Date.now(),
        isEvaluation: response.type === 'evaluation',
        evaluation: evalData,
      }

      const finalMessages = [...newMessages, aiMsg]
      setMessages(finalMessages)
      await saveHistory(finalMessages)

      if (response.type === 'evaluation' && response.evaluation) {
        const xpEarned = calculateXP(response.evaluation.status, question.xpBonus, streak)
        const fullEval: EvaluationResult = { ...response.evaluation, xpEarned }
        setEvaluation(fullEval)

        const updatedQuestions = course.questions.map((q) =>
          q.id === questionId ? { ...q, status: response.evaluation!.status, xpEarned } : q
        )
        await updateDoc(doc(db, 'courses', courseId), {
          questions: updatedQuestions,
          updatedAt: Date.now(),
        })

        await addXP(xpEarned)
        await updateStreak()
      }
    } catch (err) {
      console.error('chat send failed:', err)
      const errMsg: StoredMessage = {
        id: `err${Date.now()}`,
        role: 'assistant',
        content: 'Something went wrong. Please try again.',
        timestamp: Date.now(),
      }
      const finalMessages = [...newMessages, errMsg]
      setMessages(finalMessages)
      await saveHistory(finalMessages)
    } finally {
      setSending(false)
    }
  }, [input, sending, question, course, user, messages, courseId, questionId, streak, addXP, updateStreak, saveHistory])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
    const el = e.target
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`
  }

  // ── Loading / not found states ─────────────────────────────────────────────
  if (authLoading || courseLoading || !historyLoaded) return null

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

  const hasEvaluation = evaluation !== null

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <AppShell showNav={false}>
      <div className="flex flex-col h-dvh bg-[var(--bg-base)]">

        {/* ── Top bar ── */}
        <div className="flex items-center gap-2 px-3 h-13 border-b border-[var(--border)] bg-[var(--bg-surface)] flex-shrink-0">
          <button
            onClick={() => router.push(`/course/${courseId}`)}
            className="p-1.5 rounded-[var(--radius-md)] text-[var(--text-muted)] hover:bg-[var(--bg-elevated)] transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>

          <div className="flex-1 min-w-0">
            <p className="text-xs text-[var(--text-muted)] truncate leading-tight">{course?.title}</p>
          </div>

          <div className="flex items-center gap-0.5 flex-shrink-0">
            <button
              onClick={() => prevQuestion && router.push(`/course/${courseId}/${prevQuestion.id}`)}
              disabled={!prevQuestion}
              className="p-1.5 rounded-[var(--radius-md)] text-[var(--text-muted)] hover:bg-[var(--bg-elevated)] disabled:opacity-25 disabled:pointer-events-none transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
            </button>
            <span className="text-[10px] text-[var(--text-disabled)] px-1 tabular-nums">
              {question.order}/{sortedQuestions.length}
            </span>
            <button
              onClick={() => nextQuestion && router.push(`/course/${courseId}/${nextQuestion.id}`)}
              disabled={!nextQuestion}
              className="p-1.5 rounded-[var(--radius-md)] text-[var(--text-muted)] hover:bg-[var(--bg-elevated)] disabled:opacity-25 disabled:pointer-events-none transition-colors"
            >
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* ── Tab bar ── */}
        <div className="flex items-center border-b border-[var(--border)] bg-[var(--bg-surface)] flex-shrink-0">
          {(['chat', 'examples'] as const).map((tab) => {
            const isActive = activeTab === tab
            return (
              <button
                key={tab}
                onClick={() => handleTabSwitch(tab)}
                className={cn(
                  'flex items-center gap-1.5 px-4 h-10 text-xs font-medium transition-colors relative',
                  isActive
                    ? 'text-[var(--accent)]'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
                )}
              >
                {tab === 'chat' ? (
                  <MessageSquare className="h-3.5 w-3.5" />
                ) : (
                  <Code2 className="h-3.5 w-3.5" />
                )}
                {tab === 'chat' ? 'Chat' : 'Examples'}
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--accent)]" />
                )}
              </button>
            )
          })}
        </div>

        {/* ── Tab content ── */}
        {activeTab === 'examples' ? (
          <ExamplesTab examples={examples} loading={examplesLoading} />
        ) : (
          <>
            {/* ── Chat messages ── */}
            <div className="flex-1 overflow-y-auto px-4 py-4">

              {messages.map((msg, idx) => {
                const isFirst = idx === 0
                const prevMsg = idx > 0 ? messages[idx - 1] : null
                const showSeparator = prevMsg && prevMsg.role !== msg.role

                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.18 }}
                  >
                    {showSeparator && (
                      <Separator label={msg.role === 'user' ? 'You' : 'Knowix AI'} />
                    )}

                    {(isFirst || showSeparator) && (
                      <p className={cn(
                        'text-[10px] font-semibold uppercase tracking-widest mb-1.5 mt-3',
                        msg.role === 'user'
                          ? 'text-[var(--accent)]'
                          : 'text-[var(--text-disabled)]'
                      )}>
                        {isFirst ? 'Question' : msg.role === 'user' ? 'You' : 'Knowix AI'}
                      </p>
                    )}

                    <div className="mb-1">
                      {msg.isEvaluation && msg.evaluation ? (() => {
                        const cfg = STATUS_CONFIG[msg.evaluation.status]
                        const Icon = cfg.icon
                        return (
                          <div className="mb-3">
                            <div className="flex items-center gap-2 mb-3">
                              <Icon className={cn('h-4 w-4', cfg.color)} />
                              <span className={cn('text-sm font-semibold', cfg.color)}>{cfg.label}</span>
                              <span className="text-xs text-[var(--text-disabled)]">
                                {msg.evaluation.score}/100
                              </span>
                              {evaluation?.xpEarned && (
                                <div className="flex items-center gap-1 ml-auto text-yellow-400">
                                  <Zap className="h-3 w-3" />
                                  <span className="text-xs font-semibold">+{evaluation.xpEarned} XP</span>
                                </div>
                              )}
                            </div>

                            <MarkdownContent
                              content={msg.evaluation.feedback}
                              className="text-sm text-[var(--text-secondary)]"
                            />

                            {msg.evaluation.codeExample && (
                              <CodeBlock
                                code={msg.evaluation.codeExample}
                                lang="typescript"
                                className="mt-3"
                              />
                            )}

                            <div className="flex items-center gap-2 mt-4">
                              {nextQuestion ? (
                                <button
                                  onClick={() => router.push(`/course/${courseId}/${nextQuestion.id}`)}
                                  className="flex items-center gap-1.5 text-xs font-medium text-[var(--accent)] hover:underline"
                                >
                                  Next question <ArrowRight className="h-3 w-3" />
                                </button>
                              ) : (
                                <button
                                  onClick={() => router.push(`/course/${courseId}`)}
                                  className="text-xs font-medium text-[var(--accent)] hover:underline"
                                >
                                  Back to course ✓
                                </button>
                              )}
                            </div>
                          </div>
                        )
                      })() : (
                        <MarkdownContent
                          content={msg.content}
                          className={cn(
                            'text-sm',
                            msg.role === 'user'
                              ? 'text-[var(--text-primary)]'
                              : 'text-[var(--text-secondary)]'
                          )}
                        />
                      )}
                    </div>
                  </motion.div>
                )
              })}

              {/* Typing indicator */}
              <AnimatePresence>
                {sending && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="mt-2"
                  >
                    <Separator label="Knowix AI" />
                    <div className="flex items-center gap-1 mt-2 h-5">
                      {[0, 1, 2].map((i) => (
                        <motion.span
                          key={i}
                          className="h-1.5 w-1.5 rounded-full bg-[var(--text-muted)]"
                          animate={{ opacity: [0.3, 1, 0.3] }}
                          transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
                        />
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div ref={bottomRef} />
            </div>

            {/* ── Input area ── */}
            <div className={cn(
              'flex-shrink-0 border-t border-[var(--border)] bg-[var(--bg-surface)]'
            )}>
              {/* Evaluate bar */}
              {!hasEvaluation && (
                <div className="flex items-center justify-between px-4 py-2 border-b border-[var(--border)]">
                  <span className="text-xs text-[var(--text-disabled)]">
                    When ready — evaluate your answer
                  </span>
                  <button
                    onClick={() => send(true)}
                    disabled={sending}
                    className={cn(
                      'flex items-center gap-1.5 px-3 h-7 rounded-[var(--radius-md)]',
                      'text-xs font-medium transition-all border',
                      sending
                        ? 'opacity-30 pointer-events-none border-[var(--border)] text-[var(--text-muted)]'
                        : 'border-[var(--accent)] text-[var(--accent)] hover:bg-[var(--accent-subtle)]'
                    )}
                  >
                    <FlaskConical className="h-3 w-3" />
                    Evaluate
                  </button>
                </div>
              )}

              {/* Input row */}
              <div className="flex items-end gap-2 px-4 pt-2.5 pb-[max(12px,env(safe-area-inset-bottom))]">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  placeholder={hasEvaluation ? 'Ask a follow-up…' : 'Type your answer…'}
                  rows={1}
                  disabled={sending}
                  className={cn(
                    'flex-1 resize-none px-3 py-2.5 rounded-[var(--radius-lg)]',
                    'bg-[var(--bg-input)] border border-[var(--border)]',
                    'text-sm text-[var(--text-primary)] placeholder:text-[var(--text-disabled)]',
                    'focus:outline-none focus:border-[var(--accent)] transition-colors',
                    'disabled:opacity-50 leading-relaxed'
                  )}
                  style={{ minHeight: '42px' }}
                />

                {/* Send button */}
                <button
                  onClick={() => send(false)}
                  disabled={!input.trim() || sending}
                  className={cn(
                    'flex-shrink-0 h-[42px] w-[42px] flex items-center justify-center',
                    'rounded-[var(--radius-lg)] transition-all',
                    input.trim() && !sending
                      ? 'bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)]'
                      : 'bg-[var(--bg-elevated)] text-[var(--text-disabled)]'
                  )}
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          </>
        )}

      </div>
    </AppShell>
  )
}
