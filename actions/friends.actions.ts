// Client-side Firestore helpers — NOT a server action.
// Runs in the browser with the signed-in user's auth context so Firestore
// Security Rules can verify the caller's identity.

import {
  collection,
  doc,
  writeBatch,
  arrayUnion,
  arrayRemove,
  query,
  where,
  getDocs,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'

/**
 * Send a friend request from fromUid to toUid.
 * Creates a friendRequests doc and adds fromUid to toUid.friendRequestsIn.
 */
export async function sendFriendRequest(fromUid: string, toUid: string): Promise<string> {
  if (fromUid === toUid) throw new Error('Cannot send a friend request to yourself')

  // Check for existing pending request
  const existing = await getDocs(
    query(
      collection(db, 'friendRequests'),
      where('from', '==', fromUid),
      where('to', '==', toUid),
      where('status', '==', 'pending')
    )
  )
  if (!existing.empty) throw new Error('Friend request already sent')

  const batch = writeBatch(db)

  // Create request doc
  const requestRef = doc(collection(db, 'friendRequests'))
  batch.set(requestRef, {
    from: fromUid,
    to: toUid,
    status: 'pending',
    createdAt: Date.now(),
  })

  // Add fromUid to target user's friendRequestsIn
  batch.update(doc(db, 'users', toUid), {
    friendRequestsIn: arrayUnion(fromUid),
  })

  await batch.commit()
  return requestRef.id
}

/**
 * Accept a friend request.
 * Adds each uid to the other's friends[] and clears the incoming request.
 */
export async function acceptFriendRequest(
  requestId: string,
  fromUid: string,
  toUid: string
): Promise<void> {
  const batch = writeBatch(db)

  batch.update(doc(db, 'friendRequests', requestId), { status: 'accepted' })
  batch.update(doc(db, 'users', toUid), {
    friends: arrayUnion(fromUid),
    friendRequestsIn: arrayRemove(fromUid),
  })
  batch.update(doc(db, 'users', fromUid), {
    friends: arrayUnion(toUid),
  })

  await batch.commit()
}

/**
 * Decline a friend request.
 */
export async function declineFriendRequest(
  requestId: string,
  fromUid: string,
  toUid: string
): Promise<void> {
  const batch = writeBatch(db)

  batch.update(doc(db, 'friendRequests', requestId), { status: 'declined' })
  batch.update(doc(db, 'users', toUid), {
    friendRequestsIn: arrayRemove(fromUid),
  })

  await batch.commit()
}

/**
 * Remove an existing friendship (both directions).
 */
export async function removeFriend(uid1: string, uid2: string): Promise<void> {
  const batch = writeBatch(db)

  batch.update(doc(db, 'users', uid1), { friends: arrayRemove(uid2) })
  batch.update(doc(db, 'users', uid2), { friends: arrayRemove(uid1) })

  await batch.commit()
}

/**
 * Get the pending request doc id sent from fromUid to toUid (if any).
 */
export async function getPendingRequestId(
  fromUid: string,
  toUid: string
): Promise<string | null> {
  const snap = await getDocs(
    query(
      collection(db, 'friendRequests'),
      where('from', '==', fromUid),
      where('to', '==', toUid),
      where('status', '==', 'pending')
    )
  )
  return snap.empty ? null : snap.docs[0].id
}

/**
 * Get the pending incoming request id from fromUid to toUid (reverse lookup).
 */
export async function getIncomingRequestId(
  fromUid: string,
  toUid: string
): Promise<string | null> {
  // fromUid sent TO toUid — we want the doc where from=fromUid, to=toUid
  return getPendingRequestId(fromUid, toUid)
}
