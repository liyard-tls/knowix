'use client'

import { useState, useEffect, useCallback } from 'react'
import { doc, getDoc, getDocs, collection, query, where } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useUserContext } from '@/context'
import { useAuth } from './useAuth'
import {
  sendFriendRequest,
  acceptFriendRequest,
  declineFriendRequest,
  removeFriend,
} from '@/actions/friends.actions'
import type { UserProfile, FriendRequest } from '@/types'

export interface FriendWithRequest {
  uid: string
  displayName: string
  photoURL: string | null
  xp: number
  level: number
  streak: { current: number; longest: number; lastActivity: number }
  requestId: string
}

export function useFriends() {
  const { user } = useAuth()
  const { profile } = useUserContext()

  const [friends, setFriends] = useState<UserProfile[]>([])
  const [incomingRequests, setIncomingRequests] = useState<FriendWithRequest[]>([])
  const [loading, setLoading] = useState(true)

  // Resolve friend uids to UserProfile objects
  useEffect(() => {
    const friendUids = profile?.friends ?? []

    if (!user || friendUids.length === 0) {
      setFriends([])
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)

    Promise.all(
      friendUids.map((uid) =>
        getDoc(doc(db, 'users', uid)).then((snap) =>
          snap.exists() ? (snap.data() as UserProfile) : null
        )
      )
    ).then((results) => {
      if (cancelled) return
      setFriends(results.filter((p): p is UserProfile => p !== null))
      setLoading(false)
    })

    return () => { cancelled = true }
  }, [user, profile?.friends])

  // Resolve incoming request uids to profiles + find request ids
  useEffect(() => {
    const incomingUids = profile?.friendRequestsIn ?? []

    if (!user || incomingUids.length === 0) {
      setIncomingRequests([])
      return
    }

    let cancelled = false

    Promise.all(
      incomingUids.map(async (fromUid) => {
        const [profileSnap, reqSnap] = await Promise.all([
          getDoc(doc(db, 'users', fromUid)),
          getDocs(
            query(
              collection(db, 'friendRequests'),
              where('from', '==', fromUid),
              where('to', '==', user.uid),
              where('status', '==', 'pending')
            )
          ),
        ])

        if (!profileSnap.exists() || reqSnap.empty) return null

        const p = profileSnap.data() as UserProfile
        return {
          uid: fromUid,
          displayName: p.displayName,
          photoURL: p.photoURL,
          xp: p.xp,
          level: p.level,
          streak: p.streak,
          requestId: reqSnap.docs[0].id,
        } satisfies FriendWithRequest
      })
    ).then((results) => {
      if (cancelled) return
      setIncomingRequests(results.filter((r): r is FriendWithRequest => r !== null))
    })

    return () => { cancelled = true }
  }, [user, profile?.friendRequestsIn])

  const sendRequest = useCallback(
    async (targetUid: string) => {
      if (!user) return
      await sendFriendRequest(user.uid, targetUid)
    },
    [user]
  )

  const acceptRequest = useCallback(
    async (requestId: string, fromUid: string) => {
      if (!user) return
      await acceptFriendRequest(requestId, fromUid, user.uid)
    },
    [user]
  )

  const declineRequest = useCallback(
    async (requestId: string, fromUid: string) => {
      if (!user) return
      await declineFriendRequest(requestId, fromUid, user.uid)
    },
    [user]
  )

  const removeCurrentFriend = useCallback(
    async (friendUid: string) => {
      if (!user) return
      await removeFriend(user.uid, friendUid)
    },
    [user]
  )

  return {
    friends,
    incomingRequests,
    loading,
    sendRequest,
    acceptRequest,
    declineRequest,
    removeFriend: removeCurrentFriend,
  }
}
