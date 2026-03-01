'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft, UserPlus, UserCheck, Clock, User, Flame, Zap, UserX } from 'lucide-react'
import { doc, getDoc, getDocs, collection, query, where } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/hooks/useAuth'
import { useUserContext } from '@/context'
import { getLevelByXP, getXPProgress } from '@/config/gamification'
import { AppShell } from '@/components/layout'
import { Button, Card, Badge, ProgressBar } from '@/components/atoms'
import {
  sendFriendRequest,
  acceptFriendRequest,
  declineFriendRequest,
  removeFriend,
  getPendingRequestId,
} from '@/actions/friends.actions'
import { t } from '@/lib/i18n'
import type { UserProfile } from '@/types'

type RelationState =
  | 'loading'
  | 'self'
  | 'friends'
  | 'request_sent'       // current user sent request to them
  | 'request_incoming'   // they sent request to current user
  | 'none'

export default function PublicProfilePage() {
  const { uid } = useParams<{ uid: string }>()
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const { profile: myProfile } = useUserContext()

  const [targetProfile, setTargetProfile] = useState<UserProfile | null>(null)
  const [profileLoading, setProfileLoading] = useState(true)
  const [relation, setRelation] = useState<RelationState>('loading')
  const [incomingRequestId, setIncomingRequestId] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  // Auth guard
  useEffect(() => {
    if (!authLoading && !user) router.push('/login')
  }, [user, authLoading, router])

  // Redirect if own profile
  useEffect(() => {
    if (user && uid === user.uid) router.replace('/profile')
  }, [user, uid, router])

  // Load target profile
  useEffect(() => {
    if (!uid) return
    let cancelled = false

    getDoc(doc(db, 'users', uid)).then((snap) => {
      if (cancelled) return
      setTargetProfile(snap.exists() ? (snap.data() as UserProfile) : null)
      setProfileLoading(false)
    })

    return () => { cancelled = true }
  }, [uid])

  // Determine relationship state
  useEffect(() => {
    if (!user || !myProfile || !uid || profileLoading) return
    let cancelled = false

    async function resolveRelation() {
      if (!user || !myProfile) return

      const isFriend = (myProfile.friends ?? []).includes(uid)
      if (isFriend) {
        if (!cancelled) setRelation('friends')
        return
      }

      const isIncoming = (myProfile.friendRequestsIn ?? []).includes(uid)
      if (isIncoming) {
        // Find the request id
        const snap = await getDocs(
          query(
            collection(db, 'friendRequests'),
            where('from', '==', uid),
            where('to', '==', user.uid),
            where('status', '==', 'pending')
          )
        )
        if (!cancelled) {
          setIncomingRequestId(snap.empty ? null : snap.docs[0].id)
          setRelation('request_incoming')
        }
        return
      }

      // Check if current user already sent a request
      const sentId = await getPendingRequestId(user.uid, uid)
      if (!cancelled) {
        setRelation(sentId ? 'request_sent' : 'none')
      }
    }

    resolveRelation()
    return () => { cancelled = true }
  }, [user, myProfile, uid, profileLoading])

  const handleAddFriend = useCallback(async () => {
    if (!user) return
    setActionLoading(true)
    try {
      await sendFriendRequest(user.uid, uid)
      setRelation('request_sent')
    } finally {
      setActionLoading(false)
    }
  }, [user, uid])

  const handleAccept = useCallback(async () => {
    if (!user || !incomingRequestId) return
    setActionLoading(true)
    try {
      await acceptFriendRequest(incomingRequestId, uid, user.uid)
      setRelation('friends')
    } finally {
      setActionLoading(false)
    }
  }, [user, uid, incomingRequestId])

  const handleRemove = useCallback(async () => {
    if (!user) return
    setActionLoading(true)
    try {
      await removeFriend(user.uid, uid)
      setRelation('none')
    } finally {
      setActionLoading(false)
    }
  }, [user, uid])

  if (authLoading || !user) return null

  const level = targetProfile ? getLevelByXP(targetProfile.xp) : null
  const progress = targetProfile ? getXPProgress(targetProfile.xp) : null

  return (
    <AppShell showNav={false}>
      <div className="flex flex-col min-h-dvh">
        {/* Header */}
        <div className="px-4 pb-4 pt-safe bg-[var(--bg-surface)] border-b border-[var(--border)]">
          <button
            onClick={() => router.back()}
            className="p-2 -ml-2 rounded-[var(--radius-md)] text-[var(--text-muted)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)] transition-colors mb-2"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
        </div>

        {profileLoading || relation === 'loading' ? (
          <div className="flex flex-col gap-4 px-4 pt-6">
            <div className="flex items-center gap-4">
              <div className="skeleton h-16 w-16 rounded-full" />
              <div className="flex flex-col gap-2 flex-1">
                <div className="skeleton h-5 w-36" />
                <div className="skeleton h-3 w-24" />
              </div>
            </div>
            <div className="skeleton h-24 w-full" />
            <div className="skeleton h-10 w-full" />
          </div>
        ) : !targetProfile ? (
          <div className="flex flex-col items-center justify-center flex-1 gap-3 px-4">
            <p className="text-[var(--text-secondary)]">User not found.</p>
            <button
              onClick={() => router.back()}
              className="text-sm text-[var(--accent)] underline"
            >
              Go back
            </button>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col gap-4 px-4 pt-6 pb-8"
          >
            {/* Avatar + name */}
            <Card variant="elevated" padding="md">
              <div className="flex items-center gap-4">
                {targetProfile.photoURL ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={targetProfile.photoURL}
                    alt={targetProfile.displayName}
                    className="h-16 w-16 rounded-full object-cover ring-2 ring-[var(--border)]"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="h-16 w-16 rounded-full bg-[var(--bg-base)] flex items-center justify-center ring-2 ring-[var(--border)]">
                    <User className="h-8 w-8 text-[var(--text-muted)]" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[var(--text-primary)] truncate text-lg">
                    {targetProfile.displayName}
                  </p>
                  {level && <Badge variant="xp" size="sm" className="mt-1">{level.title}</Badge>}
                </div>
              </div>
            </Card>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3">
              <Card variant="elevated" padding="sm" className="flex flex-col gap-1 items-center text-center">
                <Flame className="h-5 w-5 text-orange-400" />
                <p className="text-2xl font-bold text-[var(--text-primary)]">
                  {targetProfile.streak.current}
                </p>
                <p className="text-[10px] text-[var(--text-muted)]">Day streak</p>
              </Card>
              <Card variant="elevated" padding="sm" className="flex flex-col gap-1 items-center text-center">
                <Zap className="h-5 w-5 text-yellow-400" />
                <p className="text-2xl font-bold text-[var(--text-primary)]">
                  {targetProfile.xp}
                </p>
                <p className="text-[10px] text-[var(--text-muted)]">Total XP</p>
              </Card>
            </div>

            {/* Level progress */}
            {level && progress && (
              <Card variant="default" padding="md">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-[var(--text-primary)]">
                    Level {level.level} — {level.title}
                  </span>
                  <span className="text-xs text-[var(--text-muted)]">{progress.percent}%</span>
                </div>
                <ProgressBar value={progress.current} max={progress.needed} variant="xp" size="sm" />
              </Card>
            )}

            {/* Relationship action */}
            <div className="mt-2">
              {relation === 'none' && (
                <Button
                  variant="primary"
                  size="lg"
                  className="w-full"
                  leftIcon={<UserPlus className="h-5 w-5" />}
                  onClick={handleAddFriend}
                  loading={actionLoading}
                >
                  {t.friends.addFriend}
                </Button>
              )}

              {relation === 'request_sent' && (
                <Button
                  variant="ghost"
                  size="lg"
                  className="w-full"
                  leftIcon={<Clock className="h-5 w-5" />}
                  disabled
                >
                  {t.friends.requestSent}
                </Button>
              )}

              {relation === 'request_incoming' && (
                <Button
                  variant="primary"
                  size="lg"
                  className="w-full"
                  leftIcon={<UserCheck className="h-5 w-5" />}
                  onClick={handleAccept}
                  loading={actionLoading}
                >
                  {t.friends.acceptRequest}
                </Button>
              )}

              {relation === 'friends' && (
                <Button
                  variant="ghost"
                  size="lg"
                  className="w-full text-[var(--text-muted)]"
                  leftIcon={<UserX className="h-5 w-5" />}
                  onClick={handleRemove}
                  loading={actionLoading}
                >
                  {t.friends.remove}
                </Button>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </AppShell>
  )
}
