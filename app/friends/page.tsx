'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Link2, Check, Users, UserCheck, X, Flame, User } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useFriends } from '@/hooks/useFriends'
import { AppShell } from '@/components/layout'
import { Button, Card, Badge } from '@/components/atoms'
import { t } from '@/lib/i18n'

export default function FriendsPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const { friends, incomingRequests, loading, acceptRequest, declineRequest } = useFriends()
  const [copied, setCopied] = useState(false)
  const [actionUid, setActionUid] = useState<string | null>(null)

  useEffect(() => {
    if (!authLoading && !user) router.push('/login')
  }, [user, authLoading, router])

  if (authLoading || !user) return null

  const handleCopyLink = async () => {
    const url = `${window.location.origin}/u/${user.uid}`
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleAccept = async (requestId: string, fromUid: string) => {
    setActionUid(fromUid)
    try {
      await acceptRequest(requestId, fromUid)
    } finally {
      setActionUid(null)
    }
  }

  const handleDecline = async (requestId: string, fromUid: string) => {
    setActionUid(fromUid)
    try {
      await declineRequest(requestId, fromUid)
    } finally {
      setActionUid(null)
    }
  }

  return (
    <AppShell showNav={false}>
      <div className="flex flex-col min-h-dvh">
        {/* Header */}
        <div className="px-4 pb-4 pt-safe bg-[var(--bg-surface)] border-b border-[var(--border)]">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="p-2 -ml-2 rounded-[var(--radius-md)] text-[var(--text-muted)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)] transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="text-lg font-bold text-[var(--text-primary)] flex-1">
              {t.friends.title}
            </h1>
            <Button
              variant="subtle"
              size="sm"
              leftIcon={copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Link2 className="h-4 w-4" />}
              onClick={handleCopyLink}
            >
              {copied ? t.friends.linkCopied : t.friends.copyLink}
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-6 px-4 pt-6 pb-8">
          {/* Incoming Requests */}
          <AnimatePresence>
            {incomingRequests.length > 0 && (
              <motion.section
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <h2 className="text-sm font-semibold text-[var(--text-secondary)] mb-3">
                  {t.friends.incomingRequests}
                  <span className="ml-2 text-xs text-[var(--accent)] font-bold">
                    {incomingRequests.length}
                  </span>
                </h2>
                <div className="flex flex-col gap-2">
                  {incomingRequests.map((req) => (
                    <motion.div
                      key={req.uid}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 8 }}
                    >
                      <Card variant="elevated" padding="sm">
                        <div className="flex items-center gap-3">
                          {req.photoURL ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={req.photoURL}
                              alt={req.displayName}
                              className="h-10 w-10 rounded-full object-cover ring-1 ring-[var(--border)]"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-[var(--bg-base)] flex items-center justify-center ring-1 ring-[var(--border)]">
                              <User className="h-5 w-5 text-[var(--text-muted)]" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-[var(--text-primary)] truncate">
                              {req.displayName}
                            </p>
                            <div className="flex items-center gap-1 mt-0.5">
                              <Flame className="h-3 w-3 text-orange-400" />
                              <span className="text-[10px] text-[var(--text-muted)]">
                                {req.streak.current}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleDecline(req.requestId, req.uid)}
                              disabled={actionUid === req.uid}
                              className="p-1.5 rounded-[var(--radius-sm)] text-[var(--text-muted)] hover:bg-red-500/10 hover:text-red-400 transition-colors disabled:opacity-50"
                              title={t.friends.decline}
                            >
                              <X className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleAccept(req.requestId, req.uid)}
                              disabled={actionUid === req.uid}
                              className="flex items-center gap-1 px-2.5 py-1 rounded-[var(--radius-sm)] bg-[var(--accent)] text-white text-xs font-medium transition-opacity disabled:opacity-50 hover:opacity-90"
                            >
                              <UserCheck className="h-3.5 w-3.5" />
                              {t.friends.accept}
                            </button>
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </motion.section>
            )}
          </AnimatePresence>

          {/* Friends List */}
          <section>
            <h2 className="text-sm font-semibold text-[var(--text-secondary)] mb-3">
              {friends.length > 0
                ? `${t.friends.title} (${friends.length})`
                : t.friends.title}
            </h2>

            {loading ? (
              <div className="flex flex-col gap-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="skeleton h-16 w-full" />
                ))}
              </div>
            ) : friends.length === 0 ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
                <Card variant="elevated" className="text-center py-10">
                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-[var(--bg-base)] mx-auto mb-3">
                    <Users className="h-6 w-6 text-[var(--text-disabled)]" />
                  </div>
                  <p className="text-sm font-semibold text-[var(--text-primary)] mb-1">
                    {t.friends.empty.title}
                  </p>
                  <p className="text-xs text-[var(--text-muted)] max-w-[220px] mx-auto leading-relaxed">
                    {t.friends.empty.description}
                  </p>
                  <Button
                    variant="subtle"
                    size="sm"
                    className="mt-4"
                    leftIcon={<Link2 className="h-4 w-4" />}
                    onClick={handleCopyLink}
                  >
                    {copied ? t.friends.linkCopied : t.friends.copyLink}
                  </Button>
                </Card>
              </motion.div>
            ) : (
              <div className="flex flex-col gap-2">
                {friends.map((friend, i) => (
                  <motion.div
                    key={friend.uid}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Card
                      variant="default"
                      padding="sm"
                      interactive
                      onClick={() => router.push(`/u/${friend.uid}`)}
                    >
                      <div className="flex items-center gap-3">
                        {friend.photoURL ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={friend.photoURL}
                            alt={friend.displayName}
                            className="h-11 w-11 rounded-full object-cover ring-1 ring-[var(--border)]"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="h-11 w-11 rounded-full bg-[var(--bg-elevated)] flex items-center justify-center ring-1 ring-[var(--border)]">
                            <User className="h-5 w-5 text-[var(--text-muted)]" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-[var(--text-primary)] truncate">
                            {friend.displayName}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <div className="flex items-center gap-1">
                              <Flame className="h-3 w-3 text-orange-400" />
                              <span className="text-[10px] text-[var(--text-muted)]">
                                {friend.streak.current}
                              </span>
                            </div>
                            <span className="text-[var(--border)]">·</span>
                            <span className="text-[10px] text-[var(--text-muted)]">
                              {friend.xp} XP
                            </span>
                          </div>
                        </div>
                        <Badge variant="xp" size="sm">{friend.level}</Badge>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </AppShell>
  )
}
