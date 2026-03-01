'use client'

import { useState, useEffect } from 'react'
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  getDoc,
  limit,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from './useAuth'
import type { Course } from '@/types'

export function useCourses() {
  const { user } = useAuth()
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setCourses([])
      setLoading(false)
      return
    }

    const q = query(
      collection(db, 'courses'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    )

    const unsubscribe = onSnapshot(q, (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Course))
      setCourses(data)
      setLoading(false)
    })

    return unsubscribe
  }, [user])

  return { courses, loading }
}

export function useCourse(courseId: string) {
  const [course, setCourse] = useState<Course | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!courseId) return

    const ref = doc(db, 'courses', courseId)
    const unsubscribe = onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        setCourse({ id: snap.id, ...snap.data() } as Course)
      } else {
        setCourse(null)
      }
      setLoading(false)
    })

    return unsubscribe
  }, [courseId])

  return { course, loading }
}

export function usePublicCourses(maxItems = 20) {
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const q = query(
      collection(db, 'courses'),
      where('isPublic', '==', true),
      limit(maxItems)
    )

    const unsubscribe = onSnapshot(q, (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Course))
      setCourses(data)
      setLoading(false)
    })

    return unsubscribe
  }, [maxItems])

  return { courses, loading }
}
