'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { doc, onSnapshot, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { getLevelByXP, getStreakMultiplier } from '@/config/gamification'
import type { UserProfile, UserStreak } from '@/types'
import { useAuthContext } from './AuthContext'

interface UserContextType {
  profile: UserProfile | null
  loading: boolean
  addXP: (amount: number) => Promise<void>
  updateStreak: () => Promise<void>
}

const UserContext = createContext<UserContextType | null>(null)

export function UserProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuthContext()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  // Синхронізація профілю з Firestore
  useEffect(() => {
    if (!user) {
      setProfile(null)
      setLoading(false)
      return
    }

    const ref = doc(db, 'users', user.uid)

    const unsubscribe = onSnapshot(ref, async (snap) => {
      if (snap.exists()) {
        setProfile(snap.data() as UserProfile)
      } else {
        // Перший вхід — створюємо профіль
        const newProfile: UserProfile = {
          uid: user.uid,
          displayName: user.displayName ?? 'Користувач',
          email: user.email ?? '',
          photoURL: user.photoURL,
          createdAt: Date.now(),
          xp: 0,
          level: 1,
          streak: { current: 0, longest: 0, lastActivity: 0 },
          achievements: [],
        }
        await setDoc(ref, newProfile)
      }
      setLoading(false)
    })

    return unsubscribe
  }, [user])

  const addXP = useCallback(async (amount: number) => {
    if (!user || !profile) return
    const newXP = profile.xp + amount
    const newLevel = getLevelByXP(newXP).level
    const ref = doc(db, 'users', user.uid)
    await setDoc(ref, { xp: newXP, level: newLevel }, { merge: true })
  }, [user, profile])

  const updateStreak = useCallback(async () => {
    if (!user || !profile) return

    const now = Date.now()
    const lastActivity = profile.streak.lastActivity
    const oneDayMs = 24 * 60 * 60 * 1000
    const daysSinceLast = Math.floor((now - lastActivity) / oneDayMs)

    let newStreak = profile.streak

    if (daysSinceLast === 0) {
      // Вже сьогодні відповідали — стрік не змінюємо
      return
    } else if (daysSinceLast === 1) {
      // Вчора відповідали — продовжуємо стрік
      newStreak = {
        current: profile.streak.current + 1,
        longest: Math.max(profile.streak.longest, profile.streak.current + 1),
        lastActivity: now,
      }
    } else {
      // Пропустили день — скидаємо стрік
      newStreak = { current: 1, longest: profile.streak.longest, lastActivity: now }
    }

    const ref = doc(db, 'users', user.uid)
    await setDoc(ref, { streak: newStreak }, { merge: true })
  }, [user, profile])

  return (
    <UserContext.Provider value={{ profile, loading, addXP, updateStreak }}>
      {children}
    </UserContext.Provider>
  )
}

export function useUserContext() {
  const ctx = useContext(UserContext)
  if (!ctx) throw new Error('useUserContext must be used within UserProvider')
  return ctx
}
